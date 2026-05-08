import React from 'react';

interface SwitchProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    label?: string;
    sublabel?: string;
}

export const Switch: React.FC<SwitchProps> = ({ checked, onChange, label, sublabel }) => {
    return (
        <div className="flex items-center justify-between">
            {(label || sublabel) && (
                <div className="space-y-0.5">
                    {label && <span className="text-sm font-bold text-slate-800 block">{label}</span>}
                    {sublabel && (
                        <span className={`text-[10px] font-bold uppercase transition-colors ${checked ? 'text-emerald-500' : 'text-slate-400'}`}>
                            {sublabel}
                        </span>
                    )}
                </div>
            )}
            <button
                onClick={() => onChange(!checked)}
                className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-300 ease-in-out focus:outline-none shadow-sm ${checked ? 'bg-indigo-600' : 'bg-slate-300'}`}
            >
                <span className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-300 ease-in-out ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
        </div>
    );
};
