import React, { createContext, useContext, useEffect, useState } from 'react';
import browser from 'webextension-polyfill';
import { AutofillSaver } from '../services/AutofillSaver';

interface AutofillState {
    isEnabled: boolean;
    barBehavior: 'all' | 'per-site';
    isBarOpen: boolean;
    isFloatingEnabled: boolean;
    currentProfile: string;
    profiles: string[];
    blacklistedSites: string[];
    toasts: Array<{ id: string, message: string, type: 'success' | 'error' }>;
    isLoading: boolean;
}

interface AutofillContextType extends AutofillState {
    setBarBehavior: (behavior: 'all' | 'per-site') => void;
    setBarOpen: (isOpen: boolean) => void;
    setIsFloatingEnabled: (enabled: boolean) => void;
    setCurrentProfile: (profile: string) => void;
    addSiteToBlacklist: (site: string) => Promise<void>;
    removeSiteFromBlacklist: (site: string) => Promise<void>;
    showToast: (message: string, type: 'success' | 'error') => void;
    addProfile: (name: string) => Promise<void>;
    deleteProfile: (name: string) => Promise<void>;
    deleteSiteData: (url: string, profile: string) => Promise<void>;
}

const AutofillContext = createContext<AutofillContextType | undefined>(undefined);

export const AutofillProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, setState] = useState<AutofillState>({
        isEnabled: true,
        barBehavior: 'all',
        isBarOpen: false,
        isFloatingEnabled: true,
        currentProfile: 'Padrão',
        profiles: ['Padrão', 'Trabalho', 'Pessoal'],
        blacklistedSites: [],
        toasts: [],
        isLoading: true
    });

    useEffect(() => {
        const loadSettings = async () => {
            let settings = await AutofillSaver.getSettings();
            let profiles = await AutofillSaver.getProfiles();
            let needsSave = false;
            
            if (profiles.includes('Default')) {
                profiles = profiles.map(p => p === 'Default' ? 'Padrão' : p);
                await AutofillSaver.saveProfiles(profiles);
                needsSave = true;
            }
            if (settings.currentProfile === 'Default') {
                settings.currentProfile = 'Padrão';
                needsSave = true;
            }
            if (needsSave) {
                await AutofillSaver.saveSettings(settings);
            }

            setState(prev => ({
                ...prev,
                isEnabled: settings.enabled !== false,
                barBehavior: settings.barBehavior || 'all',
                isBarOpen: settings.isBarOpen || false,
                isFloatingEnabled: settings.isFloatingEnabled !== false,
                currentProfile: settings.currentProfile || 'Padrão',
                profiles: profiles,
                blacklistedSites: settings.blacklistedSites || [],
                isLoading: false
            }));
        };
        
        loadSettings();

        const handleStorageChange = (changes: any, namespace: string) => {
            if (namespace === 'local') {
                setState(prev => ({
                    ...prev,
                    isEnabled: changes.enabled && changes.enabled.newValue !== undefined ? changes.enabled.newValue : prev.isEnabled,
                    barBehavior: changes.barBehavior && changes.barBehavior.newValue !== undefined ? changes.barBehavior.newValue : prev.barBehavior,
                    isBarOpen: changes.isBarOpen && changes.isBarOpen.newValue !== undefined ? changes.isBarOpen.newValue : prev.isBarOpen,
                    isFloatingEnabled: changes.isFloatingEnabled && changes.isFloatingEnabled.newValue !== undefined ? changes.isFloatingEnabled.newValue : prev.isFloatingEnabled,
                    currentProfile: changes.currentProfile && changes.currentProfile.newValue !== undefined ? changes.currentProfile.newValue : prev.currentProfile,
                    profiles: (changes.__profiles__ && changes.__profiles__.newValue !== undefined) ? changes.__profiles__.newValue : prev.profiles,
                    blacklistedSites: changes.blacklistedSites && changes.blacklistedSites.newValue !== undefined ? changes.blacklistedSites.newValue : prev.blacklistedSites
                }));
            }
        };

        browser.storage.onChanged.addListener(handleStorageChange);
        return () => browser.storage.onChanged.removeListener(handleStorageChange);
    }, []);

    const setBarBehavior = async (behavior: 'all' | 'per-site') => {
        await AutofillSaver.saveSettings({ barBehavior: behavior });
        setState(prev => ({ ...prev, barBehavior: behavior }));
    };

    const setBarOpen = async (isOpen: boolean) => {
        await AutofillSaver.saveSettings({ isBarOpen: isOpen });
        setState(prev => ({ ...prev, isBarOpen: isOpen }));
    };

    const setIsFloatingEnabled = async (enabled: boolean) => {
        await AutofillSaver.saveSettings({ isFloatingEnabled: enabled });
        setState(prev => ({ ...prev, isFloatingEnabled: enabled }));
    };

    const setCurrentProfile = async (profile: string) => {
        await AutofillSaver.saveSettings({ currentProfile: profile });
        setState(prev => ({ ...prev, currentProfile: profile }));
    };

    const addSiteToBlacklist = async (site: string) => {
        if (state.blacklistedSites.includes(site)) return;
        const newBlacklist = [...state.blacklistedSites, site];
        await AutofillSaver.saveSettings({ blacklistedSites: newBlacklist });
        setState(prev => ({ ...prev, blacklistedSites: newBlacklist }));
        showToast('Site adicionado à blacklist!', 'success');
    };

    const removeSiteFromBlacklist = async (site: string) => {
        const newBlacklist = state.blacklistedSites.filter(s => s !== site);
        await AutofillSaver.saveSettings({ blacklistedSites: newBlacklist });
        setState(prev => ({ ...prev, blacklistedSites: newBlacklist }));
        showToast('Site removido da blacklist!', 'success');
    };

    const showToast = (message: string, type: 'success' | 'error') => {
        const id = Math.random().toString(36).substring(7);
        setState(prev => ({ ...prev, toasts: [...prev.toasts, { id, message, type }] }));
        setTimeout(() => {
            setState(prev => ({ ...prev, toasts: prev.toasts.filter(t => t.id !== id) }));
        }, 3500);
    };

    const addProfile = async (name: string) => {
        const profiles = [...state.profiles];
        if (!profiles.includes(name)) {
            profiles.push(name);
            await AutofillSaver.saveProfiles(profiles);
            setState(prev => ({ ...prev, profiles }));
            showToast(`Perfil "${name}" criado!`, 'success');
        } else {
            showToast(`O perfil "${name}" já existe.`, 'error');
        }
    };

    const deleteProfile = async (name: string) => {
        if (name === 'Padrão') {
            showToast('O perfil Padrão não pode ser removido.', 'error');
            return;
        }
        const profiles = state.profiles.filter(p => p !== name);
        await AutofillSaver.saveProfiles(profiles);
        
        if (state.currentProfile === name) {
            await setCurrentProfile('Padrão');
        }

        setState(prev => ({ ...prev, profiles }));
        showToast(`Perfil "${name}" removido.`, 'success');
    };

    const deleteSiteData = async (url: string, profile: string) => {
        await AutofillSaver.deleteSiteData(url, profile);
        showToast(`Dados removidos de ${profile}`, 'success');
    };

    return (
        <AutofillContext.Provider value={{
            ...state,
            setBarBehavior,
            setBarOpen,
            setIsFloatingEnabled,
            setCurrentProfile,
            addSiteToBlacklist,
            removeSiteFromBlacklist,
            showToast,
            addProfile,
            deleteProfile,
            deleteSiteData
        }}>
            {children}
        </AutofillContext.Provider>
    );
};

export const useAutofill = () => {
    const context = useContext(AutofillContext);
    if (!context) throw new Error('useAutofill must be used within AutofillProvider');
    return context;
};
