import '../global.css';
import browser from "webextension-polyfill";

export default function () {
    function teste() {
        alert(1);
    }
    return (
        <div>
            <div className="w-[400px] h-[300px] flex flex-col justify-center items-center p-4 border borde-black">
                <h1 className="text-red-500 font-bold mt-2">Options</h1>
                <button onClick={teste} className="w-full mt-5 p-2 rounded-md bg-blue-400 text-white cursor-pointer">
                    Abrir opções
                </button>
            </div>

            <img src="/icon-with-shadow.svg" />
        </div>
    );
}
