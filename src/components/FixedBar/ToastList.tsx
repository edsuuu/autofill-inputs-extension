import React from 'react';

interface Toast {
    id: string;
    message: string;
    type: 'success' | 'error';
}

interface ToastListProps {
    toasts: Toast[];
}

export const ToastList: React.FC<ToastListProps> = ({ toasts }) => {
    return (
        <div className="fixed bottom-4 right-4 flex flex-col gap-2 z-999999 pointer-events-none">
            {toasts.map(toast => (
                <div
                    key={toast.id}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl animate-in slide-in-from-right-5 duration-300 border border-white/10 pointer-events-auto ${
                        toast.type === 'success' ? 'bg-emerald-600 text-white shadow-emerald-900/40' : 'bg-rose-600 text-white shadow-rose-900/40'
                    }`}
                >
                    <div className="shrink-0">
                        {toast.type === 'success' ? (
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                        ) : (
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        )}
                    </div>
                    <span className="text-sm font-semibold tracking-tight">{toast.message}</span>
                </div>
            ))}
        </div>
    );
};
