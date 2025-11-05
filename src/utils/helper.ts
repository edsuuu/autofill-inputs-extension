/* eslint-disable @typescript-eslint/no-explicit-any */
import browser from 'webextension-polyfill';

export interface FormField {
    name?: string;
    id?: string;
    value?: string | boolean;
    type?: string;
    useUuid?: boolean;
}

export class Helper {
    constructor(automatic: boolean, windowLocationHref: string) {
        this.autoFill(windowLocationHref, automatic);
    }

    // Função para salvar formulário (usada pelo floating-button)
    public async saveForm(windowLocationHref: string): Promise<{ success: boolean; message: string; count?: number }> {
        const newFields = Helper.captureFormFields();
        return await Helper.saveFormFromFields(windowLocationHref, newFields);
    }

    // Função estática para capturar campos do formulário (pode ser executada via executeScript)
    public static captureFormFields(): FormField[] {
        const inputs = Array.from(document.querySelectorAll("input, textarea, select")) as HTMLInputElement[];

        return Array.from(inputs)
            .filter((input) => {
                // Permitir campos que tenham name OU id (pelo menos um dos dois)
                if (!input.name && !input.id) return false;

                // Excluir tipos específicos
                if (['hidden', 'submit', 'button', 'reset', 'file'].includes(input.type)) return false;

                // Excluir campos com name começando com _
                if (input.name && input.name.startsWith('_')) return false;

                // Excluir campos com nomes suspeitos
                if (input.name && ['token', 'method', 'uri', 'ip'].some((k) => input.name.toLowerCase().includes(k))) return false;

                return true;
            })
            .map((field): FormField => {
                // Para checkboxes, garantir que sempre salvamos o valor boolean (true ou false)
                let value: string | boolean;
                if (field.type === 'checkbox') {
                    value = field.checked; // boolean true ou false
                } else if (field.type === 'radio') {
                    value = field.checked ? field.value : '';
                } else {
                    value = field.value;
                }

                return {
                    name: field.name || undefined,
                    id: field.id || undefined,
                    value: value,
                    type: field.type,
                    useUuid: false,
                };
            });
    }

    // Função estática para salvar formulário a partir de campos capturados (usada pelo Popup)
    public static async saveFormFromFields(windowLocationHref: string, newFields: FormField[]): Promise<{ success: boolean; message: string; count?: number }> {
        try {
            if (newFields.length === 0) {
                return { success: false, message: 'Nenhum campo encontrado para salvar!' };
            }

            // Buscar campos existentes salvos para esta URL
            const existingData = await browser.storage.local.get(windowLocationHref);
            const existingFields = (existingData[windowLocationHref] || []) as FormField[];

            // Função auxiliar para criar chave única para comparação
            const createFieldKey = (field: FormField): string => {
                const valueStr = (field.type === 'radio')
                    ? `_${String(field.value)}`
                    : '';
                return `${field.name || ''}_${field.id || ''}_${field.type || ''}${valueStr}`;
            };

            // Criar um mapa dos campos existentes para facilitar a busca
            const existingFieldsMap = new Map<string, FormField>();
            existingFields.forEach((field) => {
                const key = createFieldKey(field);
                if (key && key !== '__') {
                    existingFieldsMap.set(key, field);
                }
            });

            // Fazer merge: manter campos existentes que não estão na página atual e atualizar/adicionar os novos
            const mergedFields: FormField[] = [];

            // Criar um mapa dos campos novos para comparar com os existentes
            const newFieldsMap = new Map<string, FormField>();
            newFields.forEach((field) => {
                const key = createFieldKey(field);
                if (key && key !== '__') {
                    newFieldsMap.set(key, field);
                    // Adicionar campos novos/atualizados da página atual
                    mergedFields.push(field);
                }
            });

            // Adicionar campos existentes que não estão na página atual (preservar campos de outras páginas/componentes)
            existingFieldsMap.forEach((field, key) => {
                // Só adiciona se não foi substituído por um campo novo
                if (!newFieldsMap.has(key)) {
                    mergedFields.push(field);
                }
            });

            // Salvar no storage com merge
            await browser.storage.local.set({
                [windowLocationHref]: mergedFields
            });

            const addedCount = newFields.length;
            const totalCount = mergedFields.length;
            const preservedCount = totalCount - addedCount;

            if (preservedCount > 0) {
                return {
                    success: true,
                    message: `Formulário salvo! ${addedCount} campo(s) adicionado(s)/atualizado(s). Total: ${totalCount} campo(s) salvos.`,
                    count: totalCount
                };
            } else {
                return {
                    success: true,
                    message: `Formulário salvo! ${addedCount} campo(s) capturado(s).`,
                    count: addedCount
                };
            }
        } catch {
            return { success: false, message: 'Erro ao salvar o formulário.' };
        }
    }

    // Função para gerar UUID
    private static generateUuid(): string {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    public async autoFill(windowLocationHref: string, automatic: boolean = false) {
        if (automatic) {
            const { enabled } = await browser.storage.local.get("enabled");

            if (enabled === false) {
                return;
            }
        }

        browser.storage.local.get(windowLocationHref).then((data) => {
            const value = data[windowLocationHref] || [];

            value.forEach((campo: FormField) => {
                let selector = "";
                if (campo.name) selector += `[name="${campo.name}"]`;
                if (campo.id) {
                    const safeId = CSS.escape(campo.id);
                    selector += (selector ? ", " : "") + `#${safeId}`;
                }

                const el = document.querySelectorAll(selector) as NodeListOf<HTMLInputElement>;
                if (!el || el.length === 0) return;

                el.forEach((input) => {
                    // Se o campo tem useUuid habilitado, gerar UUID
                    let valueToSet = campo.value;
                    if (campo.useUuid) {
                        valueToSet = Helper.generateUuid();
                    } else {
                        valueToSet = (campo.value ?? "").toString().trim();
                    }
                    this.setElementValue(input, valueToSet);
                });
            });
        });

    }

    private normalize(value: string): string {
        return String(value ?? "")
            .trim()
            .replace(/\s+/g, " ")
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
            .toUpperCase();
    }

    private setElementValue(el: any, value: any) {
        const tag = el.tagName;
        const type = (el.type || "").toLowerCase();

        if (tag === "SELECT") {
            this.setSelectSmart(el, value);
            return;
        }

        if (type === "checkbox" || type === "radio") {
            el.checked = (value !== "false");
        } else {
            el.value = value ?? "";
        }

        el.dispatchEvent(new Event("input", { bubbles: true }));
        el.dispatchEvent(new Event("change", { bubbles: true }));
    }

    private setSelectSmart(select: any, rawValue: any) {
        const wanted = String(rawValue ?? "");
        const wantedN = this.normalize(wanted);

        const tryApply = () => {
            if (!select || !select.options || select.options.length === 0) return false;
            for (const opt of select.options) {
                if (String(opt.value).trim() === wanted.trim()) {
                    opt.selected = true;
                    select.dispatchEvent(new Event("input", { bubbles: true }));
                    select.dispatchEvent(new Event("change", { bubbles: true }));
                    return true;
                }
            }

            for (const opt of select.options) {
                if (this.normalize(opt.textContent) === wantedN) {
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

        setTimeout(() => tryApply() && obs.disconnect(), 300);
        setTimeout(() => tryApply() && obs.disconnect(), 1000);
    }

}