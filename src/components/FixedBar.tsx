import React, { useEffect, useState } from 'react';
import browser from 'webextension-polyfill';
import { useAutofill } from '../context/AutofillContext';
import { AutofillService } from '../services/Autofill/AutofillService';
import { AutofillSaver } from '../services/Autofill/AutofillSaver';
import Modal from './Modal';
import ProfileModal from './ProfileModal';

export const FixedBar: React.FC = () => {
    const { 
        isEnabled, 
        barBehavior, 
        isBarOpen, 
        setBarOpen, 
        currentProfile, 
        setCurrentProfile, 
        addSiteToBlacklist, 
        blacklistedSites,
        profiles,
        addProfile,
        deleteProfile,
        deleteSiteData,
        toasts,
        showToast,
        isLoading 
    } = useAutofill();
    const [isNewSite, setIsNewSite] = useState(false);
    const [isSavedSite, setIsSavedSite] = useState(false);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm?: () => void;
    }>({
        isOpen: false,
        title: '',
        message: '',
    });

    // Push content down logic
    const [topOffset, setTopOffset] = useState(0);

    useEffect(() => {
        const isVisible = isEnabled && !blacklistedSites.includes(window.location.origin) && 
                         (barBehavior === 'all' || isSavedSite);
        
        const BAR_HEIGHT = 56;
        const MOUNT_ID = 'autofill-extension-root';

        const adjustFixedElements = (show: boolean) => {
            // Find "Pre-Header" (like the Green LOCAL bar)
            const greenBar = document.querySelector('div.fixed.top-0.bg-green-600') as HTMLElement;
            const greenBarHeight = greenBar ? greenBar.offsetHeight : 0;
            
            if (show) setTopOffset(greenBarHeight);
            else setTopOffset(0);

            const totalOffset = show ? (BAR_HEIGHT + greenBarHeight) : 0;

            const elements = document.querySelectorAll('*');
            elements.forEach(el => {
                const htmlEl = el as HTMLElement;
                if (htmlEl.id === MOUNT_ID || htmlEl.closest(`#${MOUNT_ID}`)) return;
                
                // Don't shift the green bar itself if it's supposed to stay at top 0
                if (htmlEl === greenBar) return;

                const style = window.getComputedStyle(htmlEl);
                if (style.position === 'fixed') {
                    const topValue = style.top;
                    const isAtTop = topValue === '0px' || topValue === '0' || topValue === 'auto';
                    
                    if (show && isAtTop) {
                        if (!htmlEl.dataset.autofillShifted || htmlEl.dataset.currentOffset !== String(totalOffset)) {
                            if (!htmlEl.dataset.autofillShifted) {
                                htmlEl.dataset.originalTop = topValue;
                                htmlEl.dataset.autofillShifted = 'true';
                            }
                            htmlEl.dataset.currentOffset = String(totalOffset);
                            htmlEl.style.transition = 'top 0.2s ease-in-out, margin-top 0.2s ease-in-out';
                            htmlEl.style.top = `${totalOffset}px`;
                        }
                    } else if (!show && htmlEl.dataset.autofillShifted) {
                        htmlEl.style.top = htmlEl.dataset.originalTop === 'auto' ? '' : htmlEl.dataset.originalTop || '';
                        delete htmlEl.dataset.originalTop;
                        delete htmlEl.dataset.autofillShifted;
                        delete htmlEl.dataset.currentOffset;
                    }
                }
            });

            return totalOffset;
        };

        const observer = new MutationObserver(() => {
            if (isVisible && isBarOpen) {
                adjustFixedElements(true);
            }
        });

        if (isVisible && isBarOpen) {
            const finalOffset = adjustFixedElements(true);
            document.body.style.transition = 'padding-top 0.2s ease-in-out';
            document.body.style.paddingTop = `${finalOffset}px`;
            observer.observe(document.body, { childList: true, subtree: true });
        } else {
            document.body.style.paddingTop = '';
            if (document.body.style.transition.includes('padding-top')) {
                document.body.style.transition = '';
            }
            adjustFixedElements(false);
        }

        return () => {
            document.body.style.paddingTop = '';
            if (document.body.style.transition.includes('padding-top')) {
                document.body.style.transition = '';
            }
            adjustFixedElements(false);
            observer.disconnect();
        };
    }, [isBarOpen, isEnabled, blacklistedSites, barBehavior, isSavedSite]);

    useEffect(() => {
        const checkSite = async () => {
            if (isLoading) return;
            const fields = await AutofillSaver.getFieldsForUrl(window.location.href, currentProfile);
            if (fields.length > 0) {
                setIsSavedSite(true);
                setIsNewSite(false);
            } else {
                setIsSavedSite(false);
                const inputs = document.querySelectorAll('input:not([type="hidden"]), textarea, select');
                if (inputs.length > 0) setIsNewSite(true);
            }
        };
        checkSite();

        const handleToastEvent = (e: Event) => {
            const customEvent = e as CustomEvent;
            showToast(customEvent.detail.message, customEvent.detail.type);
        };

        window.addEventListener('autofill-toast', handleToastEvent);
        return () => window.removeEventListener('autofill-toast', handleToastEvent);
    }, [isLoading, currentProfile]);

    if (isLoading) return null;

    // Blacklist check: hide bar if site is blacklisted
    const currentOrigin = window.location.origin;
    const isBlacklisted = blacklistedSites.includes(currentOrigin);

    if (!isEnabled || isBlacklisted) return null;
    if (barBehavior === 'per-site' && !isSavedSite) return null;

    const handleFill = async () => {
        await AutofillService.fillForm(window.location.href, false, currentProfile);
        showToast(`Preenchido usando perfil "${currentProfile}"`, 'success');
    };


    const handleSave = async () => {
        const result = await AutofillService.captureAndSave(window.location.href, currentProfile);
        if (result.success) {
            setIsSavedSite(true);
            showToast(result.message, 'success');
        } else {
            showToast(result.message, 'error');
        }
    };

    const handleDeleteSaved = async () => {
        setConfirmModal({
            isOpen: true,
            title: 'Excluir Dados',
            message: `Remover dados salvos para este site no perfil "${currentProfile}"?`,
            onConfirm: async () => {
                await deleteSiteData(window.location.href, currentProfile);
                setIsSavedSite(false);
                setIsNewSite(true);
            }
        });
    };

    const handleDeleteCurrentProfile = async () => {
        if (currentProfile === 'Padrão') {
            showToast('O perfil Padrão não pode ser removido.', 'error');
            return;
        }
        setConfirmModal({
            isOpen: true,
            title: 'Excluir Perfil',
            message: `Tem certeza que deseja remover o perfil "${currentProfile}" e TODOS os seus dados?`,
            onConfirm: async () => {
                await deleteProfile(currentProfile);
            }
        });
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

    if (!isBarOpen) {
        return (
            <div 
                onClick={() => setBarOpen(true)}
                style={{ top: `${topOffset + 8}px` }}
                className="fixed left-2 w-10 h-10 bg-indigo-600 rounded-lg shadow-lg cursor-pointer flex items-center justify-center hover:bg-indigo-700 transition-all z-999999 animate-in fade-in zoom-in duration-300"
                title="Abrir AutoFill"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
            </div>
        );
    }

    return (
        <>
            {/* Fixed Top Bar */}
            <div 
                style={{ top: `${topOffset}px` }}
                className="fixed left-0 w-full bg-slate-900 text-white h-14 flex items-center px-4 shadow-xl z-999999 border-b border-white/10 animate-in slide-in-from-top duration-300"
            >
                <div className="flex items-center gap-3">
                    <div className="bg-indigo-600 p-1.5 rounded-md shadow-lg shadow-indigo-500/20">
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
                                className="px-4 h-9 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-semibold transition-all flex items-center gap-2 shadow-sm cursor-pointer"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"/>
                                </svg>
                                {isSavedSite ? 'Atualizar site' : 'Salvar site'}
                            </button>
                        </div>
                    )}

                    <div className="flex items-center gap-2 ml-4">
                        <span className="text-[10px] text-white/30 font-semibold uppercase tracking-widest">Perfil</span>
                        <div className="flex items-center">
                            <select 
                                value={currentProfile}
                                onChange={handleProfileChange}
                                className={`bg-slate-800 border border-white/10 text-white text-xs h-9 outline-none focus:ring-1 focus:ring-indigo-500 transition-all hover:bg-slate-700 cursor-pointer font-semibold ${currentProfile === 'Padrão' ? 'rounded-md pl-4 pr-10' : 'rounded-l-md px-3 border-r-0'}`}
                            >
                                {profiles.map(p => (
                                    <option key={p} value={p}>{p}</option>
                                ))}
                                <option value="__add_profile__" className="text-indigo-400 font-medium">+ Novo Perfil</option>
                            </select>
                            {currentProfile !== 'Padrão' && (
                                <button 
                                    onClick={handleDeleteCurrentProfile}
                                    className="px-3 h-9 bg-slate-800 hover:bg-rose-900/50 text-rose-400 border border-white/10 rounded-r-md transition-all cursor-pointer border-l-0"
                                    title="Excluir perfil"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => {
                            addSiteToBlacklist(window.location.origin);
                            showToast('Site bloqueado!', 'success');
                        }}
                        className="text-[10px] text-white/30 hover:text-rose-400 font-semibold uppercase tracking-widest transition-colors cursor-pointer"
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

            {/* Side Toasts */}
            <div className="fixed bottom-4 right-4 flex flex-col gap-2 z-999999">
                {toasts.map(toast => (
                    <div 
                        key={toast.id}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl animate-in slide-in-from-right-5 duration-300 border border-white/10 ${
                            toast.type === 'success' ? 'bg-emerald-600 text-white shadow-emerald-900/40' : 'bg-rose-600 text-white shadow-rose-900/40'
                        }`}
                    >
                        <div className="shrink-0">
                            {toast.type === 'success' ? (
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                </svg>
                            ) : (
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            )}
                        </div>
                        <span className="text-sm font-semibold tracking-tight">{toast.message}</span>
                    </div>
                ))}
            </div>

            <ProfileModal 
                isOpen={isProfileModalOpen}
                onClose={() => setIsProfileModalOpen(false)}
                onSave={(name) => {
                    addProfile(name);
                    setCurrentProfile(name);
                }}
                existingProfiles={profiles}
                isPopover={true}
            />

            <Modal 
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                title={confirmModal.title}
                message={confirmModal.message}
                type="confirm"
                onConfirm={confirmModal.onConfirm}
                isPopover={true}
            />
        </>
    );
};
