import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { generateId } from '../lib/utils';

export type ToastType = 'success' | 'info' | 'warning' | 'error' | 'action';

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastItem {
  id: string;
  message: string;
  description?: string;
  type: ToastType;
  action?: ToastAction;
  duration?: number;
  createdAt: number;
  emoji?: string;
}

export interface ShowToastOptions {
  message: string;
  description?: string;
  type?: ToastType;
  action?: ToastAction;
  duration?: number;
  emoji?: string;
}

interface ToastContextType {
  toasts: ToastItem[];
  showToast: (options: ShowToastOptions) => string;
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
      description,
      type = 'success',
      action,
      duration = 4000,
      emoji,
    }: ShowToastOptions) => {
      let toastId = '';

      setToasts((prev) => {
        // Prevent duplicate toast spam if an identical message and type is already active
        const existingIndex = prev.findIndex(
          (t) => t.message === message && t.type === type
        );

        if (existingIndex !== -1) {
          toastId = prev[existingIndex].id;
          const updated = [...prev];
          updated[existingIndex] = {
            ...updated[existingIndex],
            description: description ?? updated[existingIndex].description,
            action: action ?? updated[existingIndex].action,
            emoji: emoji ?? updated[existingIndex].emoji,
            duration,
            createdAt: Date.now(), // Refresh timestamp
          };
          return updated;
        }

        const id = generateId();
        toastId = id;
        const newToast: ToastItem = {
          id,
          message,
          description,
          type,
          action,
          duration,
          createdAt: Date.now(),
          emoji,
        };

        // Keep maximum 5 toasts visible simultaneously
        return [...prev.slice(-4), newToast];
      });

      return toastId;
    },
    []
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
