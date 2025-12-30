/* eslint-disable @typescript-eslint/no-explicit-any */
import browser from 'webextension-polyfill';

export interface FormField {
    name?: string;
    id?: string;
    value?: string | boolean;
    type?: string;
    useUuid?: boolean;
}

export interface UrlPattern {
    pattern: string; // Ex: https://meusite.com/pedido/*
    enabled: boolean;
    fields: FormField[];
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
                    // FIX: Manter configuração de useUuid se já existir
                    if (existingFieldsMap.has(key)) {
                        const existing = existingFieldsMap.get(key);
                        if (existing?.useUuid) {
                            field.useUuid = true;
                        }
                    }

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

    // Função para verificar se uma URL corresponde a um padrão
    public static urlMatchesPattern(url: string, pattern: string): boolean {
        try {
            // Se for uma URL exata (sem wildcards), compara diretamente
            if (!pattern.includes('*')) {
                return url === pattern;
            }

            // Converter padrão com * para regex de forma mais simples
            // Dividir o padrão em partes separadas por *
            const parts = pattern.split('*');

            // Escapar cada parte e juntar com .*?
            const escapedParts = parts.map(part => {
                // Escapar caracteres especiais do regex
                return part.replace(/[.+?^${}()|[\]\\]/g, '\\$&');
            });

            // Juntar com .*? (qualquer caractere, não-guloso)
            const regexPattern = escapedParts.join('.*?');

            const regex = new RegExp(`^${regexPattern}$`);
            const matches = regex.test(url);

            return matches;
        } catch (error) {
            console.error('Erro ao verificar padrão:', error, { url, pattern });
            return false;
        }
    }

    // Função para buscar padrões de URL que correspondem à URL atual
    public static async findMatchingPatterns(url: string): Promise<UrlPattern[]> {
        try {
            const allData = await browser.storage.local.get(null);
            const matchingPatterns: UrlPattern[] = [];

            // Chave especial para armazenar padrões
            const patternsKey = '__url_patterns__';
            const patternsData = allData[patternsKey] as Record<string, UrlPattern> | undefined;

            if (patternsData) {
                Object.values(patternsData).forEach((pattern) => {
                    if (pattern.enabled && Helper.urlMatchesPattern(url, pattern.pattern)) {
                        matchingPatterns.push(pattern);
                    }
                });
            }

            return matchingPatterns;
        } catch {
            return [];
        }
    }

    // Função para buscar campos de uma URL (exata ou por padrão)
    public static async getFieldsForUrl(url: string): Promise<FormField[]> {
        try {
            // Primeiro, tentar buscar URL exata
            const exactData = await browser.storage.local.get(url);
            if (exactData[url] && Array.isArray(exactData[url]) && (exactData[url] as FormField[]).length > 0) {
                return exactData[url] as FormField[];
            }

            // Se não encontrar, buscar por padrões
            const matchingPatterns = await Helper.findMatchingPatterns(url);
            if (matchingPatterns.length > 0) {
                // Retornar campos do primeiro padrão correspondente
                const fields = matchingPatterns[0].fields;
                if (fields && Array.isArray(fields) && fields.length > 0) {
                    return fields;
                }
            }

            return [];
        } catch (error) {
            console.error('Erro ao buscar campos:', error);
            return [];
        }
    }

    // Função para salvar ou atualizar um padrão de URL
    public static async saveUrlPattern(pattern: string, fields: FormField[], enabled: boolean = true): Promise<void> {
        const patternsKey = '__url_patterns__';
        const existingData = await browser.storage.local.get(patternsKey);
        const patternsData = (existingData[patternsKey] || {}) as Record<string, UrlPattern>;

        patternsData[pattern] = {
            pattern,
            enabled,
            fields,
        };

        await browser.storage.local.set({ [patternsKey]: patternsData });
    }

    // Função para obter todos os padrões salvos
    public static async getAllUrlPatterns(): Promise<UrlPattern[]> {
        try {
            const patternsKey = '__url_patterns__';
            const data = await browser.storage.local.get(patternsKey);
            const patternsData = data[patternsKey] as Record<string, UrlPattern> | undefined;

            if (!patternsData) {
                return [];
            }

            return Object.values(patternsData);
        } catch {
            return [];
        }
    }

    // Função para deletar um padrão de URL
    public static async deleteUrlPattern(pattern: string): Promise<void> {
        const patternsKey = '__url_patterns__';
        const existingData = await browser.storage.local.get(patternsKey);
        const patternsData = (existingData[patternsKey] || {}) as Record<string, UrlPattern>;

        delete patternsData[pattern];
        await browser.storage.local.set({ [patternsKey]: patternsData });
    }

    // Função para alternar o status de um padrão
    public static async toggleUrlPattern(pattern: string, enabled: boolean): Promise<void> {
        const patternsKey = '__url_patterns__';
        const existingData = await browser.storage.local.get(patternsKey);
        const patternsData = (existingData[patternsKey] || {}) as Record<string, UrlPattern>;

        if (patternsData[pattern]) {
            patternsData[pattern].enabled = enabled;
            await browser.storage.local.set({ [patternsKey]: patternsData });
        }
    }

    public async autoFill(windowLocationHref: string, automatic: boolean = false) {
        if (automatic) {
            const { enabled } = await browser.storage.local.get("enabled");

            if (enabled === false) {
                return;
            }
        }

        // Buscar campos por URL exata ou padrão
        const fields = await Helper.getFieldsForUrl(windowLocationHref);

        if (!fields || fields.length === 0) {
            return;
        }

        // Aguardar um pouco para garantir que os campos estão no DOM
        await new Promise(resolve => setTimeout(resolve, 100));

        fields.forEach((campo: FormField) => {
            let selector = "";
            if (campo.name) selector += `[name="${campo.name}"]`;
            if (campo.id) {
                const safeId = CSS.escape(campo.id);
                selector += (selector ? ", " : "") + `#${safeId}`;
            }

            if (!selector) return;

            const el = document.querySelectorAll(selector) as NodeListOf<HTMLInputElement>;
            if (!el || el.length === 0) return;

            el.forEach((input) => {
                // Verificar se o tipo do campo corresponde
                if (campo.type && input.type !== campo.type && campo.type !== 'text') {
                    // Para checkboxes e radios, verificar tipo
                    if ((campo.type === 'checkbox' || campo.type === 'radio') && input.type !== campo.type) {
                        return;
                    }
                }

                // FIX: Evitar loop e sobrescrita de dados do usuário
                if (automatic) {
                    // Ignora campos de texto/select que já possuem valor
                    if (input.type !== 'checkbox' && input.type !== 'radio' && input.value) {
                        return;
                    }
                    // Para checkboxes/radios não verificamos valor vazio da mesma forma
                }

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