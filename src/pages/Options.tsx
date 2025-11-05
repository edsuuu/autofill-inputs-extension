/* eslint-disable import/no-unresolved */
import { useEffect, useState } from 'react';
import browser from 'webextension-polyfill';
import Modal from '../components/Modal';
import { Helper, type UrlPattern } from '../utils/helper';

interface FormField {
    name?: string;
    id?: string;
    value?: string | boolean;
    type?: string;
    useUuid?: boolean;
}

interface SavedForm {
    url: string;
    fields: FormField[];
}

export default function Options() {
    const [savedForms, setSavedForms] = useState<SavedForm[]>([]);
    const [editingForm, setEditingForm] = useState<string | null>(null);
    const [editingFields, setEditingFields] = useState<FormField[]>([]);
    const [urlPatterns, setUrlPatterns] = useState<UrlPattern[]>([]);
    const [newPattern, setNewPattern] = useState<string>('');
    const [showPatternForm, setShowPatternForm] = useState<boolean>(false);
    const [modal, setModal] = useState<{
        isOpen: boolean;
        type: 'info' | 'success' | 'warning' | 'error' | 'confirm';
        title: string;
        message: string;
        onConfirm?: () => void;
            }>({
                isOpen: false,
                type: 'info',
                title: '',
                message: '',
            });

    useEffect(() => {
        (async function () {
            await loadSavedForms();
            await loadUrlPatterns();
        })();
    }, []);

    const loadSavedForms = async () => {
        try {
            const data = await browser.storage.local.get(null);
            const forms: SavedForm[] = [];

            Object.keys(data).forEach((key) => {
                if (!['enabled', 'floatingButton', 'floatingButtonPosition', '__url_patterns__'].includes(key) && data[key]) {
                    forms.push({
                        url: key,
                        fields: data[key],
                    });
                }
            });

            setSavedForms(forms);
        } catch {
            setModal({
                isOpen: true,
                type: 'error',
                title: 'Erro',
                message: 'Erro ao carregar formulários salvos!',
            });
        }
    };

    const deleteForm = async (url: string) => {
        try {
            await browser.storage.local.remove(url);
            setSavedForms((prev) => prev.filter((form) => form.url !== url));
        } catch {
            setModal({
                isOpen: true,
                type: 'error',
                title: 'Erro',
                message: 'Erro ao excluir formulário!',
            });
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
            setModal({
                isOpen: true,
                type: 'error',
                title: 'Erro',
                message: 'Erro ao salvar alterações!',
            });
        }
    };

    const updateFieldValue = (index: number, value: string) => {
        setEditingFields((prev) => prev.map((field, i) => (i === index ? { ...field, value } : field)));
    };

    const toggleUuid = (index: number) => {
        setEditingFields((prev) => prev.map((field, i) => (i === index ? { ...field, useUuid: !field.useUuid } : field)));
    };

    const openUrl = (url: string) => {
        window.open(url, '_blank');
    };

    const loadUrlPatterns = async () => {
        try {
            const patterns = await Helper.getAllUrlPatterns();
            setUrlPatterns(patterns);
        } catch {
            setModal({
                isOpen: true,
                type: 'error',
                title: 'Erro',
                message: 'Erro ao carregar padrões de URL!',
            });
        }
    };

    const createPatternFromForm = async (url: string) => {
        try {
            const form = savedForms.find(f => f.url === url);
            if (!form) {
                setModal({
                    isOpen: true,
                    type: 'error',
                    title: 'Erro',
                    message: 'Formulário não encontrado!',
                });
                return;
            }

            const pattern = newPattern.trim();
            if (!pattern) {
                setModal({
                    isOpen: true,
                    type: 'warning',
                    title: 'Atenção',
                    message: 'Digite um padrão de URL válido!',
                });
                return;
            }

            await Helper.saveUrlPattern(pattern, form.fields, true);
            setNewPattern('');
            setShowPatternForm(false);
            await loadUrlPatterns();
            setModal({
                isOpen: true,
                type: 'success',
                title: 'Sucesso',
                message: 'Padrão de URL criado com sucesso!',
            });
        } catch {
            setModal({
                isOpen: true,
                type: 'error',
                title: 'Erro',
                message: 'Erro ao criar padrão de URL!',
            });
        }
    };

    const deletePattern = async (pattern: string) => {
        setModal({
            isOpen: true,
            type: 'confirm',
            title: 'Confirmar exclusão',
            message: 'Tem certeza que deseja excluir este padrão?',
            onConfirm: async () => {
                try {
                    await Helper.deleteUrlPattern(pattern);
                    await loadUrlPatterns();
                    setModal({
                        isOpen: true,
                        type: 'success',
                        title: 'Sucesso',
                        message: 'Padrão excluído com sucesso!',
                    });
                } catch {
                    setModal({
                        isOpen: true,
                        type: 'error',
                        title: 'Erro',
                        message: 'Erro ao excluir padrão!',
                    });
                }
            },
        });
    };

    const togglePattern = async (pattern: string, enabled: boolean) => {
        try {
            await Helper.toggleUrlPattern(pattern, enabled);
            await loadUrlPatterns();
        } catch {
            setModal({
                isOpen: true,
                type: 'error',
                title: 'Erro',
                message: 'Erro ao alterar status do padrão!',
            });
        }
    };

    // Função para sugerir padrão automaticamente baseado na URL
    const suggestPatternFromUrl = (url: string): string => {
        try {
            const urlObj = new URL(url);
            const pathParts = urlObj.pathname.split('/');

            // Encontrar a última parte do caminho que parece ser um ID (número longo)
            const lastPart = pathParts[pathParts.length - 1];

            // Se a última parte é um número longo (provavelmente um ID), substituir por *
            if (/^\d+$/.test(lastPart) && lastPart.length > 5) {
                pathParts[pathParts.length - 1] = '*';
                return `${urlObj.protocol}//${urlObj.host}${pathParts.join('/')}`;
            }

            // Se não encontrar padrão claro, apenas substituir a última parte por *
            pathParts[pathParts.length - 1] = '*';
            return `${urlObj.protocol}//${urlObj.host}${pathParts.join('/')}`;
        } catch {
            // Se não conseguir parsear, tentar substituir a última parte após a última /
            const lastSlashIndex = url.lastIndexOf('/');
            if (lastSlashIndex > 0) {
                return url.substring(0, lastSlashIndex + 1) + '*';
            }
            return url + '/*';
        }
    };

    // Função para converter URL em padrão automaticamente
    const convertToPattern = async (url: string) => {
        try {
            const form = savedForms.find(f => f.url === url);
            if (!form) {
                setModal({
                    isOpen: true,
                    type: 'error',
                    title: 'Erro',
                    message: 'Formulário não encontrado!',
                });
                return;
            }

            const suggestedPattern = suggestPatternFromUrl(url);

            setModal({
                isOpen: true,
                type: 'confirm',
                title: 'Criar padrão de URL',
                message: `Criar padrão "${suggestedPattern}" a partir deste formulário?\n\nEste padrão funcionará para todas as URLs que seguem esse formato.`,
                onConfirm: async () => {
                    try {
                        await Helper.saveUrlPattern(suggestedPattern, form.fields, true);
                        await loadUrlPatterns();
                        setModal({
                            isOpen: true,
                            type: 'success',
                            title: 'Sucesso',
                            message: 'Padrão criado com sucesso! Agora o formulário funcionará para URLs similares.',
                        });
                    } catch {
                        setModal({
                            isOpen: true,
                            type: 'error',
                            title: 'Erro',
                            message: 'Erro ao criar padrão!',
                        });
                    }
                },
            });
        } catch {
            setModal({
                isOpen: true,
                type: 'error',
                title: 'Erro',
                message: 'Erro ao criar padrão!',
            });
        }
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
                                                    <div key={index} className="space-y-2 min-w-0">
                                                        <div className="flex items-start justify-between gap-2">
                                                            <label
                                                                className={`flex-1 text-sm font-medium flex-col min-w-0 ${
                                                                    ['radio', 'radio', 'select-one'].includes(field.type as string) ? 'text-gray-400' : 'text-gray-700'
                                                                }`}
                                                            >
                                                                <span className="break-words">{field.name || field.id || `Campo ${index + 1}`}</span>
                                                                {['radio', 'radio', 'select-one', 'checkbox'].includes(field.type as string) && (
                                                                    <span className="text-xs text-gray-400">(Desabilitado)</span>
                                                                )}
                                                            </label>
                                                            {field.type !== 'checkbox' && field.type !== 'radio' && (
                                                                <label className="flex items-center gap-1 cursor-pointer flex-shrink-0">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={field.useUuid || false}
                                                                        onChange={() => toggleUuid(index)}
                                                                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                                                    />
                                                                    <span className="text-xs text-gray-600 whitespace-nowrap">UUID</span>
                                                                </label>
                                                            )}
                                                        </div>
                                                        <input
                                                            type="text"
                                                            value={field.useUuid ? 'Gerado automaticamente' : (field.value as string) || ''}
                                                            onChange={(e) => updateFieldValue(index, e.target.value)}
                                                            disabled={['radio', 'radio', 'select-one', 'checkbox'].includes(field.type as string) || field.useUuid}
                                                            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent overflow-hidden text-ellipsis ${
                                                                field.type === 'radio' || field.type === 'select' || field.type === 'select-one' || field.type === 'checkbox' || field.useUuid
                                                                    ? 'bg-gray-100 border-gray-200 text-gray-500 cursor-not-allowed'
                                                                    : 'border-gray-300'
                                                            }`}
                                                        />
                                                        {field.useUuid && (
                                                            <p className="text-xs text-blue-600 break-words">Um UUID será gerado a cada preenchimento</p>
                                                        )}
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
                                                        onClick={() => convertToPattern(form.url)}
                                                        className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition-colors cursor-pointer"
                                                        title="Converter em padrão para funcionar em URLs similares"
                                                    >
                                                        Converter em Padrão
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
                                                        <div className="text-xs font-medium text-gray-500 mb-1">
                                                            {field.name || field.id || `Campo ${index + 1}`}
                                                            {field.useUuid && <span className="ml-1 text-blue-600">(UUID)</span>}
                                                        </div>
                                                        <div className="text-sm text-gray-900 truncate">
                                                            {field.useUuid
                                                                ? 'Gerado automaticamente'
                                                                : typeof field.value === 'boolean'
                                                                    ? (field.value ? 'Sim' : 'Não')
                                                                    : (field.value || <span className="text-gray-400 italic">Vazio</span>)
                                                            }
                                                        </div>
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

                {/* Seção de Padrões de URL */}
                <div className="bg-white rounded-lg shadow-sm p-6 mt-6">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Padrões de URL</h2>
                            <p className="text-sm text-gray-600 mt-1">Use padrões com * para aplicar formulários em múltiplas URLs</p>
                        </div>
                        <button
                            onClick={() => setShowPatternForm(!showPatternForm)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors cursor-pointer"
                        >
                            {showPatternForm ? 'Cancelar' : 'Novo Padrão'}
                        </button>
                    </div>

                    {showPatternForm && savedForms.length > 0 && (
                        <div className="bg-gray-50 rounded-lg p-4 mb-4">
                            <h3 className="text-sm font-semibold text-gray-700 mb-3">Criar padrão a partir de um formulário salvo</h3>
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Padrão de URL (use * para wildcard)
                                    </label>
                                    <input
                                        type="text"
                                        value={newPattern}
                                        onChange={(e) => setNewPattern(e.target.value)}
                                        placeholder="https://meusite.com/pedido/*"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        Exemplo: https://meusite.com/pedido/* corresponderá a todas as URLs que começam com esse padrão
                                    </p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Formulário base
                                    </label>
                                    <select
                                        onChange={(e) => {
                                            if (e.target.value) {
                                                createPatternFromForm(e.target.value);
                                            }
                                        }}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">Selecione um formulário...</option>
                                        {savedForms.map((form) => (
                                            <option key={form.url} value={form.url}>
                                                {form.url} ({form.fields.length} campos)
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    {urlPatterns.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-gray-500">Nenhum padrão de URL cadastrado</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {urlPatterns.map((pattern) => (
                                <div key={pattern.pattern} className="border border-gray-200 rounded-lg p-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">{pattern.pattern}</code>
                                                <span className={`text-xs px-2 py-1 rounded ${pattern.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                                    {pattern.enabled ? 'Ativado' : 'Desativado'}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-500 mt-1">{pattern.fields.length} campo(s)</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <label className="flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={pattern.enabled}
                                                    onChange={(e) => togglePattern(pattern.pattern, e.target.checked)}
                                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                                />
                                                <span className="ml-2 text-sm text-gray-700">Ativar</span>
                                            </label>
                                            <button
                                                onClick={() => deletePattern(pattern.pattern)}
                                                className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors cursor-pointer"
                                            >
                                                Excluir
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <Modal
                isOpen={modal.isOpen}
                onClose={() => setModal({ ...modal, isOpen: false })}
                title={modal.title}
                message={modal.message}
                type={modal.type}
                onConfirm={modal.onConfirm}
                confirmText="Confirmar"
                cancelText="Cancelar"
            />
        </div>
    );
}
