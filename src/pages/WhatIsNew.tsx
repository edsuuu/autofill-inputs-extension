import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import browser from 'webextension-polyfill';

export default function WhatIsNew() {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);

    const steps = [
        {
            version: browser.runtime.getManifest().version,
            date: "8 de Maio, 2026",
            title: "AutoFill v1.2.4",
            description: "Mais controle, mais precisão e uma interface ainda mais polida para o seu dia a dia.",
            icon: (
                <div className="w-20 h-20 bg-indigo-600 rounded-3xl shadow-xl shadow-indigo-100 flex items-center justify-center text-white">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                </div>
            )
        },
        {
            title: "Gestão Total de Perfis",
            description: "Agora você pode renomear seus perfis a qualquer momento. Toda a transição de dados é feita automaticamente para você.",
            icon: (
                <div className="w-20 h-20 bg-amber-100 rounded-3xl flex items-center justify-center text-amber-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                </div>
            )
        },
        {
            title: "Clonagem de Configurações",
            description: "Copie facilmente as configurações de um site para outro. Ideal para ambientes de teste ou sites com múltiplos domínios.",
            icon: (
                <div className="w-20 h-20 bg-emerald-100 rounded-3xl flex items-center justify-center text-emerald-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                    </svg>
                </div>
            )
        },
        {
            title: "Inteligência & UX",
            description: "Preenchimento ignora campos desativados (disabled). Nova interface com modais elegantes substituindo alertas do sistema.",
            icon: (
                <div className="w-20 h-20 bg-indigo-100 rounded-3xl flex items-center justify-center text-indigo-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                </div>
            )
        }
    ];

    const currentStep = steps[step - 1];

    return (
        <div className="min-h-[80vh] flex items-center justify-center p-6 bg-slate-50">
            <div className="max-w-md w-full bg-white rounded-[40px] shadow-2xl shadow-slate-200 p-12 text-center space-y-8 animate-in fade-in zoom-in duration-500">
                <div className="flex justify-between items-center mb-4">
                     <span className="bg-indigo-100 text-indigo-700 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                        Versão {steps[0].version}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400">{steps[0].date}</span>
                </div>

                <div className="flex justify-center h-24 items-center">
                    {currentStep.icon}
                </div>

                <div className="space-y-3">
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">{currentStep.title}</h2>
                    <p className="text-slate-500 font-medium leading-relaxed">{currentStep.description}</p>
                </div>

                <div className="flex items-center justify-center gap-2">
                    {steps.map((_, i) => (
                        <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i + 1 === step ? 'w-8 bg-indigo-600' : 'w-1.5 bg-slate-200'}`} />
                    ))}
                </div>

                <div className="flex gap-4">
                    {step > 1 && (
                        <button
                            onClick={() => setStep(step - 1)}
                            className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold rounded-2xl transition-all active:scale-95"
                        >
                            Voltar
                        </button>
                    )}
                    <button
                        onClick={() => step < steps.length ? setStep(step + 1) : navigate('/')}
                        className="flex-2 py-4 bg-indigo-600 hover:bg-slate-900 text-white font-bold rounded-2xl shadow-lg shadow-indigo-100 transition-all active:scale-95 flex items-center justify-center gap-2 group cursor-pointer"
                    >
                        {step === steps.length ? 'Entendi, vamos lá!' : 'Próximo'}
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 group-hover:translate-x-1 transition-transform" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
}
