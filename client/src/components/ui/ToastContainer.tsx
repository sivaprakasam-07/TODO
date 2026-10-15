import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { useToast, ToastItem } from '../../context/ToastContext';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { ToastCard } from './ToastCard';

export const ToastContainer: React.FC = () => {
  const { toasts, dismissToast } = useToast();
  const prefersReduced = useReducedMotion();

  return (
    <aside
      role="region"
      aria-label="Notifications"
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 z-50 flex flex-col gap-2 pointer-events-none w-[calc(100vw-32px)] sm:w-[310px] max-w-[320px] mx-auto sm:mx-0 pb-[env(safe-area-inset-bottom,0px)]"
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((toast: ToastItem) => (
          <ToastCard
            key={toast.id}
            toast={toast}
            onDismiss={dismissToast}
            prefersReduced={prefersReduced}
          />
        ))}
      </AnimatePresence>
    </aside>
  );
};
