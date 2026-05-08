import { useEffect, useState } from 'react';
import browser from 'webextension-polyfill';
import { AutofillSaver } from '../services/AutofillSaver';
import { Switch } from '../components/Switch';

export default function Settings() {
    const [settings, setSettings] = useState({
        enabled: true,
        barBehavior: 'all' as 'all' | 'per-site',
        blacklistedSites: [] as string[]
    });

    useEffect(() => {
        loadSettings();

        const handleStorageChange = (changes: any, namespace: string) => {
            if (namespace === 'local') {
                if (changes.enabled) setSettings(prev => ({ ...prev, enabled: changes.enabled.newValue !== false }));
                if (changes.barBehavior) setSettings(prev => ({ ...prev, barBehavior: changes.barBehavior.newValue || 'all' }));
                if (changes.blacklistedSites) setSettings(prev => ({ ...prev, blacklistedSites: changes.blacklistedSites.newValue || [] }));
            }
        };

        browser.storage.onChanged.addListener(handleStorageChange);
        return () => browser.storage.onChanged.removeListener(handleStorageChange);
    }, []);

    const loadSettings = async () => {
        try {
            const data = await AutofillSaver.getSettings();
            setSettings({
                enabled: data.enabled !== false,
                barBehavior: data.barBehavior || 'all',
                blacklistedSites: data.blacklistedSites || []
            });
        } catch (error) {
            console.error('Erro ao carregar configurações:', error);
        }
    };

    const updateSetting = async (key: string, value: any) => {
        try {
            await AutofillSaver.saveSettings({ [key]: value });
            setSettings(prev => ({ ...prev, [key]: value }));
        } catch (error) {
            console.error('Erro ao salvar configuração:', error);
        }
    };

    const removeFromBlacklist = async (site: string) => {
        const newBlacklist = settings.blacklistedSites.filter(s => s !== site);
        await updateSetting('blacklistedSites', newBlacklist);
    };

    const resetAll = async () => {
        if (confirm('Deseja realmente apagar TODOS os seus dados salvos? Esta ação é irreversível.')) {
            await browser.storage.local.clear();
            window.location.reload();
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4 md:px-0">
            <div className="max-w-3xl mx-auto space-y-8">
                <div className="flex items-center gap-4 mb-2">
                    <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-200">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        </svg>
                    </div>
                    <div>
                        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Preferências</h1>
                        <p className="text-slate-500 font-medium">Personalize o comportamento da sua extensão</p>
                    </div>
                </div>

                <div className="bg-white rounded-3xl shadow-sm border border-slate-200 divide-y divide-slate-100 overflow-hidden">
                    <div className="p-8">
                        <Switch 
                            checked={settings.enabled}
                            onChange={(val) => updateSetting('enabled', val)}
                            label="Status Geral"
                            sublabel="Habilitar ou desabilitar o preenchimento automático globalmente"
                        />
                    </div>

                    <div className="p-8 space-y-6">
                        <div>
                            <h3 className="text-lg font-bold text-slate-800">Visibilidade da Barra</h3>
                            <p className="text-sm text-slate-500">Como você deseja que a barra superior se comporte</p>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <button 
                                onClick={() => updateSetting('barBehavior', 'all')}
                                className={`p-5 rounded-2xl border-2 transition-all text-left flex flex-col gap-2 ${settings.barBehavior === 'all' ? 'border-indigo-600 bg-indigo-50/50 shadow-md shadow-indigo-100' : 'border-slate-100 hover:border-slate-300'}`}
                            >
                                <span className={`text-sm font-bold ${settings.barBehavior === 'all' ? 'text-indigo-900' : 'text-slate-700'}`}>Exibir em todas as páginas</span>
                                <span className="text-xs text-slate-500">A barra fixa aparecerá em qualquer site que contenha um formulário.</span>
                            </button>

                            <button 
                                onClick={() => updateSetting('barBehavior', 'per-site')}
                                className={`p-5 rounded-2xl border-2 transition-all text-left flex flex-col gap-2 ${settings.barBehavior === 'per-site' ? 'border-indigo-600 bg-indigo-50/50 shadow-md shadow-indigo-100' : 'border-slate-100 hover:border-slate-300'}`}
                            >
                                <span className={`text-sm font-bold ${settings.barBehavior === 'per-site' ? 'text-indigo-900' : 'text-slate-700'}`}>Apenas sites salvos</span>
                                <span className="text-xs text-slate-500">A barra fixa aparecerá apenas se você já salvou dados para esse site específico ou padrão.</span>
                            </button>
                        </div>
                    </div>

                </div>

                <div className="bg-rose-50 rounded-3xl p-8 border border-rose-100 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div>
                        <h3 className="text-lg font-bold text-rose-900">Zona de Perigo</h3>
                        <p className="text-sm text-rose-700/70">Apague todos os formulários e padrões salvos permanentemente.</p>
                    </div>
                    <button 
                        onClick={resetAll}
                        className="px-6 py-3 bg-rose-600 text-white font-bold rounded-2xl hover:bg-rose-700 shadow-lg shadow-rose-200 transition-all active:scale-95"
                    >
                        Resetar Tudo
                    </button>
                </div>
            </div>
        </div>
    );
}
