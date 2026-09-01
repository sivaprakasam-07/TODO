import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { generateId } from '../lib/utils';

export type ToastType = 'success' | 'info' | 'error' | 'action';

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
  action?: ToastAction;
  duration?: number;
}

interface ToastContextType {
  toasts: ToastItem[];
  showToast: (options: {
    message: string;
    type?: ToastType;
    action?: ToastAction;
    duration?: number;
  }) => string;
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    ({
      message,
      type = 'success',
      action,
      duration = 4000,
    }: {
      message: string;
      type?: ToastType;
      action?: ToastAction;
      duration?: number;
    }) => {
      const id = generateId();
      const newToast: ToastItem = { id, message, type, action, duration };

      setToasts((prev) => [...prev.slice(-4), newToast]); // keep max 5 toasts

      if (duration > 0) {
        setTimeout(() => {
          dismissToast(id);
        }, duration);
      }

      return id;
    },
    [dismissToast]
  );

  return (
    <ToastContext.Provider value={{ toasts, showToast, dismissToast }}>
      {children}
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
