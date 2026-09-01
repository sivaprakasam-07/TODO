import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Priority, Status } from '../../types/task';
import { useTasks } from '../../context/TaskContext';
import { useUI } from '../../context/UIContext';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useReducedMotion } from '../../hooks/useReducedMotion';

export const TaskDialog: React.FC = () => {
  const { createTask } = useTasks();
  const { isCreateTaskModalOpen, closeCreateTaskModal, createInitialStatus } = useUI();
  const prefersReduced = useReducedMotion();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority | ''>('');
  const [dueDate, setDueDate] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [error, setError] = useState('');

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isCreateTaskModalOpen) {
      setTitle('');
      setDescription('');
      setPriority('');
      setDueDate('');
      setTagsInput('');
      setError('');
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isCreateTaskModalOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Task title is required');
      return;
    }

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim().replace(/^#/, ''))
      .filter((t) => t.length > 0);

    createTask({
      title: title.trim(),
      description: description.trim() || undefined,
      status: createInitialStatus || 'todo',
      priority: (priority as Priority) || undefined,
      dueDate: dueDate || undefined,
      tags,
    });

    closeCreateTaskModal();
  };

  const statusDisplayNames: Record<Status, string> = {
    todo: 'Todo',
    'in-progress': 'In Progress',
    completed: 'Completed',
  };

  return (
    <AnimatePresence>
      {isCreateTaskModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={prefersReduced ? { duration: 0 } : { duration: 0.12 }}
            onClick={closeCreateTaskModal}
            className="fixed inset-0 bg-black/80 backdrop-blur-xs"
          />

          {/* Modal Card */}
          <motion.div
            initial={
              prefersReduced
                ? { opacity: 0 }
                : { opacity: 0, scale: 0.97, y: 6 }
            }
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={
              prefersReduced
                ? { opacity: 0 }
                : { opacity: 0, scale: 0.97, y: 6 }
            }
            transition={
              prefersReduced
                ? { duration: 0 }
                : { duration: 0.15, ease: [0.16, 1, 0.3, 1] }
            }
            className="relative w-full max-w-md bg-[#111111] border border-[#242424] rounded-xl shadow-2xl p-5 z-10 space-y-4"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#1E1E1E]">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-[#F5F5F5]">New Task</h3>
                <span className="text-[11px] font-mono text-[#8A8A8A] bg-[#181818] border border-[#262626] px-1.5 py-0.2 rounded">
                  {statusDisplayNames[createInitialStatus]}
                </span>
              </div>
              <button
                type="button"
                onClick={closeCreateTaskModal}
                className="p-1 text-[#666666] hover:text-[#F5F5F5] rounded transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {/* Title (Required) */}
              <div>
                <input
                  ref={inputRef}
                  type="text"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder="Task title..."
                  className={cn(
                    'w-full bg-[#161616] text-sm text-[#F5F5F5] placeholder-[#555555] border rounded-lg px-3 py-2 focus:outline-none transition-colors',
                    error
                      ? 'border-rose-500/60 focus:border-rose-500'
                      : 'border-[#262626] focus:border-[#444444]'
                  )}
                />
                {error && <p className="mt-1 text-xs text-rose-400">{error}</p>}
              </div>

              {/* Description (Optional) */}
              <div>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Description (optional)..."
                  rows={2}
                  className="w-full bg-[#161616] text-xs text-[#E0E0E0] placeholder-[#555555] border border-[#262626] focus:border-[#444444] rounded-lg px-3 py-2 focus:outline-none resize-none leading-relaxed transition-colors"
                />
              </div>

              {/* Priority & Due Date Row */}
              <div className="grid grid-cols-2 gap-3">
                {/* Priority */}
                <div>
                  <label className="block text-[11px] font-medium text-[#777777] mb-1">
                    Priority
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as Priority | '')}
                    className="w-full bg-[#161616] text-xs text-[#E0E0E0] border border-[#262626] focus:border-[#444444] rounded-md px-2 py-1.5 focus:outline-none"
                  >
                    <option value="">None</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

                {/* Due Date */}
                <div>
                  <label className="block text-[11px] font-medium text-[#777777] mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full bg-[#161616] text-xs text-[#E0E0E0] border border-[#262626] focus:border-[#444444] rounded-md px-2 py-1.5 focus:outline-none"
                  />
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-[11px] font-medium text-[#777777] mb-1">
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="e.g. Frontend, API, DSA"
                  className="w-full bg-[#161616] text-xs text-[#E0E0E0] placeholder-[#555555] border border-[#262626] focus:border-[#444444] rounded-md px-2.5 py-1.5 focus:outline-none"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#1E1E1E]">
                <button
                  type="button"
                  onClick={closeCreateTaskModal}
                  className="px-3 py-1.5 text-xs text-[#8A8A8A] hover:text-[#F5F5F5] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 text-xs font-semibold bg-[#F5F5F5] hover:bg-white text-black rounded-md shadow-xs transition-colors cursor-pointer"
                >
                  Create Task
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
