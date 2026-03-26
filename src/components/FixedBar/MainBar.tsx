import React from 'react';
import browser from 'webextension-polyfill';

interface MainBarProps {
    topOffset: number;
    setBarOpen: (open: boolean) => void;
    isSavedSite: boolean;
    isNewSite: boolean;
    handleFill: () => void;
    handleDeleteSaved: () => void;
    handleSave: () => void;
    currentProfile: string;
    handleProfileChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    profiles: string[];
    handleDeleteCurrentProfile: () => void;
    handleSmartFill: () => void;
    addSiteToBlacklist: (origin: string) => void;
    showToast: (message: string, type: 'success' | 'error') => void;
}

export const MainBar: React.FC<MainBarProps> = ({
    topOffset,
    setBarOpen,
    isSavedSite,
    isNewSite,
    handleFill,
    handleDeleteSaved,
    handleSave,
    currentProfile,
    handleProfileChange,
    profiles,
    handleDeleteCurrentProfile,
    handleSmartFill,
    addSiteToBlacklist,
    showToast
}) => {
    return (
        <div
            style={{ top: `${topOffset}px` }}
            className="fixed left-0 w-full bg-slate-900 text-white h-12.5 flex items-center px-4 shadow-xl z-999999 border-b border-white/10 animate-in slide-in-from-top duration-300"
        >
            <div
                onClick={() => setBarOpen(false)}
                className="flex items-center gap-4 cursor-pointer group hover:opacity-80 transition-all shrink-0"
            >
                <div className="bg-indigo-600 p-1.5 rounded-lg shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                </div>
                <span className="font-bold text-sm tracking-tighter text-white/90">AutoFill</span>
            </div>

            <div className="h-6 w-px bg-white/10 mx-6" />

            <div className="flex items-center gap-4 flex-1">
                {(isSavedSite || isNewSite) && (
                    <div className="flex items-center gap-2">
                        {isSavedSite && (
                            <div className="flex items-center">
                                <button
                                    onClick={handleFill}
                                    className="px-4 h-9 bg-indigo-600 hover:bg-indigo-700 text-white rounded-l-md text-xs font-semibold transition-all flex items-center gap-2  cursor-pointer border-r border-white/10"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                    Preencher
                                </button>
                                <button
                                    onClick={handleDeleteSaved}
                                    className="px-3 h-9 bg-rose-600 hover:bg-rose-700 text-white rounded-r-md text-xs transition-all flex items-center justify-center shadow-sm cursor-pointer"
                                    title="Remover dados salvos"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                            </div>
                        )}

                        <button
                            onClick={handleSave}
                            className="px-3 h-7 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-[10px] font-bold transition-all flex items-center gap-2 shadow-sm cursor-pointer"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"/>
                            </svg>
                            {isSavedSite ? 'Atualizar' : 'Salvar'}
                        </button>
                    </div>
                )}

                <div className="flex items-center gap-2 ml-4">
                    <span className="text-[10px] text-white/30 font-semibold uppercase tracking-widest">Perfil</span>
                    <div className="flex items-center">
                        <select
                            value={currentProfile}
                            onChange={handleProfileChange}
                            className={`bg-slate-800 border border-white/10 text-white text-[10px] h-7 outline-none focus:ring-1 focus:ring-indigo-500 transition-all hover:bg-slate-700 cursor-pointer font-bold ${currentProfile === 'Padrão' ? 'rounded-md pl-3 pr-8' : 'rounded-l-md px-2 border-r-0'}`}
                        >
                            {profiles.map(p => (
                                <option key={p} value={p}>{p}</option>
                            ))}
                            <option value="__add_profile__" className="text-indigo-400 font-medium">+ Novo Perfil</option>
                        </select>
                        {currentProfile !== 'Padrão' && (
                            <button
                                onClick={handleDeleteCurrentProfile}
                                className="px-2 h-7 bg-slate-800 hover:bg-rose-900/50 text-rose-400 border border-white/10 rounded-r-md transition-all cursor-pointer border-l-0"
                                title="Excluir perfil"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </button>
                        )}
                    </div>
                    {!isSavedSite && (
                        <button
                            onClick={handleSmartFill}
                            className="ml-3 px-3 h-7 bg-indigo-600 hover:bg-slate-900 text-white rounded-md text-[10px] font-bold transition-all flex items-center gap-2 shadow-lg shadow-indigo-500/20 cursor-pointer border border-indigo-400/20"
                            title="Smart Fill: Detecta, preenche e salva campos automaticamente"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            Smart Fill
                        </button>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-3">
                <button
                    onClick={() => {
                        addSiteToBlacklist(window.location.origin);
                        showToast('Site bloqueado!', 'success');
                    }}
                    className="text-[10px] text-rose-400 hover:bg-rose-400/20 rounded-md p-2 font-semibold uppercase tracking-widest transition-colors cursor-pointer"
                >
                    Blacklist
                </button>
                <button
                    onClick={() => browser.runtime.sendMessage({ action: 'open_options' })}
                    className="p-2 text-white/30 hover:text-white hover:bg-white/5 rounded-lg transition-all cursor-pointer"
                    title="Configurações"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                </button>
                <button
                    onClick={() => setBarOpen(false)}
                    className="p-2 text-white/30 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all cursor-pointer"
                    title="Fechar"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        </div>
    );
};
