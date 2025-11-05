import { useEffect } from 'react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    message: string;
    type?: 'info' | 'success' | 'warning' | 'error' | 'confirm';
    onConfirm?: () => void;
    confirmText?: string;
    cancelText?: string;
}

export default function Modal({
    isOpen,
    onClose,
    title,
    message,
    type = 'info',
    onConfirm,
    confirmText = 'Confirmar',
    cancelText = 'Cancelar'
}: ModalProps) {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget && type !== 'confirm') {
            onClose();
        }
    };

    const getIcon = () => {
        switch (type) {
        case 'success':
            return (
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            );
        case 'error':
            return (
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            );
        case 'warning':
            return (
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
            );
        default:
            return (
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            );
        }
    };

    const getColorClasses = () => {
        switch (type) {
        case 'success':
            return 'bg-green-50 border-green-200';
        case 'error':
            return 'bg-red-50 border-red-200';
        case 'warning':
            return 'bg-yellow-50 border-yellow-200';
        default:
            return 'bg-blue-50 border-blue-200';
        }
    };

    const getButtonClasses = () => {
        switch (type) {
        case 'success':
            return 'bg-green-600 hover:bg-green-700';
        case 'error':
            return 'bg-red-600 hover:bg-red-700';
        case 'warning':
            return 'bg-yellow-600 hover:bg-yellow-700';
        default:
            return 'bg-blue-600 hover:bg-blue-700';
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 bg-opacity-50 p-4"
            onClick={handleBackdropClick}
        >
            <div className={`bg-white rounded-lg shadow-xl max-w-md w-full ${getColorClasses()} border-2`}>
                <div className="p-6">
                    <div className="flex items-start gap-4">
                        <div className="flex-shrink-0">
                            {getIcon()}
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">{message}</p>
                        </div>
                        {type !== 'confirm' && (
                            <button
                                onClick={onClose}
                                className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        )}
                    </div>
                    <div className="mt-6 flex justify-end gap-3">
                        {type === 'confirm' && (
                            <>
                                <button
                                    onClick={onClose}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors cursor-pointer"
                                >
                                    {cancelText}
                                </button>
                                <button
                                    onClick={() => {
                                        if (onConfirm) onConfirm();
                                        onClose();
                                    }}
                                    className={`px-4 py-2 text-sm font-medium text-white rounded-md transition-colors cursor-pointer ${getButtonClasses()}`}
                                >
                                    {confirmText}
                                </button>
                            </>
                        )}
                        {type !== 'confirm' && (
                            <button
                                onClick={onClose}
                                className={`px-4 py-2 text-sm font-medium text-white rounded-md transition-colors cursor-pointer ${getButtonClasses()}`}
                            >
                                OK
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
