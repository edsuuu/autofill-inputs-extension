import React, { useEffect, useState } from 'react';
import { useAutofill } from '../context/AutofillContext';
import { AutofillService } from '../services/AutofillService';
import { useFixedShift } from '../hooks/useFixedShift';
import { useFloatingDrag } from '../hooks/useFloatingDrag';
import { useSiteDetection } from '../hooks/useSiteDetection';
import { FloatingMenu } from './FixedBar/FloatingMenu';
import { MainBar } from './FixedBar/MainBar';
import { ToastList } from './FixedBar/ToastList';
import Modal from './Modal';
import ProfileModal from './ProfileModal';

export const FixedBar: React.FC = () => {
    const {
        isEnabled, barBehavior, isBarOpen, setBarOpen,
        currentProfile, setCurrentProfile, addSiteToBlacklist,
        blacklistedSites, profiles, addProfile, deleteProfile,
        deleteSiteData, toasts, showToast, isLoading,
        isFloatingEnabled, setIsFloatingEnabled
    } = useAutofill();

    const { isNewSite, isSavedSite, setIsSavedSite, setIsNewSite } = useSiteDetection(isLoading, currentProfile);
    const { floatingPos, handleMouseDown, isDragging, toggleOpenWithShift } = useFloatingDrag(isBarOpen);
    
    const currentOrigin = window.location.origin;
    const isBlacklisted = blacklistedSites.includes(currentOrigin);
    const shouldShowOffset = isEnabled && !isBlacklisted && isBarOpen && (barBehavior === 'all' || isSavedSite);
    
    const { topOffset } = useFixedShift(shouldShowOffset);

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean; title: string; message: string; onConfirm?: () => void;
    }>({ isOpen: false, title: '', message: '' });

    useEffect(() => {
        const handleToastEvent = (e: Event) => {
            const customEvent = e as CustomEvent;
            showToast(customEvent.detail.message, customEvent.detail.type);
        };
        window.addEventListener('autofill-toast', handleToastEvent);
        return () => window.removeEventListener('autofill-toast', handleToastEvent);
    }, []);

    if (isLoading || !isEnabled || isBlacklisted) return null;
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

    const handleSmartFill = async () => {
        const result = await AutofillService.smartFillAndSave(window.location.href, currentProfile);
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

    const menuActions = [
        { icon: <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>, label: 'Expandir', action: () => setBarOpen(true) },
        { icon: <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"/></svg>, label: isSavedSite ? 'Atualizar' : 'Salvar', action: handleSave },
        { icon: <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>, label: 'Preencher', action: handleFill },
    ];

    if (!isSavedSite || isNewSite) {
        menuActions.push({
            icon: <div className="bg-indigo-600 p-1.5 rounded-full shadow-lg shadow-indigo-950/20 group-hover:scale-110 transition-transform"><svg className="h-4 w-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg></div>,
            label: 'Smart Fill', action: handleSmartFill
        });
    }

    menuActions.push(
        { icon: <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>, label: 'Bloquear', action: () => addSiteToBlacklist(window.location.origin) },
        { icon: <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>, label: 'Desativar', action: async () => { await setIsFloatingEnabled(false); showToast('Botão flutuante desativado', 'error'); } }
    );

    return (
        <>
            {!isBarOpen ? (
                isFloatingEnabled && (
                    <FloatingMenu
                        isMenuOpen={isMenuOpen}
                        setIsMenuOpen={setIsMenuOpen}
                        floatingPos={floatingPos}
                        handleMouseDown={handleMouseDown}
                        menuActions={menuActions}
                        onToggle={() => {
                            if (isDragging.current) return;
                            const next = !isMenuOpen;
                            setIsMenuOpen(next);
                            toggleOpenWithShift(next);
                        }}
                    />
                )
            ) : (
                <MainBar
                    topOffset={topOffset}
                    setBarOpen={setBarOpen}
                    isSavedSite={isSavedSite}
                    isNewSite={isNewSite}
                    handleFill={handleFill}
                    handleDeleteSaved={handleDeleteSaved}
                    handleSave={handleSave}
                    currentProfile={currentProfile}
                    handleProfileChange={handleProfileChange}
                    profiles={profiles}
                    handleDeleteCurrentProfile={handleDeleteCurrentProfile}
                    handleSmartFill={handleSmartFill}
                    addSiteToBlacklist={addSiteToBlacklist}
                    showToast={showToast}
                />
            )}

            <ToastList toasts={toasts} />

            <ProfileModal
                isOpen={isProfileModalOpen}
                onClose={() => setIsProfileModalOpen(false)}
                onSave={(name) => { addProfile(name); setCurrentProfile(name); }}
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
