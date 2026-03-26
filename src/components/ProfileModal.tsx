import React, { useState, useEffect, useRef } from 'react';

interface ProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (name: string) => void;
    existingProfiles: string[];
    isPopover?: boolean;
    anchorRight?: boolean;
}

export default function ProfileModal({ 
    isOpen, 
    onClose, 
    onSave, 
    existingProfiles,
    isPopover = false,
    anchorRight = false
}: ProfileModalProps) {
    const [name, setName] = useState('');
    const [error, setError] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            setName('');
            setError('');
            // Short delay to ensure the modal is rendered for focus
            setTimeout(() => {
                inputRef.current?.focus();
            }, 50);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSave = () => {
        const trimmed = name.trim();
        if (!trimmed) {
            setError('O nome não pode estar vazio');
            return;
        }
        if (existingProfiles.some(p => p.toLowerCase() === trimmed.toLowerCase())) {
            setError('Um perfil com este nome já existe');
            return;
        }
        onSave(trimmed);
        onClose();
    };

    return (
        <div className={`fixed inset-0 z-9999999 flex ${isPopover ? 'items-start pt-16' : 'items-center'} justify-center bg-slate-900/60 backdrop-blur-sm p-6 animate-in fade-in duration-200`} onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className={`bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-6 animate-in zoom-in-95 slide-in-from-top-4 duration-200`}>
                <div className="space-y-2">
                    <h3 className="text-lg font-bold text-slate-900">Novo Perfil</h3>
                    <p className="text-xs text-slate-400 font-medium">Crie um perfil personalizado para organizar seus dados.</p>
                </div>
                
                <div className="space-y-2">
                    <input 
                        ref={inputRef}
                        type="text"
                        placeholder="Nome do perfil (ex: Compras)"
                        value={name}
                        onChange={(e) => {
                            setName(e.target.value);
                            setError('');
                        }}
                        onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                        className={`w-full px-4 py-3.5 bg-slate-50 border ${error ? 'border-rose-300 ring-1 ring-rose-100' : 'border-slate-100'} rounded-2xl text-sm font-semibold focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-inner`}
                    />
                    {error && <p className="text-[10px] text-rose-500 font-bold ml-1 uppercase tracking-tight">{error}</p>}
                </div>
                
                <div className="flex gap-3 pt-2">
                    <button 
                        onClick={onClose}
                        className="flex-1 py-3 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 hover:text-slate-800 transition-all rounded-xl cursor-pointer"
                    >
                        Cancelar
                    </button>
                    <button 
                        onClick={handleSave}
                        className="flex-1 py-3 bg-indigo-600 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-100 hover:bg-slate-900 transition-all cursor-pointer"
                    >
                        Criar Perfil
                    </button>
                </div>
            </div>
        </div>
    );
}
