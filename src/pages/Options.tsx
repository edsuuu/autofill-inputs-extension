/* eslint-disable import/no-unresolved */
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Modal from '../components/Modal';
import ProfileModal from '../components/ProfileModal';
import SiteCard from '../components/SiteCard';
import { AutofillSaver } from '../services/Autofill/AutofillSaver';
import { type UrlPattern, type FormField } from '../utils/helper';
import { useAutofill } from '../context/AutofillContext';

interface SavedForm {
    url: string;
    profile: string;
    fields: FormField[];
}

export default function Options() {
    const { profiles, addProfile, deleteProfile } = useAutofill();
    const [groupedForms, setGroupedForms] = useState<Record<string, SavedForm[]>>({});
    const [urlPatterns, setUrlPatterns] = useState<UrlPattern[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [newPattern, setNewPattern] = useState<string>('');
    const [showPatternForm, setShowPatternForm] = useState<boolean>(false);
    const [searchParams, setSearchParams] = useSearchParams();
    const activeTab = (searchParams.get('tab') as 'sites' | 'profiles' | 'patterns' | 'backup') || 'sites';

    const setActiveTab = (tab: 'sites' | 'profiles' | 'patterns' | 'backup') => {
        setSearchParams({ tab });
    };
    const [selectedProfile, setSelectedProfile] = useState<string>('all');
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
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
            await loadAllData();
        })();
    }, []);

    const loadAllData = async () => {
        await loadSavedForms();
        await loadUrlPatterns();
    };

    const loadSavedForms = async () => {
        try {
            const allData = await AutofillSaver.getAllSiteData();
            const groups: Record<string, SavedForm[]> = {};

            Object.entries(allData).forEach(([url, profileMap]) => {
                Object.entries(profileMap).forEach(([profile, fields]) => {
                    if (!groups[profile]) groups[profile] = [];
                    groups[profile].push({ url, profile, fields });
                });
            });

            setGroupedForms(groups);
        } catch {
            showModal('error', 'Erro', 'Erro ao carregar formulários salvos!');
        }
    };

    const showModal = (type: 'info' | 'success' | 'warning' | 'error' | 'confirm', title: string, message: string, onConfirm?: () => void) => {
        setModal({ isOpen: true, type, title, message, onConfirm });
    };

    const handleDeleteForm = (url: string, profile: string) => {
        showModal('confirm', 'Excluir Formulário', `Tem certeza que deseja excluir o formulário para ${url} no perfil ${profile}?`, async () => {
            try {
                await AutofillSaver.deleteSiteData(url, profile);
                await loadSavedForms();
                showModal('success', 'Sucesso', 'Formulário excluído com sucesso!');
            } catch {
                showModal('error', 'Erro', 'Erro ao excluir formulário!');
            }
        });
    };

    const handleSaveForm = async (url: string, profile: string, newFields: FormField[]) => {
        try {
            await AutofillSaver.saveFieldsForUrl(url, newFields, profile);
            await loadSavedForms();
            showModal('success', 'Sucesso', 'Alterações salvas com sucesso!');
        } catch {
            showModal('error', 'Erro', 'Erro ao salvar alterações!');
        }
    };

    const loadUrlPatterns = async () => {
        try {
            const patterns = await AutofillSaver.getAllUrlPatterns();
            setUrlPatterns(patterns);
        } catch {
            showModal('error', 'Erro', 'Erro ao carregar padrões de URL!');
        }
    };

    const createPatternFromForm = async (url: string, profile: string) => {
        try {
            const profileForms = groupedForms[profile] || [];
            const form = profileForms.find((f) => f.url === url);
            if (!form) return;

            const pattern = newPattern.trim();
            if (!pattern) {
                showModal('warning', 'Atenção', 'Digite um padrão de URL válido!');
                return;
            }

            await AutofillSaver.saveUrlPattern(pattern, form.fields, true);
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
                await AutofillSaver.deleteUrlPattern(pattern);
                await loadUrlPatterns();
                showModal('success', 'Sucesso', 'Padrão excluído com sucesso!');
            } catch {
                showModal('error', 'Erro', 'Erro ao excluir padrão!');
            }
        });
    };

    const handleCreateProfile = () => {
        setIsProfileModalOpen(true);
    };

    const handleExport = async () => {
        try {
            const json = await AutofillSaver.exportAllData();
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `autofill-backup-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (error) {
            showModal('error', 'Erro', 'Falha ao exportar os dados.');
        }
    };

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.name.toLowerCase().endsWith('.json')) {
            showModal('error', 'Arquivo Inválido', 'Por favor, selecione apenas arquivos .json');
            e.target.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const content = event.target?.result as string;
                const result = await AutofillSaver.importAllData(content);
                if (result.success) {
                    showModal('success', 'Sucesso', result.message, () => {
                        window.location.reload();
                    });
                } else {
                    showModal('error', 'Erro', result.message);
                }
            } catch (error) {
                showModal('error', 'Erro', 'Erro ao processar o arquivo de importação.');
            }
        };
        reader.readAsText(file);
        // Reset input
        e.target.value = '';
    };

    return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans" style={{ fontFamily: "'Inter', sans-serif" }}>
            <div className="max-w-6xl mx-auto space-y-6">
                <header className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all">
                    <div className="flex items-center gap-5">
                        <div className="w-14 h-14 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-200 flex items-center justify-center shrink-0">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Painel AutoFill</h1>
                            <p className="text-slate-500 font-medium tracking-tight">Gerencie seus sites, perfis e padrões</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <svg className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            <input
                                type="text"
                                placeholder="Buscar URL..."
                                className="bg-slate-100 border-none transition-all focus:bg-white focus:ring-2 focus:ring-indigo-500 block w-full md:w-80 pl-11 pr-4 py-3 rounded-xl text-sm font-semibold text-slate-900 placeholder-slate-400 shadow-inner"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <div className="relative group min-w-[200px]">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                                    />
                                </svg>
                            </div>
                            <select
                                value={selectedProfile}
                                onChange={(e) => setSelectedProfile(e.target.value)}
                                className="bg-slate-100 border-none transition-all focus:bg-white focus:ring-2 focus:ring-indigo-500 block w-full pl-11 pr-4 py-3 rounded-xl text-sm font-semibold text-slate-900 appearance-none shadow-inner cursor-pointer"
                            >
                                <option value="all">Todos os Perfis</option>
                                {profiles.map((p) => (
                                    <option key={p} value={p}>
                                        Perfil: {p}
                                    </option>
                                ))}
                            </select>
                            <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-400">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                    <path
                                        fillRule="evenodd"
                                        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Tabs Nav */}
                <div className="flex items-center gap-2 border-b border-slate-200 pb-px">
                    <button
                        onClick={() => setActiveTab('sites')}
                        className={`px-6 py-3 text-sm font-semibold transition-all border-b-2 ${activeTab === 'sites' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                    >
                        Sites salvos
                    </button>
                    <button
                        onClick={() => setActiveTab('profiles')}
                        className={`px-6 py-3 text-sm font-semibold transition-all border-b-2 ${activeTab === 'profiles' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                    >
                        Perfis
                    </button>
                    <button
                        onClick={() => setActiveTab('patterns')}
                        className={`px-6 py-3 text-sm font-semibold transition-all border-b-2 ${activeTab === 'patterns' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                    >
                        Padrões globais
                    </button>
                    <button
                        onClick={() => setActiveTab('backup')}
                        className={`px-6 py-3 text-sm font-semibold transition-all border-b-2 ${activeTab === 'backup' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                    >
                        Exportar/Importar
                    </button>
                </div>

                <main className="grid grid-cols-1 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {activeTab === 'sites' && (
                        <div className="space-y-10">
                            {profiles
                                .filter((p) => selectedProfile === 'all' || p === selectedProfile)
                                .map((profile) => {
                                    const forms = groupedForms[profile] || [];
                                    const filtered = forms.filter((f) => f.url.toLowerCase().includes(searchTerm.toLowerCase()));
                                    if (filtered.length === 0 && searchTerm) return null;

                                    return (
                                        <section key={profile} className="space-y-4">
                                            <div className="flex items-center justify-between border-l-4 border-indigo-500 pl-4 py-1">
                                                <div>
                                                    <h2 className="text-xl font-bold text-slate-800 tracking-tight">Perfil: {profile}</h2>
                                                    <p className="text-xs font-semibold text-slate-400">{filtered.length} sites salvos</p>
                                                </div>
                                            </div>

                                            {filtered.length === 0 ? (
                                                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center border-dashed">
                                                    <p className="text-slate-400 text-sm font-medium">Nenhum site salvo neste perfil ainda.</p>
                                                </div>
                                            ) : (
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-6">
                                                    {filtered.map((form) => (
                                                        <SiteCard
                                                            key={`${form.url}-${form.profile}`}
                                                            url={form.url}
                                                            fields={form.fields}
                                                            onSave={(url, fields) => handleSaveForm(url, profile, fields)}
                                                            onDelete={(url) => handleDeleteForm(url, profile)}
                                                            onConvertToPattern={() => {}}
                                                        />
                                                    ))}
                                                </div>
                                            )}
                                        </section>
                                    );
                                })}
                        </div>
                    )}

                    {activeTab === 'profiles' && (
                        <div className="max-w-2xl space-y-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-bold text-slate-800 tracking-tight">Gerenciar perfis</h2>
                                <button
                                    onClick={handleCreateProfile}
                                    className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-slate-900 transition-all flex items-center gap-2"
                                >
                                    + Novo perfil
                                </button>
                            </div>
                            <div className="grid grid-cols-1 gap-4">
                                {profiles.map((profile) => (
                                    <div
                                        key={profile}
                                        className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between group hover:border-indigo-200 transition-all"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                </svg>
                                            </div>
                                            <div>
                                                <span className="text-lg font-semibold text-slate-800">{profile}</span>
                                                <p className="text-xs text-slate-400 font-medium">{(groupedForms[profile] || []).length} sites vinculados</p>
                                            </div>
                                        </div>
                                        {profile !== 'Padrão' && (
                                            <button
                                                onClick={() => deleteProfile(profile)}
                                                className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                                    />
                                                </svg>
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'patterns' && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-2 space-y-6 text-slate-400 italic">
                                Use padrões para aplicar campos em vários subdomínios ou caminhos semelhantes.
                                <div className="grid grid-cols-1 gap-4 mt-4">
                                    {urlPatterns.map((p) => (
                                        <div key={p.pattern} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 group relative">
                                            <code className="text-sm font-mono text-slate-600 block mb-4 break-all bg-slate-50 p-3 rounded-lg border border-slate-100">{p.pattern}</code>
                                            <div className="flex items-center justify-between">
                                                <span
                                                    className={`text-[10px] font-semibold px-3 py-1 rounded-full uppercase tracking-tighter ${p.enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'}`}
                                                >
                                                    {p.enabled ? 'Ativo' : 'Inativo'}
                                                </span>
                                                <button
                                                    onClick={() => deletePattern(p.pattern)}
                                                    className="text-rose-500 hover:text-rose-700 p-2 bg-rose-50 rounded-xl opacity-0 group-hover:opacity-100 transition-all"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={2}
                                                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                                        />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    {urlPatterns.length === 0 && (
                                        <p className="text-slate-400 text-center text-sm py-12 bg-white rounded-2xl border border-dashed border-slate-200 uppercase tracking-widest font-bold opacity-50">
                                            Nenhum padrão cadastrado
                                        </p>
                                    )}
                                </div>
                            </div>
                            <aside className="space-y-6">
                                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
                                    <h3 className="font-bold text-slate-800 tracking-tight">Criar novo padrão</h3>
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Padrão URL (Glob)</label>
                                            <input
                                                type="text"
                                                value={newPattern}
                                                onChange={(e) => setNewPattern(e.target.value)}
                                                placeholder="https://google.com/*"
                                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-semibold"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Importar de um site/perfil</label>
                                            <select
                                                onChange={(e) => {
                                                    const [url, profile] = e.target.value.split('|');
                                                    createPatternFromForm(url, profile);
                                                }}
                                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-indigo-500 outline-none"
                                            >
                                                <option value="">Selecione...</option>
                                                {Object.entries(groupedForms).flatMap(([profile, forms]) =>
                                                    forms.map((f) => (
                                                        <option key={`${f.url}|${profile}`} value={`${f.url}|${profile}`}>
                                                            {profile}: {f.url}
                                                        </option>
                                                    )),
                                                )}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </aside>
                        </div>
                    )}

                    {activeTab === 'backup' && (
                        <div className="w-full space-y-8 py-4">
                            <div className="bg-white rounded-4xl shadow-sm border border-slate-200 p-10 space-y-8">
                                <div className="space-y-2">
                                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">Backup de Dados</h2>
                                    <p className="text-slate-500 font-medium tracking-tight">Exporte todos os seus dados para um arquivo JSON ou restaure um backup anterior.</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="bg-slate-50 p-8 rounded-3xl border border-dashed border-slate-200 space-y-6 flex flex-col items-center text-center">
                                        <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center text-indigo-600">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                            </svg>
                                        </div>
                                        <div className="space-y-1">
                                            <h3 className="font-bold text-slate-900">Exportar Dados</h3>
                                            <p className="text-xs text-slate-400 font-medium">Baixe um arquivo contendo todos os seus sites e perfis.</p>
                                        </div>
                                        <button
                                            onClick={handleExport}
                                            className="w-full py-3 bg-white hover:bg-slate-900 hover:text-white text-slate-900 font-bold rounded-2xl border-2 border-slate-900 transition-all cursor-pointer shadow-sm active:scale-95"
                                        >
                                            Fazer Download
                                        </button>
                                    </div>

                                    <div className="bg-indigo-50 p-8 rounded-3xl border border-indigo-100 space-y-6 flex flex-col items-center text-center">
                                        <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center text-indigo-600">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                            </svg>
                                        </div>
                                        <div className="space-y-1">
                                            <h3 className="font-bold text-slate-900">Importar Dados</h3>
                                            <p className="text-xs text-slate-400 font-medium">Selecione um arquivo de backup para restaurar seus dados.</p>
                                        </div>
                                        <label className="w-full py-3 bg-indigo-600 hover:bg-slate-900 text-white font-bold rounded-2xl transition-all cursor-pointer text-center shadow-lg shadow-indigo-100 active:scale-95">
                                            Selecionar Arquivo
                                            <input type="file" accept=".json" onChange={handleImport} className="hidden" />
                                        </label>
                                    </div>
                                </div>

                                <div className="bg-amber-50 rounded-2xl p-4 flex gap-4 border border-amber-100">
                                    <div className="shrink-0 text-amber-500">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                            <path
                                                fillRule="evenodd"
                                                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                    </div>
                                    <p className="text-xs text-amber-700 font-medium leading-relaxed">
                                        <strong className="block mb-0.5">Aviso Importante:</strong>A importação de dados irá substituir TODOS os seus dados atuais. Certifique-se de que o arquivo JSON
                                        é válido e contém a chave de segurança correta.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </main>
            </div>

            <Modal
                isOpen={modal.isOpen}
                onClose={() => setModal({ ...modal, isOpen: false })}
                title={modal.title}
                message={modal.message}
                type={modal.type}
                onConfirm={modal.onConfirm}
                confirmText={modal.type === 'confirm' ? 'Confirmar' : 'Fechar'}
                cancelText="Cancelar"
            />
            <ProfileModal
                isOpen={isProfileModalOpen}
                onClose={() => setIsProfileModalOpen(false)}
                onSave={(name) => {
                    addProfile(name);
                    setIsProfileModalOpen(false);
                }}
                existingProfiles={profiles}
            />
        </div>
    );
}

