import React, { useState, useEffect } from 'react';
import { useAutofill } from '../context/AutofillContext';
import { AutofillService } from '../services/AutofillService';
import browser from 'webextension-polyfill';
import ProfileModal from '../components/ProfileModal';

export default function Popup() {
    const {
        isEnabled,
        barBehavior,
        setBarBehavior,
        currentProfile,
        setCurrentProfile,
        profiles,
        addProfile,
        showToast,
        isLoading,
        blacklistedSites,
        removeSiteFromBlacklist,
        isFloatingEnabled,
        setIsFloatingEnabled
    } = useAutofill();

    const [isSaving, setIsSaving] = useState(false);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [currentOrigin, setCurrentOrigin] = useState<string | null>(null);

    useEffect(() => {
        const getTabOrigin = async () => {
            const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
            if (tab?.url) {
                try {
                    const url = new URL(tab.url);
                    setCurrentOrigin(url.origin);
                } catch (e) {
                    setCurrentOrigin(null);
                }
            }
        };
        getTabOrigin();

        const clearBadge = async () => {
            await browser.action.setBadgeText({ text: '' });
            await browser.storage.local.set({ hasNewUpdate: false });
        };
        clearBadge();
    }, []);

    const isBlacklisted = currentOrigin && blacklistedSites.includes(currentOrigin);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
            if (tab.url) {
                const result = await AutofillService.captureAndSave(tab.url, currentProfile);
                if (result.success) {
                    showToast(result.message, 'success');
                    await browser.tabs.sendMessage(tab.id!, {
                        action: 'show_toast',
                        message: `Salvo no perfil "${currentProfile}"`,
                        type: 'success'
                    });
                } else {
                    showToast(result.message, 'error');
                }
            }
        } catch (error) {
            showToast('Erro ao salvar formulário', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleToggleEnabled = async () => {
        const newValue = !isEnabled;
        await browser.storage.local.set({ enabled: newValue });
    };

    const handleProfileChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        if (value === '__add_profile__') {
            setIsProfileModalOpen(true);
            e.target.value = currentProfile;
        } else {
            setCurrentProfile(value);
        }
    };

    if (isLoading) return <div className="p-12 text-center text-slate-400 font-semibold uppercase tracking-widest text-xs animate-pulse">Carregando...</div>;

    return (
        <div className="w-[360px] bg-slate-50 text-slate-900 border-none rounded-none overflow-hidden shadow-2xl font-sans relative" style={{ fontFamily: "'Inter', sans-serif" }}>
            <header className="px-5 pt-7 pb-5 bg-white border-b border-slate-100">
                <div className="flex items-center">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-100 shrink-0">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                        <div className="flex flex-col min-w-0">
                            <h1 className="text-xl font-bold text-slate-900 leading-tight truncate">AutoFill</h1>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Versão {browser.runtime.getManifest().version}</span>
                        </div>
                    </div>
                    <div className="ml-auto flex items-center gap-2">
                        <button
                            onClick={() => browser.tabs.create({ url: browser.runtime.getURL('src/options.html#whats-new') })}
                            className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-2xl transition-all cursor-pointer shadow-sm border border-slate-50 shrink-0 group relative overflow-hidden"
                            title="Novidades"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 group-hover:scale-110 transition-transform">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
                            </svg>
                        </button>
                        <button
                            onClick={() => browser.runtime.openOptionsPage()}
                            className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-2xl transition-all cursor-pointer shadow-sm border border-slate-50 shrink-0"
                            title="Configurações"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 0 1 0 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 0 1-.22.128c-.332.183-.582.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 0 1 0-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281Z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                            </svg>
                        </button>
                    </div>
                </div>
            </header>

            <main className="p-6 space-y-6">
                {isBlacklisted && (
                    <div className="bg-rose-50 rounded-3xl p-5 border border-rose-100 space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-rose-500 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-rose-200">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                </svg>
                            </div>
                            <div className="min-w-0">
                                <h3 className="text-sm font-bold text-rose-900 leading-tight">Site Bloqueado</h3>
                                <p className="text-[10px] text-rose-500 font-semibold truncate">{currentOrigin}</p>
                            </div>
                        </div>
                        <button
                            onClick={() => currentOrigin && removeSiteFromBlacklist(currentOrigin)}
                            className="w-full py-3 bg-white text-rose-600 text-xs font-bold rounded-xl border border-rose-200 hover:bg-rose-100 transition-all cursor-pointer shadow-sm active:scale-95"
                        >
                            Remover da Blacklist
                        </button>
                    </div>
                )}

                <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 space-y-5">
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Perfil para salvar</label>
                        <div className="relative">
                            <select
                                value={currentProfile}
                                onChange={handleProfileChange}
                                className={`w-full pl-4 pr-10 py-3.5 bg-slate-50 text-slate-800 text-sm font-semibold border border-slate-100 focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none cursor-pointer appearance-none shadow-inner ${currentProfile === 'Padrão' ? 'rounded-2xl' : 'rounded-2xl'}`}
                            >
                                {profiles.map(p => (
                                    <option key={p} value={p}>{p}</option>
                                ))}
                                <option value="__add_profile__" className="text-indigo-600 font-semibold">+ Criar novo perfil</option>
                            </select>
                            <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-400">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className={`w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-xl shadow-indigo-100 transition-all flex items-center justify-center gap-3 group cursor-pointer active:scale-95 ${isSaving ? 'opacity-70 grayscale' : ''}`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"/>
                        </svg>
                        {isSaving ? 'Salvando...' : 'Salvar dados do site'}
                    </button>
                </div>

                <div className="space-y-5">

                     <div className="flex items-center justify-between px-2 pt-2 border-t border-slate-100/50 mt-4">
                        <div className="space-y-0.5">
                            <span className="text-sm font-bold text-slate-800 block">Botão Flutuante</span>
                            <span className={`text-[10px] font-bold uppercase transition-colors ${isFloatingEnabled ? 'text-emerald-500' : 'text-slate-400'}`}>
                                {isFloatingEnabled ? 'Ativado' : 'Desativado'}
                            </span>
                        </div>
                        <button
                            onClick={() => setIsFloatingEnabled(!isFloatingEnabled)}
                            className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-300 ease-in-out focus:outline-none shadow-sm ${isFloatingEnabled ? 'bg-indigo-600' : 'bg-slate-300'}`}
                        >
                            <span className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-300 ease-in-out ${isFloatingEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                        </button>
                    </div>
                    
                    <div className="flex items-center justify-between px-2">
                        <div className="space-y-0.5">
                            <span className="text-sm font-bold text-slate-800 block">Auto-preenchimento</span>
                            <span className={`text-[10px] font-bold uppercase transition-colors ${isEnabled ? 'text-emerald-500' : 'text-slate-400'}`}>
                                {isEnabled ? 'Ativado' : 'Desativado'}
                            </span>
                        </div>
                        <button
                            onClick={handleToggleEnabled}
                            className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-300 ease-in-out focus:outline-none shadow-sm ${isEnabled ? 'bg-indigo-600' : 'bg-slate-300'}`}
                        >
                            <span className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-300 ease-in-out ${isEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                        </button>
                    </div>

                    <div className="space-y-3 bg-white/50 p-4 rounded-3xl border border-slate-100">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block ml-1">Visibilidade da barra</label>
                        <div className="flex p-1.5 bg-slate-100 rounded-2xl gap-1">
                            <button
                                onClick={() => setBarBehavior('all')}
                                className={`flex-1 py-1.5 rounded-xl text-[10px] font-bold transition-all cursor-pointer ${barBehavior === 'all' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                Todas as telas
                            </button>
                            <button
                                onClick={() => setBarBehavior('per-site')}
                                className={`flex-1 py-1.5 rounded-xl text-[10px] font-bold transition-all cursor-pointer ${barBehavior === 'per-site' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                Sites salvos
                            </button>
                        </div>
                    </div>


                </div>
            </main>

            <ProfileModal
                isOpen={isProfileModalOpen}
                onClose={() => setIsProfileModalOpen(false)}
                onSave={(name) => {
                    addProfile(name);
                    setCurrentProfile(name);
                }}
                existingProfiles={profiles}
            />
        </div>
    );
}
