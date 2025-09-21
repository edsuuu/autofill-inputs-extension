import { useEffect, useState } from 'react';
import browser from 'webextension-polyfill';

type NotificationType = 'success' | 'error';

interface Notification {
    type: NotificationType;
    message: string;
    show: boolean;
}

export default function Popup() {
    const [toggle, setToggle] = useState<boolean>(false);
    const [floatingButton, setFloatingButton] = useState<boolean>(false);
    const [notification, setNotification] = useState<Notification>({
        type: 'success',
        message: '',
        show: false,
    });

    useEffect(() => {
        (async () => {
            const data = await browser.storage.local.get(['enabled', 'floatingButton']);
            setToggle(data.enabled !== false);
            setFloatingButton(data.floatingButton || false);
        })();
    }, []);

    const openOptions = () => {
        browser.runtime.openOptionsPage();
    };

    const showNotification = (type: NotificationType, message: string) => {
        setNotification({ type, message, show: true });
        setTimeout(() => {
            setNotification(prev => ({ ...prev, show: false }));
        }, 3000);
    };

    const getInputs = async () => {
        const [tab] = await browser.tabs.query({
            active: true,
            currentWindow: true,
        });

        const [{ result }] = await browser.scripting.executeScript({
            target: { tabId: Number(tab.id) },

            func: () => {
                const inputs = Array.from(document.querySelectorAll("input, textarea, select")) as HTMLInputElement[];

                return Array.from(inputs)
                    .filter((input) => {
                        if ((!input.name && !input.id) || input.id === '') return false;
                        if (['hidden', 'submit', 'button', 'reset', 'file'].includes(input.type)) return false;
                        if (input.name.startsWith('_')) return false;
                        if (['token', 'method', 'uri', 'ip'].some((k) => input.name.toLowerCase().includes(k))) return false;
                        return true;
                    })
                    .map((field) => {
                        let value: string | boolean;

                        if (field.type === 'checkbox' || field.type === 'radio') {
                            value = field.checked;
                        } else {
                            value = field.value;
                        }

                        return {
                            name: field.name,
                            id: field.id,
                            value: value,
                            type: field.type,
                        };
                    });
            },
        });

        browser.storage.local
            .set({ [String(tab.url)]: result })
            .then(() => {
                showNotification('success', 'Formulário salvo com sucesso!');
            })
            .catch(() => {
                showNotification('error', 'Erro ao salvar os campos!');
            });
    };

    const autoFill = async (active: boolean) => {
        setToggle(active);
        await browser.storage.local.set({ enabled: active });
    };

    const toggleFloatingButton = async (active: boolean) => {
        setFloatingButton(active);
        await browser.storage.local.set({ floatingButton: active });

        if (active) {
            showNotification('success', 'Botão flutuante ativado!');
        } else {
            showNotification('success', 'Botão flutuante desativado!');
        }
    };

    return (
        <div className="w-[400px] p-4">
            <div className="flex flex-row items-center gap-4">
                <img src="/favicon-32x32.png" />
                <h1 className="text-blue-500 font-bold text-lg">Auto Preenchimento</h1>
            </div>

            <div className="flex flex-col gap-4 p-4 mt-2">
                <label className="flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={toggle} onChange={(e) => autoFill(e.target.checked)} />
                    <div className="w-11 h-6 bg-gray-300 rounded-full peer-checked:bg-blue-500 relative after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:w-5 after:h-5 after:bg-white after:rounded-full after:transition-transform peer-checked:after:translate-x-5"></div>
                    <span className="ml-3 text-sm font-medium text-gray-700">{toggle ? 'Desativar' : 'Ativar'} preenchimento automático</span>
                </label>

                <label className="flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={floatingButton} onChange={(e) => toggleFloatingButton(e.target.checked)} />
                    <div className="w-11 h-6 bg-gray-300 rounded-full peer-checked:bg-blue-500 relative after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:w-5 after:h-5 after:bg-white after:rounded-full after:transition-transform peer-checked:after:translate-x-5"></div>
                    <span className="ml-3 text-sm font-medium text-gray-700">{floatingButton ? 'Desativar' : 'Ativar'} botão flutuante</span>
                </label>
            </div>

            {notification.show && (
                <div className={`px-4 py-3 rounded-lg transition-all duration-300 ${
                    notification.type === 'success'
                        ? 'bg-green-100 border border-green-300 text-green-800'
                        : 'bg-red-100 border border-red-300 text-red-800'
                }`}>
                    <div className="flex items-center gap-2">
                        {notification.type === 'success' ? (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        )}
                        <span className="font-medium">{notification.message}</span>
                    </div>
                </div>
            )}

            <div className="flex flex-row gap-4">
                <button onClick={getInputs} className="flex-1 mt-5 p-2 rounded-md bg-blue-400 text-white cursor-pointer">
                    Salvar
                </button>
            </div>

            <div className="flex flex-row gap-4">
                <button onClick={openOptions} className="flex-1 mt-5 p-2 rounded-md bg-blue-400 text-white cursor-pointer">
                    Abrir formulários salvos
                </button>

                <button
                    onClick={() => {
                        browser.runtime.openOptionsPage();
                        setTimeout(() => {
                            window.location.href = browser.runtime.getURL('src/options.html#/como-usar');
                        }, 100);
                        window.close();
                    }}
                    className="flex-1 mt-5 p-2 rounded-md bg-blue-400 text-white cursor-pointer"
                >
                    Como usar ?
                </button>
            </div>

        </div>
    );
}
