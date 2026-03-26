import browser from 'webextension-polyfill';
import { AutofillMatcher } from './AutofillMatcher';
import { AutofillSaver } from './AutofillSaver';
import { FormField } from '../types';

export class AutofillService {
    private static lastFilledValues = new Map<string, string>();

    public static async fillForm(url: string, automatic: boolean = false, profile?: string): Promise<void> {
        const settings = await AutofillSaver.getSettings();
        const activeProfile = profile || settings.currentProfile || 'Padrão';
        const currentOrigin = new URL(url).origin;
        const isBlacklisted = settings.blacklistedSites?.includes(currentOrigin);

        if (settings.enabled === false || isBlacklisted) {
            return;
        }

        const fields = await AutofillSaver.getFieldsForUrl(url, activeProfile);
        if (!fields || fields.length === 0) return;
        for (const field of fields) {
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

            if (elements.length === 0) continue;

            for (const el of elements) {
                if (field.type && el.type !== field.type && field.type !== 'text') {
                    if ((field.type === 'checkbox' || field.type === 'radio') && el.type !== field.type) {
                        continue;
                    }
                }

                if (automatic) {
                    if (el.type !== 'checkbox' && el.type !== 'radio' && el.value) {
                        continue;
                    }
                }

                let valueToSet = field.value;
                if (field.fakerType) {
                    valueToSet = await this.generateFakerValue(field.fakerType);
                } else if (field.useUuid) {
                    valueToSet = this.generateUuid();
                }
                this.lastFilledValues.set(this.createKey(field), String(valueToSet));

                this.setElementValue(el, valueToSet);
            }
        }
    }

    public static async captureAndSave(url: string, profile: string = 'Padrão'): Promise<{ success: boolean; message: string; count?: number }> {
        const fields = await this.getFieldsToSave(false);
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

        const fields = await this.getFieldsToSave(true);
        if (fields.length === 0) return { success: false, message: 'Nenhum campo detectado!' };

        for (const field of fields) {
            let value = field.value;
            if (field.fakerType) {
                value = await this.generateFakerValue(field.fakerType);
                field.value = value;
            }

            let selector = "";
            if (field.name) selector += `[name="${CSS.escape(field.name)}"]`;
            if (field.id) selector += (selector ? ", " : "") + `#${CSS.escape(field.id)}`;

            if (!selector) continue;

            const elements = document.querySelectorAll(selector) as NodeListOf<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>;
            elements.forEach(el => this.setElementValue(el, value));
        }

        await AutofillSaver.saveFieldsForUrl(url, fields, profile);
        return { success: true, message: `Campos detectados, preenchidos e salvos no perfil "${profile}"!` };
    }

    public static async getFieldsToSave(autoIdentify: boolean = false): Promise<FormField[]> {
        const selector = "input:not([type='hidden']):not([type='submit']):not([type='button']):not([type='reset']):not([type='file']), textarea, select, [contenteditable='true'], [role='textbox']";
        const inputs = Array.from(document.querySelectorAll(selector)) as (HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement)[];

        return inputs
            .filter((input) => {
                const nameOrId = (input.name || input.id || '').toLowerCase();
                const type = (input as any).type || '';
                const ignorePatterns = [
                    /(_token|token_|^token$)/i,
                    /(^method$|_method)/i,
                    /(^uri$|^url$)/i,
                    /(^ip$|ip_address|ip_addr)/i,
                    /(_search|^search$)/i,
                    /datasets-switcher/i
                ];

                const blockedMatch = ignorePatterns.some(regex => regex.test(nameOrId));
                if (blockedMatch) {
                    return false;
                }

                const hasLabel = !!input.closest('label') || (input.id && !!document.querySelector(`label[for="${CSS.escape(input.id)}"]`));
                const hasPlaceholder = 'placeholder' in input && !!(input as any).placeholder;
                const hasSiblings = !!input.parentElement && input.parentElement.children.length > 1;

                if (!input.name && !input.id && !hasLabel && !hasPlaceholder && !hasSiblings) {
                    return false;
                }

                return true;
            })
            .map((input) => {
                const field = AutofillMatcher.mapField(input, autoIdentify);
                return field;
            });
    }

    private static mergeFields(existing: FormField[], incoming: FormField[]): FormField[] {
        const existingMap = new Map(existing.map(f => [this.createKey(f), f]));
        const incomingMap = new Map(incoming.map(f => [this.createKey(f), f]));

        const merged: FormField[] = [];
        incoming.forEach(f => {
            const key = this.createKey(f);
            if (existingMap.has(key)) {
                const old = existingMap.get(key);
                const wasFaker = !!old?.fakerType;
                const lastFilledValue = this.lastFilledValues.get(key);
                let isChanged = false;
                const currentVal = String(f.value || '').trim();
                if (lastFilledValue !== undefined) {
                    const lastVal = String(lastFilledValue).trim();
                    isChanged = lastVal !== currentVal;
                } else if (old) {
                    const storedVal = String(old.value || '').trim();
                    isChanged = storedVal !== currentVal;
                }
                if (wasFaker && isChanged) {
                    f.fakerType = undefined;
                    f.useUuid = false;
                } else {
                    if (old?.fakerType && !f.fakerType) f.fakerType = old.fakerType;
                }
                if (old?.useUuid) {
                    f.useUuid = true;
                }
            }
            merged.push(f);
        });

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
        const l = String(f.label || '').trim();
        const av = (t === 'radio' || t === 'checkbox') ? String(f.attrValue || '').trim() : '';
        return `${n}|${i}|${t}|${l}|${av}`;
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
            if (el.value !== String(target) || (el as any).innerText !== String(target)) {
                if (el.value !== undefined) el.value = String(target);
                else (el as any).innerText = String(target);
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

    private static generatePrice(): string {
        const value = Math.random() * (5000 - 2000) + 2000;
        return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    private static generateKwp(): string {
        const value = Math.floor(Math.random() * (10 - 3 + 1)) + 3;
        return value.toFixed(2);
    }

    private static generateKwh(): string {
        const values = [300, 400, 500];
        return String(values[Math.floor(Math.random() * values.length)]);
    }

    private static async generateFakerValue(type: string): Promise<string> {
        try {
            if (type === 'cpf') return this.generateCPF();
            if (type === 'cnpj') return this.generateCNPJ();
            if (type === 'uuid') return this.generateUuid();
            if (type === 'price') return this.generatePrice();
            if (type === 'kwp') return this.generateKwp();
            if (type === 'kwh') return this.generateKwh();

            return await browser.runtime.sendMessage({ action: 'GENERATE_FAKER_VALUE', type });
        } catch (error) {
            console.error('[AutoFill] Error generating faker value:', error);
            return "Error";
        }
    }

    private static generateCPF(): string {
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
