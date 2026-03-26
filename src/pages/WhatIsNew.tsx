import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function WhatIsNew() {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);

    const steps = [
        {
            version: "2",
            date: "25 de Março, 2026",
            title: "Bem-vindo ao AutoFill Pro V2",
            description: "A barra de ferramentas foi totalmente reinventada. Mais rápida, elegante e poderosa do que nunca.",
            icon: (
                <div className="w-20 h-20 bg-indigo-600 rounded-3xl shadow-xl shadow-indigo-100 flex items-center justify-center text-white">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                </div>
            )
        },
        {
            title: "A Revolução do Top Bar",
            description: "Substituímos o botão flutuante por uma barra fixa elegante no topo da página. Preenchimento instantâneo em um clique.",
            icon: (
                <div className="w-full h-12 bg-slate-900 rounded-xl border border-white/10 flex items-center px-4 gap-3">
                    <div className="w-6 h-6 bg-indigo-600 rounded"></div>
                    <div className="h-2 w-20 bg-slate-700 rounded"></div>
                    <div className="h-6 w-16 bg-indigo-600 rounded-md ml-auto"></div>
                </div>
            )
        },
        {
            title: "Inteligência & Pesquisa",
            description: "Nova lógica de 'Smart Autofill' que detecta campos automaticamente e pesquisa instantânea no seu painel de controle.",
            icon: (
                <div className="w-20 h-20 bg-emerald-100 rounded-3xl flex items-center justify-center text-emerald-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
            )
        },
        {
            title: "Perfis e Correções",
            description: "Gestão de perfis renovada e correções críticas em checkboxes e botões de rádio para 100% de precisão.",
            icon: (
                <div className="w-20 h-20 bg-indigo-100 rounded-3xl flex items-center justify-center text-indigo-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
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
