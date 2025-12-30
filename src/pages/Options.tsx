/* eslint-disable import/no-unresolved */
import { useEffect, useState } from 'react';
import browser from 'webextension-polyfill';
import Modal from '../components/Modal';
import SiteCard from '../components/SiteCard';
import { Helper, type UrlPattern, type FormField } from '../utils/helper';

interface SavedForm {
    url: string;
    fields: FormField[];
}

export default function Options() {
    const [savedForms, setSavedForms] = useState<SavedForm[]>([]);
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
            showModal('error', 'Erro', 'Erro ao carregar formulários salvos!');
        }
    };

    const showModal = (type: 'info' | 'success' | 'warning' | 'error' | 'confirm', title: string, message: string, onConfirm?: () => void) => {
        setModal({ isOpen: true, type, title, message, onConfirm });
    };

    const handleDeleteForm = (url: string) => {
        showModal('confirm', 'Excluir Formulário', `Tem certeza que deseja excluir o formulário para ${url}?`, async () => {
            try {
                await browser.storage.local.remove(url);
                setSavedForms((prev) => prev.filter((form) => form.url !== url));
                showModal('success', 'Sucesso', 'Formulário excluído com sucesso!');
            } catch {
                showModal('error', 'Erro', 'Erro ao excluir formulário!');
            }
        });
    };

    const handleSaveForm = async (url: string, newFields: FormField[]) => {
        try {
            await browser.storage.local.set({ [url]: newFields });
            setSavedForms((prev) => prev.map((form) => (form.url === url ? { ...form, fields: newFields } : form)));
            showModal('success', 'Sucesso', 'Alterações salvas com sucesso!');
        } catch {
            showModal('error', 'Erro', 'Erro ao salvar alterações!');
        }
    };

    const loadUrlPatterns = async () => {
        try {
            const patterns = await Helper.getAllUrlPatterns();
            setUrlPatterns(patterns);
        } catch {
            showModal('error', 'Erro', 'Erro ao carregar padrões de URL!');
        }
    };

    const createPatternFromForm = async (url: string) => {
        try {
            const form = savedForms.find((f) => f.url === url);
            if (!form) return;

            const pattern = newPattern.trim();
            if (!pattern) {
                showModal('warning', 'Atenção', 'Digite um padrão de URL válido!');
                return;
            }

            await Helper.saveUrlPattern(pattern, form.fields, true);
            setNewPattern('');
            setShowPatternForm(false);
            await loadUrlPatterns();
            showModal('success', 'Sucesso', 'Padrão de URL criado com sucesso!');
        } catch {
            showModal('error', 'Erro', 'Erro ao criar padrão de URL!');
        }
    };

    const deletePattern = async (pattern: string) => {
        showModal('confirm', 'Confirmar exclusão', 'Tem certeza que deseja excluir este padrão?', async () => {
            try {
                await Helper.deleteUrlPattern(pattern);
                await loadUrlPatterns();
                showModal('success', 'Sucesso', 'Padrão excluído com sucesso!');
            } catch {
                showModal('error', 'Erro', 'Erro ao excluir padrão!');
            }
        });
    };

    const togglePattern = async (pattern: string, enabled: boolean) => {
        try {
            await Helper.toggleUrlPattern(pattern, enabled);
            await loadUrlPatterns();
        } catch {
            showModal('error', 'Erro', 'Erro ao alterar status do padrão!');
        }
    };

    // Função para sugerir padrão automaticamente baseada na URL
    const suggestPatternFromUrl = (url: string): string => {
        try {
            const urlObj = new URL(url);
            const pathParts = urlObj.pathname.split('/');
            const lastPart = pathParts[pathParts.length - 1];

            if (/^\d+$/.test(lastPart) && lastPart.length > 5) {
                pathParts[pathParts.length - 1] = '*';
                return `${urlObj.protocol}//${urlObj.host}${pathParts.join('/')}`;
            }

            pathParts[pathParts.length - 1] = '*';
            return `${urlObj.protocol}//${urlObj.host}${pathParts.join('/')}`;
        } catch {
            const lastSlashIndex = url.lastIndexOf('/');
            if (lastSlashIndex > 0) {
                return url.substring(0, lastSlashIndex + 1) + '*';
            }
            return url + '/*';
        }
    };

    const convertToPattern = async (url: string) => {
        const form = savedForms.find((f) => f.url === url);
        if (!form) return;

        const suggestedPattern = suggestPatternFromUrl(url);

        showModal('confirm', 'Criar padrão de URL', `Criar padrão "${suggestedPattern}" a partir deste formulário?\n\nEste padrão funcionará para todas as URLs que seguem esse formato.`, async () => {
            try {
                await Helper.saveUrlPattern(suggestedPattern, form.fields, true);
                await loadUrlPatterns();
                showModal('success', 'Sucesso', 'Padrão criado com sucesso! Agora o formulário funcionará para URLs similares.');
            } catch {
                showModal('error', 'Erro', 'Erro ao criar padrão!');
            }
        });
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-[1024px] mx-auto">
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
                        <div className="flex flex-col gap-4">
                            {savedForms.map((form) => (
                                <SiteCard key={form.url} url={form.url} fields={form.fields} onSave={handleSaveForm} onDelete={handleDeleteForm} onConvertToPattern={convertToPattern} />
                            ))}
                        </div>
                    )}
                </div>

                {/* Seção de Padrões de URL - Mantida similar mas simplificada */}
                <div className="bg-white rounded-lg shadow-sm p-6 mt-6">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Padrões de URL</h2>
                            <p className="text-sm text-gray-600 mt-1">Regras globais para múltiplas páginas</p>
                        </div>
                        <button onClick={() => setShowPatternForm(!showPatternForm)} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors cursor-pointer">
                            {showPatternForm ? 'Cancelar' : 'Novo Padrão'}
                        </button>
                    </div>

                    {showPatternForm && (
                        <div className="bg-gray-50 rounded-lg p-4 mb-4">
                            <h3 className="text-sm font-semibold text-gray-700 mb-3">Criar novo padrão</h3>
                            {/* Lógica de formulário de padrão simplificada/mantida */}
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Padrão de URL</label>
                                    <input
                                        type="text"
                                        value={newPattern}
                                        onChange={(e) => setNewPattern(e.target.value)}
                                        placeholder="https://meusite.com/pedido/*"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Copiar campos de:</label>
                                    <select
                                        onChange={(e) => createPatternFromForm(e.target.value)}
                                        className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">Selecione um formulário salvo...</option>
                                        {savedForms.map((form) => (
                                            <option key={form.url} value={form.url}>
                                                {form.url}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="space-y-3">
                        {urlPatterns.map((pattern) => (
                            <div key={pattern.pattern} className="border border-gray-200 rounded-lg p-4 flex justify-between items-center bg-gray-50">
                                <div>
                                    <code className="text-sm font-mono bg-white px-2 py-1 rounded border border-gray-200">{pattern.pattern}</code>
                                    <span className={`ml-2 text-xs px-2 py-1 rounded ${pattern.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                        {pattern.enabled ? 'Ativo' : 'Inativo'}
                                    </span>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => togglePattern(pattern.pattern, !pattern.enabled)} className="text-sm text-blue-600 hover:underline">
                                        {pattern.enabled ? 'Desativar' : 'Ativar'}
                                    </button>
                                    <button onClick={() => deletePattern(pattern.pattern)} className="text-sm text-red-600 hover:underline">
                                        Excluir
                                    </button>
                                </div>
                            </div>
                        ))}
                        {urlPatterns.length === 0 && <p className="text-gray-500 text-center text-sm">Nenhum padrão cadastrado.</p>}
                    </div>
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
