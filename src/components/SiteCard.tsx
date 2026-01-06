import { useState } from 'react';
import { PencilIcon, TrashIcon, LinkIcon, CheckIcon, XMarkIcon, SparklesIcon, BoltIcon } from '@heroicons/react/24/outline';
import { FormField } from '../utils/helper';

interface SiteCardProps {
    url: string;
    fields: FormField[];
    onSave: (url: string, fields: FormField[]) => void;
    onDelete: (url: string) => void;
    onConvertToPattern: (url: string) => void;
}

const FAKER_OPTIONS = [
    { value: 'name', label: 'Nome Completo' },
    { value: 'firstName', label: 'Primeiro Nome' },
    { value: 'lastName', label: 'Sobrenome' },
    { value: 'email', label: 'E-mail' },
    { value: 'cpf', label: 'CPF' },
    { value: 'cnpj', label: 'CNPJ' },
    { value: 'phone', label: 'Telefone' },
    { value: 'cep', label: 'CEP' },
    { value: 'street', label: 'Rua' },
    { value: 'number', label: 'Número' },
    { value: 'city', label: 'Cidade' },
    { value: 'state', label: 'Estado' },
    { value: 'company', label: 'Empresa' },
    { value: 'jobTitle', label: 'Cargo' },
    { value: 'text', label: 'Texto Aleatório' },
    { value: 'date', label: 'Data Passada' },
];

