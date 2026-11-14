"use client";

import React, { createContext, useState, useCallback, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

export const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const getToastStyles = (type: ToastType) => {
    switch (type) {
      case 'success':
        return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500';
      case 'error':
        return 'bg-red-500/10 border-red-500/20 text-red-500';
      case 'warning':
        return 'bg-amber-500/10 border-amber-500/20 text-amber-500';
      case 'info':
      default:
        return 'bg-blue-500/10 border-blue-500/20 text-blue-500';
    }
  };

  const getToastIcon = (type: ToastType) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 size={16} className="shrink-0" />;
      case 'error':
        return <AlertCircle size={16} className="shrink-0" />;
      case 'warning':
        return <AlertTriangle size={16} className="shrink-0" />;
      case 'info':
      default:
        return <Info size={16} className="shrink-0" />;
    }
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      
      <div className="fixed top-5 right-5 z-[9999] space-y-3 pointer-events-none select-none max-w-sm w-full">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, y: -10 }}
              className={`p-3.5 rounded-lg border flex items-center gap-3 shadow-lg bg-card backdrop-blur-md pointer-events-auto text-xs font-bold leading-relaxed ${getToastStyles(
                t.type
              )}`}
            >
              {getToastIcon(t.type)}
              <span className="flex-1 text-left">{t.message}</span>
              <button 
                onClick={() => setToasts(prev => prev.filter(item => item.id !== t.id))}
                className="hover:opacity-75 transition-opacity shrink-0 cursor-pointer p-0.5 text-slate-500 hover:text-foreground"
              >
                ✕
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};
