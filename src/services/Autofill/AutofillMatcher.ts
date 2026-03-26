import { FormField } from '../../utils/helper';

export class AutofillMatcher {
    private static commonMappings: Record<string, string[]> = {
        name: ['nome', 'name', 'full_name', 'fullname', 'username', 'user', 'usuario', 'usuário'],
        firstName: ['first_name', 'firstname', 'prenome'],
        lastName: ['last_name', 'lastname', 'sobrenome'],
        email: ['email', 'e-mail', 'mail'],
        phone: ['phone', 'telephone', 'tel', 'celular', 'mobile', 'whatsapp', 'fone'],
        cep: ['cep', 'zipcode', 'zip_code', 'postal_code'],
        address: ['address', 'endereco', 'endereço', 'logradouro'],
        number: ['number', 'numero', 'número'],
        city: ['city', 'cidade'],
        state: ['state', 'estado', 'uf'],
        cpf: ['cpf'],
        cnpj: ['cnpj'],
        company: ['company', 'empresa', 'razão social', 'razao_social'],
    };

    public static identifyField(field: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement): string | null {
        const name = (field.name || '').toLowerCase();
        const id = (field.id || '').toLowerCase();
        const placeholder = ('placeholder' in field) ? (field.placeholder as string || '').toLowerCase() : '';
        const ariaLabel = field.getAttribute('aria-label') ? field.getAttribute('aria-label')!.toLowerCase() : '';
        
        // Try to find a label
        let labelText = '';
        if (field.id) {
            const label = document.querySelector(`label[for="${field.id}"]`);
            if (label) labelText = label.textContent?.toLowerCase() || '';
        }

        const searchable = `${name} ${id} ${placeholder} ${ariaLabel} ${labelText}`;

        for (const [type, patterns] of Object.entries(this.commonMappings)) {
            if (patterns.some(p => searchable.includes(p))) {
                return type;
            }
        }

        return null;
    }

    public static mapField(field: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement, autoIdentify: boolean = false): FormField {
        const type = field.type;
        const placeholder = 'placeholder' in field ? (field as HTMLInputElement).placeholder || "" : "";
        const attrValue = (field as HTMLInputElement).value || ""; 
        const fakerType = autoIdentify ? (this.identifyField(field) || undefined) : undefined;

        // Find label
        let labelText = '';
        if (field.id) {
            const label = document.querySelector(`label[for="${field.id}"]`);
            if (label) labelText = label.textContent?.trim() || '';
        }
        if (!labelText) {
            const parentLabel = field.closest('label');
            if (parentLabel) labelText = parentLabel.textContent?.replace(field.innerText || '', '').trim() || '';
        }

        let value: string | boolean = '';
        if (type === 'checkbox' || type === 'radio') {
            value = (field as HTMLInputElement).checked;
        } else {
            value = field.value;
        }

        return {
            name: field.name || undefined,
            id: field.id || undefined,
            label: labelText || undefined,
            placeholder: placeholder || undefined,
            attrValue: attrValue || undefined,
            type: type,
            value: value,
            fakerType: fakerType,
            useUuid: false
        };
    }

    public static getFieldsToSave(): FormField[] {
        const inputs = Array.from(document.querySelectorAll("input, textarea, select")) as (HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement)[];

        return inputs
            .filter((input) => {
                const name = (input.name || input.id || '').toLowerCase();
                const type = input.type;
                
                // Looser identification: name, id, OR placeholder/label
                if (!input.name && !input.id) {
                    const hasLabel = !!input.closest('label') || (input.id && !!document.querySelector(`label[for="${CSS.escape(input.id)}"]`));
                    const hasPlaceholder = 'placeholder' in input && !!input.placeholder;
                    
                    if (!hasLabel && !hasPlaceholder) {
                        return false;
                    }
                }

                if (['hidden', 'submit', 'button', 'reset', 'file'].includes(type)) return false;
                
                // Common technical fields to ignore
                if (['token', 'method', 'uri', 'ip', 'search', 'datasets-switcher'].some((k) => name.includes(k))) return false;

                return true;
            })
            .map((input) => {
                const field = this.mapField(input, false);
                console.log(`[AutoFill] Capturando: ${field.name || field.id || field.label || field.placeholder} (${field.type}) value=${field.value}`);
                return field;
            });
    }
}
