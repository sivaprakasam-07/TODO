import React, { useEffect, useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { ToastItem } from '../../context/ToastContext';

interface ToastCardProps {
  toast: ToastItem;
  onDismiss: (id: string) => void;
  prefersReduced: boolean;
}

export const ToastCard: React.FC<ToastCardProps> = ({
  toast,
  onDismiss,
  prefersReduced,
}) => {
  const duration = toast.duration ?? 4000;
  const isInfinite = duration <= 0;

  const [progress, setProgress] = useState<number>(100);
  const [isPaused, setIsPaused] = useState<boolean>(false);

  const isPausedRef = useRef<boolean>(false);
  isPausedRef.current = isPaused;

  const startTimeRef = useRef<number>(Date.now());
  const elapsedRef = useRef<number>(0);
  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;

  const handlePause = useCallback(() => {
    if (isPausedRef.current) return;
    elapsedRef.current += Date.now() - startTimeRef.current;
    setIsPaused(true);
  }, []);

  const handleResume = useCallback(() => {
    if (!isPausedRef.current) return;
    startTimeRef.current = Date.now();
    setIsPaused(false);
  }, []);

  // Luminous progress countdown tracking toast appearance time
  useEffect(() => {
    if (isInfinite) return;

    startTimeRef.current = Date.now();
    elapsedRef.current = 0;

    let animId: number;

    const tick = () => {
      if (!isPausedRef.current) {
        const currentElapsed = elapsedRef.current + (Date.now() - startTimeRef.current);
        const remaining = Math.max(0, duration - currentElapsed);
        const percent = Math.max(0, Math.min(100, (remaining / duration) * 100));

        setProgress(percent);

        if (remaining <= 0) {
          onDismissRef.current(toast.id);
          return;
        }
      }

      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [duration, isInfinite, toast.id]);

  const handleActionClick = () => {
    if (toast.action) {
      toast.action.onClick();
    }
    onDismiss(toast.id);
  };

  // Determine variant styling based on type
  const getVariantStyles = () => {
    switch (toast.type) {
      case 'error':
        return {
          icon: <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" aria-hidden="true" />,
          progressClass: 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.9)]',
          role: 'alert' as const,
          ariaLive: 'assertive' as const,
        };
      case 'warning':
        return {
          icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" aria-hidden="true" />,
          progressClass: 'bg-[#F5A524] shadow-[0_0_8px_rgba(245,165,36,0.9)]',
          role: 'status' as const,
          ariaLive: 'polite' as const,
        };
      case 'info':
        return {
          icon: <Info className="w-3.5 h-3.5 text-[#F5F5F5] shrink-0" aria-hidden="true" />,
          progressClass: 'bg-[#F5A524] shadow-[0_0_8px_rgba(245,165,36,0.9)]',
          role: 'status' as const,
          ariaLive: 'polite' as const,
        };
      case 'action':
      case 'success':
      default:
        return {
          icon: <CheckCircle2 className="w-3.5 h-3.5 text-[#F5F5F5] shrink-0" aria-hidden="true" />,
          progressClass: 'bg-[#F5A524] shadow-[0_0_8px_rgba(245,165,36,0.9)]',
          role: 'status' as const,
          ariaLive: 'polite' as const,
        };
    }
  };

  const { icon, progressClass, role, ariaLive } = getVariantStyles();

  // Title formatting: ensure "Task Completed 🎉" format when task is completed
  const formatTitle = () => {
    const lower = toast.message.toLowerCase();
    if (lower === 'task completed' || lower === 'moved to completed' || lower === 'task completed 🎉') {
      return 'Task Completed 🎉';
    }
    return toast.message;
  };

  const displayTitle = formatTitle();

  // If title already includes an emoji, avoid rendering a duplicate in the controls
  const showControlsEmoji = toast.emoji && !displayTitle.includes(toast.emoji);

  // If description isn't explicitly provided, provide a contextual subtitle for action/delete toasts
  const descriptionText =
    toast.description ||
    (toast.action && toast.message.toLowerCase().includes('delete')
      ? 'Task moved to Trash'
      : undefined);

  return (
    <motion.div
      layout
      role={role}
      aria-live={ariaLive}
      initial={
        prefersReduced
          ? { opacity: 0 }
          : { opacity: 0, y: 16, scale: 0.96 }
      }
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={
        prefersReduced
          ? { opacity: 0, transition: { duration: 0.15 } }
          : { opacity: 0, scale: 0.95, transition: { duration: 0.15 } }
      }
      transition={
        prefersReduced
          ? { duration: 0 }
          : { duration: 0.22, ease: [0.16, 1, 0.3, 1] }
      }
      onMouseEnter={handlePause}
      onMouseLeave={handleResume}
      onFocus={handlePause}
      onBlur={handleResume}
      onTouchStart={handlePause}
      onTouchEnd={handleResume}
      className="pointer-events-auto relative overflow-hidden w-full min-h-[48px] rounded-[10px] bg-[#27272A] border border-[#3F3F46] shadow-[0_4px_16px_rgba(0,0,0,0.35)] flex items-center justify-between px-3 py-2 gap-2 select-none"
    >
      {/* Left Icon & Text Content */}
      <div className="flex items-center gap-2 min-w-0 flex-1">
        {/* Compact 18x18px Icon Container with Status Icon */}
        <div className="w-[18px] h-[18px] flex items-center justify-center shrink-0">
          {icon}
        </div>

        {/* Text Section: Title + Description */}
        <div className="min-w-0 flex-1 flex flex-col justify-center">
          <p className="text-[12.5px] font-medium text-[#F5F5F5] leading-tight truncate">
            {displayTitle}
          </p>
          {descriptionText && (
            <p className="text-[11px] text-[#A1A1AA] leading-tight mt-0.5 truncate">
              {descriptionText}
            </p>
          )}
        </div>
      </div>

      {/* Right Controls: Optional Action Button + Optional standalone Emoji + Dismiss Button */}
      <div className="flex items-center gap-2 shrink-0">
        {toast.action && (
          <button
            type="button"
            onClick={handleActionClick}
            className="inline-flex items-center justify-center bg-[#F5F5F5] text-[#27272A] text-[11px] font-medium rounded-[5px] px-2 py-0.5 hover:bg-[#E4E4E7] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-400 shrink-0 cursor-pointer shadow-none"
          >
            {toast.action.label}
          </button>
        )}

        {showControlsEmoji && (
          <span
            className="text-[14px] leading-none select-none flex items-center justify-center shrink-0"
            role="img"
            aria-label="celebration"
          >
            {toast.emoji}
          </span>
        )}

        {/* Close Button */}
        <button
          type="button"
          onClick={() => onDismiss(toast.id)}
          className="text-[#A1A1AA] hover:text-[#F5F5F5] p-0.5 rounded transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-400 shrink-0 cursor-pointer"
          aria-label="Dismiss toast"
        >
          <X className="w-3.5 h-3.5" aria-hidden="true" />
        </button>
      </div>

      {/* Luminous Progress Light Bar at Bottom Edge */}
      {!isInfinite && (
        <div className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#3F3F46]/50 rounded-b-[10px] overflow-hidden pointer-events-none">
          <div
            className={`h-full ${progressClass} rounded-r-full`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </motion.div>
  );
};