export default function SiteCard({ url, fields, onSave, onDelete, onConvertToPattern }: SiteCardProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [editedFields, setEditedFields] = useState<FormField[]>([...fields]);
    const [isExpanded, setIsExpanded] = useState(false);

    const handleSave = () => {
        onSave(url, editedFields);
        setIsEditing(false);
    };

    const handleCancel = () => {
        setEditedFields([...fields]);
        setIsEditing(false);
    };

    const updateFieldValue = (index: number, value: string) => {
        setEditedFields((prev) => prev.map((field, i) => (i === index ? { ...field, value } : field)));
    };

    const toggleUuid = (index: number) => {
        setEditedFields((prev) =>
            prev.map((field, i) => {
                if (i !== index) return field;
                return {
                    ...field,
                    useUuid: !field.useUuid,
                    fakerType: !field.useUuid ? undefined : field.fakerType,
                };
            }),
        );
    };

    const updateFakerType = (index: number, type: string) => {
        setEditedFields((prev) =>
            prev.map((field, i) => {
                if (i !== index) return field;
                return {
                    ...field,
                    fakerType: type || undefined,
                    useUuid: false,
                };
            }),
        );
    };

    const openUrl = (url: string) => {
        window.open(url, '_blank');
    };

    // Helper to get only significant fields for preview
    const previewFields = fields.slice(0, 5);
    const hasMoreFields = fields.length > 5;

    return (
        <div className={`group bg-white rounded-xl shadow-sm border border-gray-100 transition-all duration-200 hover:shadow-md ${isEditing ? 'ring-2 ring-blue-500/10' : ''}`}>
            {/* Header / Main Bar */}
            <div className="p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0 text-blue-600 font-bold text-lg uppercase">
                        {url.replace(/(^\w+:|^)\/\//, '').charAt(0)}
                    </div>
                    <div className="min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate" title={url}>
                            {url}
                        </h3>
                        <p className="text-sm text-gray-500 flex items-center gap-1">
                            <span className="font-medium text-gray-700">{fields.length}</span> campos configurados
                        </p>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                    {isEditing ? (
                        <>
                            <button
                                onClick={handleSave}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium shadow-sm active:transform active:scale-95 cursor-pointer"
                            >
                                <CheckIcon className="w-4 h-4" /> Salvar
                            </button>
                            <button
                                onClick={handleCancel}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium active:transform active:scale-95 cursor-pointer"
                            >
                                <XMarkIcon className="w-4 h-4" /> Cancelar
                            </button>
                        </>
                    ) : (
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => openUrl(url)} className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer" title="Abrir Site">
                                <LinkIcon className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setIsEditing(true)}
                                className="p-2 text-gray-500 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors cursor-pointer"
                                title="Editar Campos"
                            >
                                <PencilIcon className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => onConvertToPattern(url)}
                                className="p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors cursor-pointer"
                                title="Criar Padrão de URL"
                            >
                                <SparklesIcon className="w-4 h-4" />
                            </button>
                            <div className="w-px h-4 bg-gray-200 mx-1"></div>
                            <button onClick={() => onDelete(url)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer" title="Excluir">
                                <TrashIcon className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Content Area */}
            <div className={`px-4 pb-4 border-t border-gray-50 ${isEditing ? 'pt-4' : 'pt-2'}`}>
                {isEditing ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 animate-fadeIn">
                        {editedFields.map((field, index) => (
                            <div
                                key={index}
                                className="p-3 rounded-lg border border-gray-100 bg-gray-50/50 hover:border-blue-200 transition-colors group/field focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-400"
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <label className="text-xs font-semibold text-gray-700 truncate max-w-[70%]" title={field.name || field.id}>
                                        {field.name || field.id || `Campo ${index + 1}`}
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => toggleUuid(index)}
                                            className={`text-[10px] px-1.5 py-0.5 rounded border transition-colors cursor-pointer ${
                                                field.useUuid ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-white text-gray-400 border-gray-200 hover:border-gray-300'
                                            }`}
                                            title="Gerar UUID único a cada preenchimento"
                                        >
                                            UUID
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="relative">
                                        <select
                                            value={field.fakerType || ''}
                                            onChange={(e) => updateFakerType(index, e.target.value)}
                                            className="w-full text-xs border-gray-200 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 py-1.5 pl-2 pr-8 bg-white appearance-none cursor-pointer hover:border-gray-300 transition-colors"
                                        >
                                            <option value="">Manter valor fixo</option>
                                            <optgroup label="Gerar Automaticamente">
                                                {FAKER_OPTIONS.map((opt) => (
                                                    <option key={opt.value} value={opt.value}>
                                                        {opt.label}
                                                    </option>
                                                ))}
                                            </optgroup>
                                        </select>
                                        <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none text-gray-400">
                                            <BoltIcon className="w-3 h-3" />
                                        </div>
                                    </div>

                                    <input
                                        type="text"
                                        value={
                                            field.fakerType
                                                ? `(Gerado: ${FAKER_OPTIONS.find((o) => o.value === field.fakerType)?.label})`
                                                : field.useUuid
                                                    ? '(Gerado: UUID)'
                                                    : (field.value as string) || ''
                                        }
                                        onChange={(e) => updateFieldValue(index, e.target.value)}
                                        disabled={!!field.useUuid || !!field.fakerType || ['radio', 'checkbox', 'select-one'].includes(field.type || '')}
                                        placeholder="Valor do campo"
                                        className={`w-full text-xs border-gray-200 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 py-1.5 disabled:bg-gray-100 disabled:text-gray-500 ${
                                            field.fakerType || field.useUuid ? 'font-medium text-blue-600 bg-blue-50/50' : ''
                                        }`}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="space-y-2">
                        <div className="flex flex-wrap gap-2">
                            {(isExpanded ? fields : previewFields).map((field, index) => (
                                <div
                                    key={index}
                                    className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors max-w-full
                                    ${
                                field.fakerType
                                    ? 'bg-purple-50 text-purple-700 border-purple-100'
                                    : field.useUuid
                                        ? 'bg-blue-50 text-blue-700 border-blue-100'
                                        : 'bg-gray-50 text-gray-600 border-gray-100'
                                }`}
                                >
                                    <span className="opacity-70 truncate max-w-[100px]">{field.name || field.id}:</span>
                                    <span className="truncate max-w-[150px]">
                                        {field.fakerType ? (
                                            <span className="flex items-center gap-1">
                                                <SparklesIcon className="w-3 h-3" /> {FAKER_OPTIONS.find((o) => o.value === field.fakerType)?.label}
                                            </span>
                                        ) : field.useUuid ? (
                                            <span className="flex items-center gap-1">
                                                <BoltIcon className="w-3 h-3" /> UUID
                                            </span>
                                        ) : (
                                            field.value?.toString()
                                        )}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {hasMoreFields && (
                            <button onClick={() => setIsExpanded(!isExpanded)} className="text-xs text-gray-400 hover:text-gray-600 font-medium ml-1 transition-colors cursor-pointer">
                                {isExpanded ? 'Mostrar menos' : `+ ${fields.length - 5} outros campos...`}
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
