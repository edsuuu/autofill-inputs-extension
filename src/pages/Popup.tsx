import { useEffect, useState } from 'react';
import '../global.css';
import browser from 'webextension-polyfill';

export default function () {
    const [toggle, setToggle] = useState<boolean>(false);

    useEffect(() => {
        (async () => {
            const enabled = await browser.storage.local.get('enabled');
            setToggle(enabled.enabled !== false);
        })();
    }, []);

    const openOptions = () => {
        browser.runtime.openOptionsPage();
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
                    .map((field) => ({
                        name: field.name,
                        id: field.id,
                        value: field.value,
                    }));
            },
        });

        browser.storage.local
            .set({ [String(tab.url)]: result })
            .then(() => {
                alert('Campos salvos com sucesso!');
                window.location.reload();
            })
            .catch((err) => console.error('Erro ao salvar:', err));
    };

    const autoFill = async (active: boolean) => {
        setToggle(active);
        await browser.storage.local.set({ enabled: active });
    };
    return (
        <div className="w-[400px] p-4">
            <div className="flex flex-row items-center gap-4">
                <img src="/favicon-32x32.png" />
                <h1 className="text-blue-500 font-bold text-lg">Auto Preenchimento</h1>
            </div>

            <div className="flex flex-col gap-4 p-4">
                <label className="flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={toggle} onChange={(e) => autoFill(e.target.checked)} />
                    <div className="w-11 h-6 bg-gray-300 rounded-full peer-checked:bg-blue-500 relative after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:w-5 after:h-5 after:bg-white after:rounded-full after:transition-transform peer-checked:after:translate-x-5"></div>
                    <span className="ml-3 text-sm font-medium text-gray-700">{toggle ? 'Desativar' : 'Ativar'} preenchimento automático</span>
                </label>

                <label className="flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-300 rounded-full peer-checked:bg-blue-500 relative after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:w-5 after:h-5 after:bg-white after:rounded-full after:transition-transform peer-checked:after:translate-x-5"></div>
                    <span className="ml-3 text-sm font-medium text-gray-700">Ativar button de preenchimento</span>
                </label>

                <label className="flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-300 rounded-full peer-checked:bg-blue-500 relative after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:w-5 after:h-5 after:bg-white after:rounded-full after:transition-transform peer-checked:after:translate-x-5"></div>
                    <span className="ml-3 text-sm font-medium text-gray-700">Mostrar sugestões</span>
                </label>

                <label className="flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-300 rounded-full peer-checked:bg-blue-500 relative after:content-[''] after:top-0.5 after:left-0.5 after:w-5 after:h-5 after:bg-white after:rounded-full after:transition-transform peer-checked:after:translate-x-5"></div>
                    <span className="ml-3 text-sm font-medium text-gray-700">Salvar dados automaticamente</span>
                </label>
            </div>

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
                        alert(1);
                    }}
                    className="flex-1 mt-5 p-2 rounded-md bg-blue-400 text-white cursor-pointer"
                >
                    Como usar ?
                </button>
            </div>
        </div>
    );
}
