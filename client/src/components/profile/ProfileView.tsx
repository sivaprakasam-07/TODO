import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTasks } from '../../context/TaskContext';
import { useToast } from '../../context/ToastContext';
import { storage } from '../../services/storage';
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
} from 'lucide-react';

export const ProfileView: React.FC = () => {
  const { user: authUser, signOutUser } = useAuth();
  const { tasksByStatus } = useTasks();
  const { showToast } = useToast();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);

  const displayName = authUser?.displayName || 'Google User';
  const displayEmail = authUser?.email || 'authenticated@google.com';
  const photoURL = authUser?.photoURL;

  const handleExport = () => {
    const data = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      user: {
        name: displayName,
        email: displayEmail,
        photoURL,
      },
      tasks: storage.getTasks(),
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

  const handleClear = () => {
    storage.clearAll();
    window.location.reload();
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

            <button
              type="button"
              onClick={() => setIsClearConfirmOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-lg transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Reset Local Storage
            </button>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
      />

      {/* Confirmation Modal */}
      {isClearConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
          <div className="bg-[#1A1A1A] border border-[#2E2E2E] rounded-xl p-5 max-w-sm w-full space-y-4 shadow-2xl">
            <h3 className="text-sm font-semibold text-[#F5F5F5]">Reset Local Data?</h3>
            <p className="text-xs text-[#8A8A8A] leading-relaxed">
              This will remove all tasks and restore the default state. This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsClearConfirmOpen(false)}
                className="px-3 py-1.5 text-xs text-[#8A8A8A] hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleClear}
                className="px-3.5 py-1.5 text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white rounded-md"
              >
                Reset Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
