import React, { useState } from 'react';
import { useTasks } from '../../context/TaskContext';
import { useToast } from '../../context/ToastContext';
import { storage } from '../../services/storage';
import { User as UserIcon, Mail, Download, Trash2, CheckCircle2, Clock, Circle } from 'lucide-react';

export const ProfileView: React.FC = () => {
  const { user, updateUser, tasksByStatus } = useTasks();
  const { showToast } = useToast();

  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [role, setRole] = useState(user.role || 'Product Engineer');
  const [isEditing, setIsEditing] = useState(false);
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateUser({ name: name.trim(), email: email.trim(), role: role.trim() });
    setIsEditing(false);
  };

  const handleExport = () => {
    const data = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      user,
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
      <div className="bg-[#0E0E0E] border border-[#1F1F1F] rounded-xl p-5 sm:p-6 space-y-6">
        {/* User Info Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-[#1A1A1A]">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-[#181818] border border-[#282828] overflow-hidden flex items-center justify-center text-[#7A7A7A] font-bold text-lg">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <UserIcon className="w-6 h-6" />
              )}
            </div>

            <div>
              <h3 className="text-base font-semibold text-[#F5F5F5]">{user.name}</h3>
              <p className="text-xs text-[#8A8A8A] flex items-center gap-1.5 mt-0.5">
                <Mail className="w-3 h-3 text-[#666666]" /> {user.email}
              </p>
              <p className="text-[11px] text-[#666666] mt-0.5">{user.role || 'Product Engineer'}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsEditing(!isEditing)}
            className="px-3 py-1.5 text-xs text-[#8A8A8A] hover:text-[#F5F5F5] bg-[#161616] hover:bg-[#1C1C1C] border border-[#242424] rounded-lg transition-colors cursor-pointer"
          >
            {isEditing ? 'Cancel' : 'Edit Profile'}
          </button>
        </div>

        {/* Edit Form */}
        {isEditing && (
          <form onSubmit={handleSave} className="space-y-3.5 pt-2 pb-4 border-b border-[#1A1A1A]">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-[11px] font-medium text-[#777777] mb-1">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#141414] border border-[#262626] rounded px-2.5 py-1.5 text-xs text-[#F5F5F5] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-[#777777] mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#141414] border border-[#262626] rounded px-2.5 py-1.5 text-xs text-[#F5F5F5] focus:outline-none"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-medium text-[#777777] mb-1">Role</label>
                <input
                  type="text"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full bg-[#141414] border border-[#262626] rounded px-2.5 py-1.5 text-xs text-[#F5F5F5] focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="px-3.5 py-1.5 text-xs font-semibold bg-[#F5F5F5] hover:bg-white text-black rounded-md transition-colors cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          </form>
        )}

        {/* Task Summary Grid */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-[#777777]">
            Task Summary
          </h4>
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-lg bg-[#121212] border border-[#1E1E1E]">
              <div className="flex items-center gap-1.5 text-xs text-[#8A8A8A]">
                <Circle className="w-3 h-3 text-[#8A8A8A]" /> Todo
              </div>
              <p className="font-mono text-xl font-bold text-[#F5F5F5] mt-1">
                {tasksByStatus.todo.length}
              </p>
            </div>

            <div className="p-3 rounded-lg bg-[#121212] border border-[#1E1E1E]">
              <div className="flex items-center gap-1.5 text-xs text-amber-400">
                <Clock className="w-3 h-3 text-amber-400" /> In Progress
              </div>
              <p className="font-mono text-xl font-bold text-[#F5F5F5] mt-1">
                {tasksByStatus['in-progress'].length}
              </p>
            </div>

            <div className="p-3 rounded-lg bg-[#121212] border border-[#1E1E1E]">
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
        <div className="pt-4 border-t border-[#1A1A1A] space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-[#777777]">
            Data Management
          </h4>
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleExport}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#D1D1D1] hover:text-white bg-[#141414] hover:bg-[#1C1C1C] border border-[#242424] rounded-lg transition-colors cursor-pointer"
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

      {/* Confirmation Modal */}
      {isClearConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
          <div className="bg-[#141414] border border-[#262626] rounded-xl p-5 max-w-sm w-full space-y-4 shadow-2xl">
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
