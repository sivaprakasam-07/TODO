import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useTasks } from '../../context/TaskContext';
import { useToast } from '../../context/ToastContext';
import { EditProfileModal } from './EditProfileModal';
import {
  User as UserIcon,
  Mail,
  Download,
  Trash2,
  CheckCircle2,
  Clock,
  Circle,
  LogOut,
  ShieldCheck,
  Edit2,
  AlertTriangle,
  Loader2,
  X,
} from 'lucide-react';
import { useReducedMotion } from '../../hooks/useReducedMotion';

export const ProfileView: React.FC = () => {
  const { user: authUser, signOutUser } = useAuth();
  const { tasks, tasksByStatus, clearAllTasks } = useTasks();
  const { showToast } = useToast();
  const prefersReduced = useReducedMotion();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);
  const [confirmInput, setConfirmInput] = useState('');
  const [isClearing, setIsClearing] = useState(false);

  const confirmInputRef = useRef<HTMLInputElement>(null);

  const displayName = authUser?.displayName || 'Google User';
  const displayEmail = authUser?.email || 'authenticated@google.com';
  const photoURL = authUser?.photoURL;

  // Auto-focus confirmation input on modal open
  useEffect(() => {
    if (isClearConfirmOpen) {
      setConfirmInput('');
      setIsClearing(false);
      setTimeout(() => {
        confirmInputRef.current?.focus();
      }, 50);
    }
  }, [isClearConfirmOpen]);

  // Handle Escape key inside confirmation modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isClearConfirmOpen && !isClearing) {
        setIsClearConfirmOpen(false);
        setConfirmInput('');
      }
    };
    if (isClearConfirmOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isClearConfirmOpen, isClearing]);

  const handleExport = () => {
    const data = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      user: {
        name: displayName,
        email: displayEmail,
        photoURL,
      },
      tasks,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `focusflow-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast({ message: 'Backup exported', type: 'success' });
  };

  const handleClearAllTasks = async () => {
    if (confirmInput !== 'DELETE' || isClearing) return;
    setIsClearing(true);

    try {
      const success = await clearAllTasks();
      if (success) {
        setIsClearConfirmOpen(false);
        setConfirmInput('');
      }
    } catch (err) {
      console.error('[ProfileView] Error clearing all tasks:', err);
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      {/* Profile Card */}
      <div className="bg-[#181818] border border-[#262626] rounded-xl p-5 sm:p-6 space-y-6 shadow-md">
        {/* User Info Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-[#222222]">
          <div className="flex items-center gap-4">
            {/* Avatar with click to edit */}
            <div
              onClick={() => setIsEditModalOpen(true)}
              className="group relative w-14 h-14 rounded-full bg-[#242424] border border-[#333333] overflow-hidden flex items-center justify-center text-[#888888] font-bold text-lg shrink-0 cursor-pointer"
              title="Click to edit profile"
            >
              {photoURL ? (
                <img
                  src={photoURL}
                  alt={displayName}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <UserIcon className="w-6 h-6" />
              )}
              {/* Hover Edit Overlay */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <Edit2 className="w-4 h-4 text-white" />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-[#F5F5F5]">{displayName}</h3>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-medium text-emerald-400">
                  <ShieldCheck className="w-3 h-3" /> Google Auth
                </span>
              </div>
              <p className="text-xs text-[#8A8A8A] flex items-center gap-1.5 mt-1">
                <Mail className="w-3 h-3 text-[#666666]" /> {displayEmail}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#CCCCCC] hover:text-white bg-[#222222] hover:bg-[#2A2A2A] border border-[#303030] rounded-lg transition-colors cursor-pointer"
            >
              <Edit2 className="w-3 h-3" />
              <span>Edit Profile</span>
            </button>

            <button
              type="button"
              onClick={signOutUser}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-rose-300 hover:text-rose-200 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-lg transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Task Summary Grid */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-[#777777]">
            Task Summary
          </h4>
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-lg bg-[#141414] border border-[#222222]">
              <div className="flex items-center gap-1.5 text-xs text-[#8A8A8A]">
                <Circle className="w-3 h-3 text-[#8A8A8A]" /> Todo
              </div>
              <p className="font-mono text-xl font-bold text-[#F5F5F5] mt-1">
                {tasksByStatus.todo.length}
              </p>
            </div>

            <div className="p-3 rounded-lg bg-[#141414] border border-[#222222]">
              <div className="flex items-center gap-1.5 text-xs text-amber-400">
                <Clock className="w-3 h-3 text-amber-400" /> In Progress
              </div>
              <p className="font-mono text-xl font-bold text-[#F5F5F5] mt-1">
                {tasksByStatus['in-progress'].length}
              </p>
            </div>

            <div className="p-3 rounded-lg bg-[#141414] border border-[#222222]">
              <div className="flex items-center gap-1.5 text-xs text-emerald-400">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Completed
              </div>
              <p className="font-mono text-xl font-bold text-[#F5F5F5] mt-1">
                {tasksByStatus.completed.length}
              </p>
            </div>
          </div>
        </div>

        {/* Data & Backup Actions */}
        <div className="pt-4 border-t border-[#222222] space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-[#777777]">
            Data Management
          </h4>
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleExport}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#D1D1D1] hover:text-white bg-[#141414] hover:bg-[#1E1E1E] border border-[#282828] rounded-lg transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-[#8A8A8A]" />
              Export JSON Backup
            </button>
          </div>
        </div>
      </div>

      {/* Danger Zone Section */}
      <div className="bg-[#181818] border border-rose-500/20 rounded-xl p-5 sm:p-6 space-y-4 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <h4 className="text-sm font-semibold text-rose-400">Danger Zone</h4>
            </div>
            <p className="text-xs text-[#8A8A8A]">
              Permanently delete all your tasks from Firestore. This action cannot be undone.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsClearConfirmOpen(true)}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-rose-300 hover:text-rose-200 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 rounded-lg transition-colors cursor-pointer shrink-0"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear All Tasks</span>
          </button>
        </div>
      </div>

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
      />

      {/* Clear All Tasks Confirmation Modal */}
      <AnimatePresence>
        {isClearConfirmOpen && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="clear-tasks-title"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs"
            onClick={() => {
              if (!isClearing) {
                setIsClearConfirmOpen(false);
                setConfirmInput('');
              }
            }}
          >
            <motion.div
              initial={prefersReduced ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={prefersReduced ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 6 }}
              transition={{ duration: 0.15 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#141414] border border-[#2B2B2B] rounded-xl p-5 max-w-md w-full space-y-4 shadow-2xl"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2 text-rose-400">
                  <AlertTriangle className="w-5 h-5 shrink-0" />
                  <h3 id="clear-tasks-title" className="text-sm font-semibold text-[#F5F5F5]">
                    Clear all tasks?
                  </h3>
                </div>
                <button
                  type="button"
                  disabled={isClearing}
                  onClick={() => {
                    setIsClearConfirmOpen(false);
                    setConfirmInput('');
                  }}
                  className="p-1 text-[#666666] hover:text-[#F5F5F5] rounded transition-colors disabled:opacity-40 cursor-pointer"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-[#999999] leading-relaxed">
                This will permanently delete all of your tasks from Firestore. This action cannot be undone.
              </p>

              <div className="space-y-1.5 pt-1">
                <label className="block text-[11px] font-medium text-[#777777]">
                  Type <span className="font-mono text-rose-400 font-semibold select-all">DELETE</span> to confirm
                </label>
                <input
                  ref={confirmInputRef}
                  type="text"
                  value={confirmInput}
                  onChange={(e) => setConfirmInput(e.target.value)}
                  disabled={isClearing}
                  placeholder="DELETE"
                  className="w-full bg-[#1A1A1A] text-xs font-mono text-[#F5F5F5] placeholder-[#555555] border border-[#2E2E2E] focus:border-rose-500/60 rounded-lg px-3 py-2 focus:outline-none transition-colors"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#202020]">
                <button
                  type="button"
                  disabled={isClearing}
                  onClick={() => {
                    setIsClearConfirmOpen(false);
                    setConfirmInput('');
                  }}
                  className="px-3.5 py-1.5 text-xs text-[#8A8A8A] hover:text-[#F5F5F5] transition-colors disabled:opacity-40 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={confirmInput !== 'DELETE' || isClearing}
                  onClick={handleClearAllTasks}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold bg-rose-600 hover:bg-rose-500 disabled:opacity-40 disabled:hover:bg-rose-600 text-white rounded-lg shadow-sm transition-colors cursor-pointer"
                >
                  {isClearing ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Clearing...</span>
                    </>
                  ) : (
                    <span>Clear All Tasks</span>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
