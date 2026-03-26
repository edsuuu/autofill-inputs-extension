import { FormField } from '../types';

export class AutofillMatcher {
    private static commonMappings: Record<string, string[]> = {
        name: ['nome', 'name', 'full_name', 'fullname', 'username', 'user', 'usuario', 'usuário'],
        firstName: ['first_name', 'firstname', 'prenome'],
        lastName: ['last_name', 'lastname', 'sobrenome'],
        email: ['email', 'e-mail', 'mail'],
        phone: ['phone', 'telephone', 'tel', 'celular', 'mobile', 'whatsapp', 'fone'],
        cep: ['cep', 'zipcode', 'zip_code', 'postal_code'],
        address: ['address', 'street', 'endereco', 'endereço', 'logradouro'],
        number: ['number', 'numero', 'número'],
        city: ['city', 'cidade'],
        state: ['state', 'estado', 'uf'],
        cpf: ['cpf', 'document_number'],
        cnpj: ['cnpj', 'fiscal_number'],
        company: ['company', 'company_name', 'empresa', 'razao_social'],
        uuid: ['externalid', 'external_id', 'id_externo', 'uuid', 'guid'],
        price: ['valor', 'price', 'montante', 'quantia', 'value'],
        kwp: ['kwp', 'potencia', 'potência'],
        kwh: ['kwh', 'consumo'],
    };

    public static identifyField(field: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement): string | null {
        const name = (field.name || '').toLowerCase();
        const id = (field.id || '').toLowerCase();
        const placeholder = ('placeholder' in field) ? (field.placeholder as string || '').toLowerCase() : '';
        const ariaLabel = field.getAttribute('aria-label') ? field.getAttribute('aria-label')!.toLowerCase() : '';

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
        const type = field.type || (field.getAttribute('role') === 'textbox' ? 'text' : field.tagName.toLowerCase());
        const placeholder = field.getAttribute('placeholder') || '';
        const attrValue = field.getAttribute('value') || '';
        const fakerType = autoIdentify ? (this.identifyField(field) || undefined) : undefined;
        let labelText: string | undefined = undefined;
        const id = field.id;
        if (id) {
            const labelEl = document.querySelector(`label[for="${CSS.escape(id)}"]`);
            if (labelEl) labelText = labelEl.textContent?.trim();
        }
        
        if (!labelText) {
            const closestLabel = field.closest('label');
            if (closestLabel) labelText = closestLabel.textContent?.trim();
        }

        if (!labelText) {
            const siblings = Array.from(field.parentElement?.children || []);
            const index = siblings.indexOf(field);
            
            const next = siblings[index + 1] as HTMLElement;
            if (next && (next.tagName === 'SPAN' || next.tagName === 'LABEL' || next.tagName === 'DIV')) {
                const text = next.textContent?.trim();
                if (text && text.length < 100) labelText = text;
            }

            if (!labelText && index > 0) {
                const prev = siblings[index - 1] as HTMLElement;
                if (prev && (prev.tagName === 'SPAN' || prev.tagName === 'LABEL' || prev.tagName === 'DIV')) {
                    const text = prev.textContent?.trim();
                    if (text && text.length < 100) labelText = text;
                }
            }
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
            useUuid: fakerType === 'uuid'
        };
    }
}
