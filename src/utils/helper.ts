import { fakerPT_BR as faker } from '@faker-js/faker';

export { faker };

export interface FormField {
    name?: string;
    id?: string;
    label?: string;
    placeholder?: string;
    attrValue?: string;
    value?: string | boolean;
    type?: string;
    useUuid?: boolean;
    fakerType?: 'name' | 'email' | 'cep' | 'cnpj' | 'cpf' | 'phone' | 'company' | string;
}

export interface UrlPattern {
    pattern: string;
    enabled: boolean;
    fields: FormField[];
}