import { AutofillMatcher } from './AutofillMatcher';
import { AutofillSaver } from './AutofillSaver';
import { FormField, faker } from '../../utils/helper';

export class AutofillService {
    private static lastFilledValues = new Map<string, string>();

    public static async fillForm(url: string, automatic: boolean = false, profile?: string): Promise<void> {
        const settings = await AutofillSaver.getSettings();
        const activeProfile = profile || settings.currentProfile || 'Padrão';
        
        // Block if globally disabled or if site is blacklisted
        const currentOrigin = new URL(url).origin;
        const isBlacklisted = settings.blacklistedSites?.includes(currentOrigin);
        
        if (settings.enabled === false || isBlacklisted) {
            return;
        }

        const fields = await AutofillSaver.getFieldsForUrl(url, activeProfile);
        if (!fields || fields.length === 0) return;
        fields.forEach((field: FormField) => {
            let elements: (HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement)[] = [];
            
            if (field.id) {
                const el = document.getElementById(field.id);
                if (el) elements = [el as any];
            } else if (field.name) {
                let sel = `[name="${field.name}"]`;
                if ((field.type === 'checkbox' || field.type === 'radio') && field.attrValue) {
                    sel += `[value="${CSS.escape(field.attrValue)}"]`;
                }
                elements = Array.from(document.querySelectorAll(sel)) as any;
            } else if (field.label) {
                // Fallback: search by label text
                const labels = Array.from(document.querySelectorAll('label'));
                const targetLabel = labels.find(l => l.textContent?.trim().toLowerCase() === field.label?.toLowerCase());
                if (targetLabel) {
                    if (targetLabel.htmlFor) {
                        const el = document.getElementById(targetLabel.htmlFor);
                        if (el) elements = [el as any];
                    }
                    if (elements.length === 0) {
                        const inner = targetLabel.querySelector('input, textarea, select');
                        if (inner) elements = [inner as any];
                    }
                }
            }

            if (elements.length === 0) return;

            elements.forEach((el) => {
                if (field.type && el.type !== field.type && field.type !== 'text') {
                    if ((field.type === 'checkbox' || field.type === 'radio') && el.type !== field.type) {
                        return;
                    }
                }

                if (automatic) {
                    if (el.type !== 'checkbox' && el.type !== 'radio' && el.value) {
                        return;
                    }
                }

                let valueToSet = field.value;
                if (field.fakerType) {
                    valueToSet = this.generateFakerValue(field.fakerType);
                } else if (field.useUuid) {
                    valueToSet = this.generateUuid();
                }

                // Store for override detection
                this.lastFilledValues.set(this.createKey(field), String(valueToSet));

                this.setElementValue(el, valueToSet);
            });
        });
    }

    public static async captureAndSave(url: string, profile: string = 'Padrão'): Promise<{ success: boolean; message: string; count?: number }> {
        const fields = AutofillMatcher.getFieldsToSave();
        if (fields.length === 0) {
            return { success: false, message: 'Nenhum campo encontrado para salvar!' };
        }

        const existingFields = await AutofillSaver.getFieldsForUrl(url, profile);
        const mergedFields = this.mergeFields(existingFields, fields);

        await AutofillSaver.saveFieldsForUrl(url, mergedFields, profile);

        return {
            success: true,
            message: `Formulário salvo no perfil "${profile}"! ${fields.length} campo(s) capturado(s). Total: ${mergedFields.length} campo(s) salvos.`,
            count: mergedFields.length
        };
    }

    public static async smartFillAndSave(url: string, profile: string = 'Padrão'): Promise<{ success: boolean; message: string }> {
        const settings = await AutofillSaver.getSettings();
        const currentOrigin = new URL(url).origin;
        if (settings.blacklistedSites?.includes(currentOrigin)) {
            return { success: false, message: 'Site na blacklist!' };
        }

        const fields = AutofillMatcher.getFieldsToSave();
        if (fields.length === 0) return { success: false, message: 'Nenhum campo detectado!' };

        // Fill immediately with guessed values
        fields.forEach(field => {
            let value = field.value;
            if (field.fakerType) value = this.generateFakerValue(field.fakerType);
            
            let selector = "";
            if (field.name) selector += `[name="${field.name}"]`;
            if (field.id) selector += (selector ? ", " : "") + `#${CSS.escape(field.id)}`;
            
            const elements = document.querySelectorAll(selector) as NodeListOf<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>;
            elements.forEach(el => this.setElementValue(el, value));
        });

        // Save structure
        await AutofillSaver.saveFieldsForUrl(url, fields, profile);
        return { success: true, message: `Campos detectados, preenchidos e salvos no perfil "${profile}"!` };
    }

