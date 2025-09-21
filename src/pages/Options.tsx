import { useEffect, useState } from 'react';
import browser from 'webextension-polyfill';

interface FormField {
    name: string;
    id: string;
    value: string;
    type?: string;
}

interface SavedForm {
    url: string;
    fields: FormField[];
}

export default function Options() {
    const [savedForms, setSavedForms] = useState<SavedForm[]>([]);
    const [editingForm, setEditingForm] = useState<string | null>(null);
    const [editingFields, setEditingFields] = useState<FormField[]>([]);

    useEffect(() => {
        (async function () {
            await loadSavedForms();
        })();
    }, []);

    const loadSavedForms = async () => {
        try {
            const data = await browser.storage.local.get(null);
            const forms: SavedForm[] = [];

            Object.keys(data).forEach((key) => {
                if (!['enabled', 'floatingButton'].includes(key) && data[key]) {
                    forms.push({
                        url: key,
                        fields: data[key],
                    });
                }
            });

            setSavedForms(forms);
        } catch {
            alert('Erro ao carregar formulários salvos!');
        }
    };

    const deleteForm = async (url: string) => {
        try {
            await browser.storage.local.remove(url);
            setSavedForms((prev) => prev.filter((form) => form.url !== url));
        } catch {
            alert('Erro ao excluir formulário!');
        }
    };

    const startEditing = (form: SavedForm) => {
        setEditingForm(form.url);
        setEditingFields([...form.fields]);
    };

    const cancelEditing = () => {
        setEditingForm(null);
        setEditingFields([]);
    };

    const saveEditing = async () => {
        if (!editingForm) return;

        try {
            await browser.storage.local.set({ [editingForm]: editingFields });
            setSavedForms((prev) => prev.map((form) => (form.url === editingForm ? { ...form, fields: editingFields } : form)));
            setEditingForm(null);
            setEditingFields([]);
        } catch {
            alert('Erro ao salvar alterações!');
        }
    };

    const updateFieldValue = (index: number, value: string) => {
        setEditingFields((prev) => prev.map((field, i) => (i === index ? { ...field, value } : field)));
    };

    const openUrl = (url: string) => {
        window.open(url, '_blank');
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-[1440px] mx-auto">
                <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                    <div className="flex items-center gap-4">
                        <img src="/favicon-32x32.png" alt="Logo" className="w-8 h-8" />
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Formulários Salvos</h1>
                            <p className="text-gray-600">Gerencie seus formulários de preenchimento automático</p>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    {savedForms.length === 0 ? (
                        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                    />
                                </svg>
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum formulário salvo</h3>
                            <p className="text-gray-500">Use a extensão para salvar formulários e eles aparecerão aqui.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {savedForms.map((form) => (
                                <div key={form.url} className="bg-white rounded-lg shadow-sm border border-gray-200">
                                    {editingForm === form.url ? (
                                        <div className="p-6">
                                            <div className="flex items-center justify-between mb-4">
                                                <h3 className="text-lg font-semibold text-gray-900 truncate">{form.url}</h3>
                                                <div className="flex gap-2">
                                                    <button onClick={saveEditing} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors cursor-pointer">
                                                        Salvar
                                                    </button>
                                                    <button onClick={cancelEditing} className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors cursor-pointer">
                                                        Cancelar
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                                {editingFields.map((field, index) => (
                                                    <div key={index} className="space-y-2">
                                                        <label
                                                            className={`block text-sm font-medium ${
                                                                ['radio', 'radio', 'select-one'].includes(field.type as string) ? 'text-gray-400' : 'text-gray-700'
                                                            }`}
                                                        >
                                                            {field.name || field.id || `Campo ${index + 1}`}
                                                            {['radio', 'radio', 'select-one', 'checkbox'].includes(field.type as string) && (
                                                                <span className="ml-2 text-xs text-gray-400">(Desabilitado)</span>
                                                            )}
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={field.value}
                                                            onChange={(e) => updateFieldValue(index, e.target.value)}
                                                            disabled={['radio', 'radio', 'select-one', 'checkbox'].includes(field.type as string)}
                                                            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                                                field.type === 'radio' || field.type === 'select' || field.type === 'select-one' || field.type === 'checkbox'
                                                                    ? 'bg-gray-100 border-gray-200 text-gray-500 cursor-not-allowed'
                                                                    : 'border-gray-300'
                                                            }`}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="p-6">
                                            <div className="mb-4">
                                                <div className="flex items-center justify-between mb-2">
                                                    <h3 className="text-lg font-semibold text-gray-900 truncate">{form.url}</h3>
                                                    <p className="text-sm text-gray-500">{form.fields.length} campo(s)</p>
                                                </div>
                                                <div className="flex gap-1 flex-wrap">
                                                    <button
                                                        onClick={() => openUrl(form.url)}
                                                        className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors cursor-pointer"
                                                    >
                                                        Abrir
                                                    </button>
                                                    <button
                                                        onClick={() => startEditing(form)}
                                                        className="px-2 py-1 text-xs bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200 transition-colors cursor-pointer"
                                                    >
                                                        Editar
                                                    </button>
                                                    <button
                                                        onClick={() => deleteForm(form.url)}
                                                        className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors cursor-pointer"
                                                    >
                                                        Excluir
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                                                {Array.isArray(form.fields) && form.fields.slice(0, 6).map((field, index) => (
                                                    <div key={index} className="bg-gray-50 rounded-md p-3">
                                                        <div className="text-xs font-medium text-gray-500 mb-1">{field.name || field.id || `Campo ${index + 1}`}</div>
                                                        <div className="text-sm text-gray-900 truncate">{field.value || <span className="text-gray-400 italic">Vazio</span>}</div>
                                                    </div>
                                                ))}
                                                {Array.isArray(form.fields) && form.fields.length > 6 && (
                                                    <div className="bg-gray-100 rounded-md p-3 flex items-center justify-center">
                                                        <span className="text-sm text-gray-500">+{form.fields.length - 6} mais</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
