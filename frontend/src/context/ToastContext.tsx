import React, { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import { X, CheckCircle, AlertTriangle, Info, AlertCircle } from 'lucide-react';
import { createPortal } from 'react-dom';
import clsx from 'clsx';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
    id: string;
    title: string;
    message?: string;
    type: ToastType;
}

interface ToastContextValue {
    addToast: (toast: Omit<Toast, 'id'>) => void;
    removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts((prev) => [...prev, { ...toast, id }]);

        // Auto remove after 5 seconds
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 5000);
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ addToast, removeToast }}>
            {children}
            {createPortal(
                <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className={clsx(
                            "pointer-events-auto flex w-80 rounded-lg shadow-lg border p-4 transition-all animate-in slide-in-from-right duration-300",
                            toast.type === 'success' && "bg-white dark:bg-zinc-800 border-green-200 dark:border-green-900/50 text-gray-800 dark:text-gray-100",
                            toast.type === 'error' && "bg-white dark:bg-zinc-800 border-red-200 dark:border-red-900/50 text-gray-800 dark:text-gray-100",
                            toast.type === 'warning' && "bg-white dark:bg-zinc-800 border-amber-200 dark:border-amber-900/50 text-gray-800 dark:text-gray-100",
                            toast.type === 'info' && "bg-white dark:bg-zinc-800 border-blue-200 dark:border-blue-900/50 text-gray-800 dark:text-gray-100",
                        )}
                    >
                        <div className="flex-shrink-0 mr-3">
                            {toast.type === 'success' && <CheckCircle className="w-5 h-5 text-green-500" />}
                            {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-red-500" />}
                            {toast.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-500" />}
                            {toast.type === 'info' && <Info className="w-5 h-5 text-blue-500" />}
                        </div>
                        <div className="flex-1">
                            <h4 className="text-sm font-semibold">{toast.title}</h4>
                            {toast.message && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{toast.message}</p>}
                        </div>
                        <button onClick={() => removeToast(toast.id)} className="flex-shrink-0 ml-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                            <X size={16} />
                        </button>
                    </div>
                ))}
                </div>,
                document.body
            )}
        </ToastContext.Provider>
    );
};
