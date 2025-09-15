import { useEffect } from 'react';
import '../global.css';
import browser from 'webextension-polyfill';

export default function () {
    useEffect(() => {
        console.log('Hello from the popup!');
    }, []);

    const openOptions = () => {
        browser.runtime.openOptionsPage();
    };

    return (
        <div className="w-[400px] p-4">
            <div className="flex flex-row items-center gap-4">
                <img src="/favicon-32x32.png" />
                <h1 className="text-blue-500 font-bold text-lg">Auto Preenchimento</h1>
            </div>

            <div className="flex flex-col gap-4 p-4">
                {/* Toggle 1 */}
                <label className="flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-300 rounded-full peer-checked:bg-blue-500 relative after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:w-5 after:h-5 after:bg-white after:rounded-full after:transition-transform peer-checked:after:translate-x-5"></div>
                    <span className="ml-3 text-sm font-medium text-gray-700">Ativar / desativar preenchimento automático</span>
                </label>

                {/* Toggle 2 */}
                <label className="flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-300 rounded-full peer-checked:bg-blue-500 relative after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:w-5 after:h-5 after:bg-white after:rounded-full after:transition-transform peer-checked:after:translate-x-5"></div>
                    <span className="ml-3 text-sm font-medium text-gray-700">Ativar button de preenchimento</span>
                </label>

                {/* Toggle 2 */}
                <label className="flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-300 rounded-full peer-checked:bg-blue-500 relative after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:w-5 after:h-5 after:bg-white after:rounded-full after:transition-transform peer-checked:after:translate-x-5"></div>
                    <span className="ml-3 text-sm font-medium text-gray-700">Mostrar sugestões</span>
                </label>

                {/* Toggle 3 */}
                <label className="flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-300 rounded-full peer-checked:bg-blue-500 relative after:content-[''] after:top-0.5 after:left-0.5 after:w-5 after:h-5 after:bg-white after:rounded-full after:transition-transform peer-checked:after:translate-x-5"></div>
                    <span className="ml-3 text-sm font-medium text-gray-700">Salvar dados automaticamente</span>
                </label>
            </div>

            <div className="flex flex-row gap-4">
                <button onClick={openOptions} className="flex-1 mt-5 p-2 rounded-md bg-blue-400 text-white cursor-pointer">
                    Abrir formulários salvos
                </button>

                <button onClick={openOptions} className="flex-1 mt-5 p-2 rounded-md bg-blue-400 text-white cursor-pointer">
                    Como usar ?
                </button>
            </div>
        </div>
    );
}
