import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { useToast, ToastItem } from '../../context/ToastContext';
import { useReducedMotion } from '../../hooks/useReducedMotion';

export const ToastContainer: React.FC = () => {
  const { toasts, dismissToast } = useToast();
  const prefersReduced = useReducedMotion();

  return (
    <div
      aria-live="polite"
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none max-w-sm w-full px-4 sm:px-0"
    >
      <AnimatePresence>
        {toasts.map((toast: ToastItem) => (
          <motion.div
            key={toast.id}
            initial={
              prefersReduced
                ? { opacity: 0 }
                : { opacity: 0, y: 12, scale: 0.95 }
            }
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={
              prefersReduced
                ? { opacity: 0 }
                : { opacity: 0, scale: 0.95, transition: { duration: 0.12 } }
            }
            transition={
              prefersReduced
                ? { duration: 0 }
                : { duration: 0.18, ease: 'easeOut' }
            }
            className="pointer-events-auto flex items-center justify-between gap-3 p-3 rounded-lg bg-[#181818] border border-[#2B2B2B] text-[#F5F5F5] shadow-xl text-sm"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              {toast.type === 'success' && (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              )}
              {toast.type === 'error' && (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              )}
              {(toast.type === 'info' || toast.type === 'action') && (
                <Info className="w-4 h-4 text-neutral-400 shrink-0" />
              )}
              <span className="truncate text-xs text-[#E5E5E5]">{toast.message}</span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {toast.action && (
                <button
                  type="button"
                  onClick={() => {
                    toast.action?.onClick();
                    dismissToast(toast.id);
                  }}
                  className="px-2 py-0.5 text-xs font-semibold text-rose-300 hover:text-rose-200 bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 rounded transition-colors"
                >
                  {toast.action.label}
                </button>
              )}
              <button
                type="button"
                onClick={() => dismissToast(toast.id)}
                className="text-[#5F5F5F] hover:text-[#F5F5F5] p-0.5 rounded transition-colors"
                aria-label="Dismiss toast"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
