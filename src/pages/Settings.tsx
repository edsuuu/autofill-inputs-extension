/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-console */
import { useEffect, useState } from 'react';
import browser from 'webextension-polyfill';

export default function Settings() {
    const [settings, setSettings] = useState({
        autoFill: false,
        floatingButton: false,
        floatingButtonPosition: { x: window.innerWidth - 68, y: window.innerHeight - 68 }
    });

    useEffect(() => {
        loadSettings();

        // Listener para mudanças no storage
        const handleStorageChange = (changes: any, namespace: string) => {
            if (namespace === 'local') {
                if (changes.enabled) {
                    setSettings(prev => ({ ...prev, autoFill: changes.enabled.newValue !== false }));
                }
                if (changes.floatingButton) {
                    setSettings(prev => ({ ...prev, floatingButton: changes.floatingButton.newValue || false }));
                }
                if (changes.floatingButtonPosition) {
                    setSettings(prev => ({
                        ...prev,
                        floatingButtonPosition: changes.floatingButtonPosition.newValue || {
                            x: window.innerWidth - 68,
                            y: window.innerHeight - 68
                        }
                    }));
                }
            }
        };

        // Adicionar listener
        browser.storage.onChanged.addListener(handleStorageChange);

        // Cleanup
        return () => {
            browser.storage.onChanged.removeListener(handleStorageChange);
        };
    }, []);

    const loadSettings = async () => {
        try {
            const data = await browser.storage.local.get(['enabled', 'floatingButton', 'floatingButtonPosition']);
            setSettings({
                autoFill: data.enabled !== false,
                floatingButton: data.floatingButton || false,
                floatingButtonPosition: data.floatingButtonPosition || {
                    x: window.innerWidth - 68,
                    y: window.innerHeight - 68
                }
            });
        } catch (error) {
            console.error('Erro ao carregar configurações:', error);
        }
    };

    const updateSetting = async (key: string, value: any) => {
        try {
            await browser.storage.local.set({ [key]: value });
            setSettings(prev => ({ ...prev, [key]: value }));
        } catch (error) {
            console.error('Erro ao salvar configuração:', error);
        }
    };

    const resetSettings = async () => {
        try {
            await browser.storage.local.clear();
            setSettings({
                autoFill: false,
                floatingButton: false,
                floatingButtonPosition: {
                    x: window.innerWidth - 68,
                    y: window.innerHeight - 68
                }
            });
        } catch (error) {
            console.error('Erro ao resetar configurações:', error);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                <div className="bg-white rounded-lg shadow-sm p-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-8">Configurações</h1>

                    <div className="space-y-8">
                        <section>
                            <h2 className="text-xl font-semibold text-gray-800 mb-4">Preenchimento Automático</h2>
                            <div className="bg-gray-50 rounded-lg p-6">
                                <label className="flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={settings.autoFill}
                                        onChange={(e) => updateSetting('enabled', e.target.checked)}
                                    />
                                    <div className="w-11 h-6 bg-gray-300 rounded-full peer-checked:bg-blue-500 relative after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:w-5 after:h-5 after:bg-white after:rounded-full after:transition-transform peer-checked:after:translate-x-5"></div>
                                    <div className="ml-4">
                                        <span className="text-sm font-medium text-gray-700">Ativar preenchimento automático</span>
                                        <p className="text-xs text-gray-500">Preenche automaticamente os campos quando você visita uma página com formulário salvo</p>
                                    </div>
                                </label>
                            </div>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-gray-800 mb-4">Botão Flutuante</h2>
                            <div className="bg-gray-50 rounded-lg p-6">
                                <label className="flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={settings.floatingButton}
                                        onChange={(e) => updateSetting('floatingButton', e.target.checked)}
                                    />
                                    <div className="w-11 h-6 bg-gray-300 rounded-full peer-checked:bg-blue-500 relative after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:w-5 after:h-5 after:bg-white after:rounded-full after:transition-transform peer-checked:after:translate-x-5"></div>
                                    <div className="ml-4">
                                        <span className="text-sm font-medium text-gray-700">Ativar botão flutuante</span>
                                        <p className="text-xs text-gray-500">Mostra uma bolinha arrastável na tela para preenchimento manual</p>
                                    </div>
                                </label>
                            </div>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-gray-800 mb-4">Posição do Botão Flutuante</h2>
                            <div className="bg-gray-50 rounded-lg p-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Posição X (pixels)</label>
                                        <input
                                            type="number"
                                            value={settings.floatingButtonPosition.x}
                                            onChange={(e) => {
                                                const newPosition = { ...settings.floatingButtonPosition, x: parseInt(e.target.value) || 0 };
                                                setSettings(prev => ({ ...prev, floatingButtonPosition: newPosition }));
                                                updateSetting('floatingButtonPosition', newPosition);
                                            }}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Posição Y (pixels)</label>
                                        <input
                                            type="number"
                                            value={settings.floatingButtonPosition.y}
                                            onChange={(e) => {
                                                const newPosition = { ...settings.floatingButtonPosition, y: parseInt(e.target.value) || 0 };
                                                setSettings(prev => ({ ...prev, floatingButtonPosition: newPosition }));
                                                updateSetting('floatingButtonPosition', newPosition);
                                            }}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>
                                <p className="text-xs text-gray-500 mt-2">Ajuste a posição inicial do botão flutuante (você ainda pode arrastá-lo depois)</p>
                            </div>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-gray-800 mb-4">Ações</h2>
                            <div className="bg-red-50 rounded-lg p-6">
                                <h3 className="text-lg font-medium text-red-800 mb-2">Resetar Configurações</h3>
                                <p className="text-sm text-red-600 mb-4">Isso irá remover todas as configurações e formulários salvos. Esta ação não pode ser desfeita.</p>
                                <button
                                    onClick={resetSettings}
                                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors cursor-pointer"
                                >
                                    Resetar Tudo
                                </button>
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
}
