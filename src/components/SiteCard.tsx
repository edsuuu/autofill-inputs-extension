import React, { useState } from 'react';
import { type FormField } from '../utils/helper';
import { 
    TrashIcon, 
    PencilSquareIcon, 
    CheckIcon, 
    XMarkIcon,
    ChevronDownIcon,
    ChevronUpIcon,
    GlobeAltIcon
} from '@heroicons/react/24/outline';

interface SiteCardProps {
    url: string;
    fields: FormField[];
    onSave: (url: string, fields: FormField[]) => void;
    onDelete: (url: string) => void;
    onConvertToPattern: (url: string) => void;
}

const SiteCard: React.FC<SiteCardProps> = ({ url, fields, onSave, onDelete }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [editedFields, setEditedFields] = useState<FormField[]>(fields);

    const handleFieldChange = (index: number, updates: Partial<FormField>) => {
        const newFields = [...editedFields];
        newFields[index] = { ...newFields[index], ...updates };
        setEditedFields(newFields);
    };

    const handleSave = () => {
        onSave(url, editedFields);
        setIsEditing(false);
    };

    const handleCancel = () => {
        setEditedFields(fields);
        setIsEditing(false);
    };

    return (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden group hover:shadow-xl hover:border-indigo-100 transition-all duration-300 font-sans" style={{ fontFamily: "'Inter', sans-serif" }}>
            {/* Header / Main Bar */}
            <div className="p-5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0 flex-1">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center shrink-0 text-indigo-600 font-bold text-xl shadow-inner uppercase">
                        {url.replace(/(^\w+:|^)\/\//, '').charAt(0)}
                    </div>
                    <div className="min-w-0">
                        <h3 className="font-bold text-slate-900 truncate tracking-tight text-base" title={url}>
                            {url}
                        </h3>
                        <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
                            <GlobeAltIcon className="w-3.5 h-3.5" />
                            {fields.length} campos salvos
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {isEditing ? (
                        <>
                            <button
                                onClick={handleSave}
                                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all text-xs font-semibold shadow-lg shadow-indigo-100 active:scale-95 cursor-pointer"
                            >
                                <CheckIcon className="w-4 h-4" /> Salvar
                            </button>
                            <button
                                onClick={handleCancel}
                                className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-all text-xs font-semibold active:scale-95 cursor-pointer"
                            >
                                <XMarkIcon className="w-4 h-4" /> Cancelar
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                onClick={() => {
                                    setIsEditing(true);
                                    setIsExpanded(true);
                                }}
                                className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all cursor-pointer"
                                title="Editar campos"
                            >
                                <PencilSquareIcon className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => onDelete(url)}
                                className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
                                title="Excluir"
                            >
                                <TrashIcon className="w-5 h-5" />
                            </button>
                            <div className="w-px h-6 bg-slate-100 mx-1" />
                            <button
                                onClick={() => setIsExpanded(!isExpanded)}
                                className={`p-2.5 rounded-xl transition-all cursor-pointer ${isExpanded ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:bg-slate-50'}`}
                            >
                                {isExpanded ? <ChevronUpIcon className="w-5 h-5" /> : <ChevronDownIcon className="w-5 h-5" />}
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Expanded Fields Area */}
            {isExpanded && (
                <div className="px-5 pb-6 pt-2 border-t border-slate-50 bg-slate-50/30 animate-in slide-in-from-top-2 duration-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {editedFields.map((field, index) => (
                            <div key={`${field.name}-${index}`} className="bg-white p-4 rounded-2xl border border-slate-100 space-y-3 shadow-sm transition-all hover:border-indigo-100">
                                <div className="flex items-center justify-between">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">
                                        {field.name || field.id || `Campo ${index + 1}`}
                                    </label>
                                    {isEditing && (
                                        <div className="flex items-center gap-2">
                                            <select
                                                value={field.useUuid ? 'uuid' : (field.fakerType ? 'faker' : 'fixed')}
                                                onChange={(e) => {
                                                    const mode = e.target.value;
                                                    if (mode === 'uuid') {
                                                        handleFieldChange(index, { useUuid: true, fakerType: undefined });
                                                    } else if (mode === 'faker') {
                                                        handleFieldChange(index, { useUuid: false, fakerType: 'name' });
                                                    } else {
                                                        handleFieldChange(index, { useUuid: false, fakerType: undefined });
                                                    }
                                                }}
                                                className="text-[10px] font-bold bg-slate-50 border-none rounded-lg px-2 py-1 text-slate-500 cursor-pointer outline-none focus:ring-1 focus:ring-indigo-500"
                                            >
                                                <option value="fixed">FIXO</option>
                                                <option value="uuid">UUID</option>
                                                <option value="faker">ALEATÓRIO</option>
                                            </select>
                                            {field.fakerType && !field.useUuid && (
                                                <select
                                                    value={field.fakerType}
                                                    onChange={(e) => handleFieldChange(index, { fakerType: e.target.value })}
                                                    className="text-[10px] font-bold bg-indigo-50 border-none rounded-lg px-2 py-1 text-indigo-600 cursor-pointer outline-none focus:ring-1 focus:ring-indigo-500"
                                                >
                                                    <option value="name">Nome</option>
                                                    <option value="firstName">Primeiro Nome</option>
                                                    <option value="lastName">Sobrenome</option>
                                                    <option value="email">E-mail</option>
                                                    <option value="phone">Telefone</option>
                                                    <option value="cpf">CPF</option>
                                                    <option value="cnpj">CNPJ</option>
                                                    <option value="cep">CEP</option>
                                                    <option value="company">Empresa</option>
                                                    <option value="kwp">kWp (1-10)</option>
                                                    <option value="price">Valor (1k-5k)</option>
                                                    <option value="kwh">kWh (300-500)</option>
                                                </select>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <div className="relative group">
                                    {field.useUuid ? (
                                        <div className="w-full px-4 py-3 rounded-xl text-sm font-semibold bg-slate-50 border-2 border-dashed border-slate-200 text-slate-400 flex items-center gap-2">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                                            </svg>
                                            UUID Dinâmico
                                        </div>
                                    ) : field.fakerType ? (
                                        <div className="w-full px-4 py-3 rounded-xl text-sm font-semibold bg-indigo-50/30 border-2 border-dashed border-indigo-100 text-indigo-400 flex items-center gap-2">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                                            </svg>
                                            Gerador: {field.fakerType.toUpperCase()}
                                        </div>
                                    ) : (
                                        <input
                                            type={field.type === 'password' ? 'password' : 'text'}
                                            value={String(field.value || '')}
                                            onChange={(e) => handleFieldChange(index, { value: e.target.value })}
                                            disabled={!isEditing}
                                            className={`w-full px-4 py-3 rounded-xl text-sm font-semibold transition-all border-2 ${
                                                isEditing 
                                                    ? 'bg-white border-indigo-100 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10' 
                                                    : 'bg-slate-100/50 border-transparent text-slate-600 shadow-inner'
                                            } outline-none`}
                                        />
                                    )}
                                    {!isEditing && field.type === 'password' && (
                                        <div className="absolute inset-y-0 right-3 flex items-center">
                                            <span className="text-[10px] bg-slate-200 text-slate-500 px-2 py-0.5 rounded-md font-bold uppercase tracking-tighter">Oculto</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                    {fields.length === 0 && (
                        <p className="text-center py-8 text-slate-400 text-sm italic">Nenhum campo capturado para este site.</p>
                    )}
                </div>
            )}
        </div>
    );
};

export default SiteCard;