    private static mergeFields(existing: FormField[], incoming: FormField[]): FormField[] {
        const existingMap = new Map(existing.map(f => [this.createKey(f), f]));
        const incomingMap = new Map(incoming.map(f => [this.createKey(f), f]));

        const merged: FormField[] = [];

        // Update or add incoming
        incoming.forEach(f => {
            const key = this.createKey(f);
            if (existingMap.has(key)) {
                const old = existingMap.get(key);
                
                // Detection of manual override
                const wasFaker = !!old?.fakerType;
                const lastFilledValue = this.lastFilledValues.get(key);
                
                let isChanged = false;
                const currentVal = String(f.value || '').trim();
                
                if (lastFilledValue !== undefined) {
                    const lastVal = String(lastFilledValue).trim();
                    isChanged = lastVal !== currentVal;
                    console.log(`[AutoFill] Key: ${key} | Last Filled: "${lastVal}" | Current: "${currentVal}" | Changed: ${isChanged} | wasFaker: ${wasFaker}`);
                } else if (old) {
                    const storedVal = String(old.value || '').trim();
                    isChanged = storedVal !== currentVal;
                    console.log(`[AutoFill] Key: ${key} | Stored: "${storedVal}" | Current: "${currentVal}" | Changed: ${isChanged} | wasFaker: ${wasFaker}`);
                }

                if (wasFaker && isChanged) {
                    console.log(`[AutoFill] MUDANÇA DETECTADA em ${key}: desativando modo aleatório (Faker).`);
                    f.fakerType = undefined;
                    f.useUuid = false;
                } else {
                    // Restore faker settings if not changed
                    if (old?.fakerType && !f.fakerType) f.fakerType = old.fakerType;
                }

                // UUID is exempt from manual override detection (always preserved if present)
                if (old?.useUuid) {
                    f.useUuid = true;
                    console.log(`[AutoFill] Mantendo modo UUID para ${key} (isento de detecção de mudança).`);
                }
                
                console.log(`[AutoFill] Estado Final de ${key}: faker=${f.fakerType}, uuid=${f.useUuid}, value="${f.value}"`);
            }
            merged.push(f);
        });

        // Add remaining existing
        existingMap.forEach((f, key) => {
            if (!incomingMap.has(key)) {
                merged.push(f);
            }
        });

        return merged;
    }

    private static createKey(f: FormField): string {
        const n = String(f.name || '').trim();
        const i = String(f.id || '').trim();
        const t = String(f.type || '').trim();
        const p = String(f.placeholder || '').trim();
        // ONLY use attrValue for radio and checkbox to ensure unique group members
        // For other fields, name/id/type is enough.
        const av = (t === 'radio' || t === 'checkbox') ? String(f.attrValue || '').trim() : '';
        return `${n}_${i}_${t}_${p}_${av}`;
    }

    private static setElementValue(el: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement, value: any) {
        if (el.tagName === "SELECT") {
            this.setSelectSmart(el as HTMLSelectElement, value);
            return;
        }

        let changed = false;
        if (el.type === "checkbox" || el.type === "radio") {
            const target = (value === true || value === "true");
            if ((el as HTMLInputElement).checked !== target) {
                (el as HTMLInputElement).checked = target;
                changed = true;
            }
        } else {
            const target = value ?? "";
            if (el.value !== String(target)) {
                el.value = String(target);
                changed = true;
            }
        }

        if (changed) {
            el.dispatchEvent(new Event("input", { bubbles: true }));
            el.dispatchEvent(new Event("change", { bubbles: true }));
        }
    }

    private static setSelectSmart(select: HTMLSelectElement, value: any) {
        const wanted = String(value ?? "").trim();
        const normalizedWanted = this.normalize(wanted);

        const tryApply = () => {
            if (!select.options || select.options.length === 0) return false;
            for (const opt of select.options) {
                if (opt.value.trim() === wanted || this.normalize(opt.textContent || '') === normalizedWanted) {
                    opt.selected = true;
                    select.dispatchEvent(new Event("input", { bubbles: true }));
                    select.dispatchEvent(new Event("change", { bubbles: true }));
                    return true;
                }
            }
            return false;
        };

        if (tryApply()) return;

        const obs = new MutationObserver(() => {
            if (tryApply()) obs.disconnect();
        });
        obs.observe(select, { childList: true, subtree: true });
        setTimeout(() => obs.disconnect(), 2000);
    }

    private static normalize(value: string): string {
        return value.trim().replace(/\s+/g, " ").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
    }

    private static generateUuid(): string {
        return crypto.randomUUID();
    }

    private static generateFakerValue(type: string): string {
        try {
            switch (type) {
                case 'name': return faker.person.fullName();
                case 'firstName': return faker.person.firstName();
                case 'lastName': return faker.person.lastName();
                case 'email': return faker.internet.email();
                case 'cep': return faker.location.zipCode();
                case 'cnpj': return this.generateCNPJ();
                case 'cpf': return this.generateCPF();
                case 'phone': return faker.phone.number();
                case 'company': return faker.company.name();
                case 'city': return faker.location.city();
                case 'state': return faker.location.state();
                default: return faker.lorem.word();
            }
        } catch {
            return "Error";
        }
    }

    private static generateCPF(): string {
        // Implementation from helper.ts
        const rnd = (n: number) => Math.round(Math.random() * n);
        const mod = (dividend: number, divisor: number) => Math.round(dividend - (Math.floor(dividend / divisor) * divisor));
        const n: number[] = Array(9).fill(0).map(() => rnd(9));
        let d1 = n.reduce((acc, curr, i) => acc + (10 - i) * curr, 0);
        d1 = 11 - mod(d1, 11); if (d1 >= 10) d1 = 0;
        let d2 = n.reduce((acc, curr, i) => acc + (11 - i) * curr, 0) + (2 * d1);
        d2 = 11 - mod(d2, 11); if (d2 >= 10) d2 = 0;
        return `${n.join('')}${d1}${d2}`;
    }

    private static generateCNPJ(): string {
        // Implementation from helper.ts
        const rnd = (n: number) => Math.round(Math.random() * n);
        const mod = (dividend: number, divisor: number) => Math.round(dividend - (Math.floor(dividend / divisor) * divisor));
        const n: number[] = Array(8).fill(0).map(() => rnd(9));
        n.push(0, 0, 0, 1);
        let d1 = n.reduce((acc, curr, i) => acc + ([5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2][i]) * curr, 0);
        d1 = 11 - mod(d1, 11); if (d1 >= 10) d1 = 0;
        let d2 = n.reduce((acc, curr, i) => acc + ([6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2][i]) * curr, 0) + (2 * d1);
        d2 = 11 - mod(d2, 11); if (d2 >= 10) d2 = 0;
        return `${n.join('')}${d1}${d2}`;
    }
}
