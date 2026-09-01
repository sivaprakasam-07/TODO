import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Priority, Status } from '../../types/task';
import { useTasks } from '../../context/TaskContext';
import { useUI } from '../../context/UIContext';
import { X, Loader2, Tag as TagIcon } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useReducedMotion } from '../../hooks/useReducedMotion';

export const TaskDialog: React.FC = () => {
  const { createTask, tasks } = useTasks();
  const { isCreateTaskModalOpen, closeCreateTaskModal, createInitialStatus } = useUI();
  const prefersReduced = useReducedMotion();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority | ''>('');
  const [dueDate, setDueDate] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const inputRef = useRef<HTMLInputElement>(null);

  // Collect unique existing tags from current active tasks for auto-suggestions
  const availableTags = useMemo(() => {
    const set = new Set<string>();
    tasks.forEach((t) => {
      t.tags?.forEach((tag) => set.add(tag));
    });
    return Array.from(set).filter((tag) => !tags.includes(tag)).slice(0, 6);
  }, [tasks, tags]);

  useEffect(() => {
    if (isCreateTaskModalOpen) {
      setTitle('');
      setDescription('');
      setPriority('');
      setDueDate('');
      setTagInput('');
      setTags([]);
      setError('');
      setIsSubmitting(false);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isCreateTaskModalOpen]);

  const handleAddTag = (tagToAdd?: string) => {
    const raw = tagToAdd !== undefined ? tagToAdd : tagInput;
    const clean = raw.trim().replace(/^#/, '');
    if (clean && !tags.includes(clean)) {
      setTags((prev) => [...prev, clean]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags((prev) => prev.filter((t) => t !== tagToRemove));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const setDueDatePreset = (type: 'today' | 'tomorrow' | 'clear') => {
    const now = new Date();
    if (type === 'today') {
      const y = now.getFullYear();
      const m = String(now.getMonth() + 1).padStart(2, '0');
      const d = String(now.getDate()).padStart(2, '0');
      setDueDate(`${y}-${m}-${d}`);
    } else if (type === 'tomorrow') {
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const y = tomorrow.getFullYear();
      const m = String(tomorrow.getMonth() + 1).padStart(2, '0');
      const d = String(tomorrow.getDate()).padStart(2, '0');
      setDueDate(`${y}-${m}-${d}`);
    } else {
      setDueDate('');
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isSubmitting) return;

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError('Task title is required');
      inputRef.current?.focus();
      return;
    }

    setIsSubmitting(true);

    try {
      await createTask({
        title: trimmedTitle,
        description: description.trim() || undefined,
        status: createInitialStatus || 'todo',
        priority: (priority as Priority) || undefined,
        dueDate: dueDate || undefined,
        tags,
      });

      closeCreateTaskModal();
    } catch (err) {
      console.error('[TaskDialog] Error creating task:', err);
      setError('Unable to create task. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
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
          aria-labelledby="new-task-dialog-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6"
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
            className="relative w-full max-w-md bg-[#111111] border border-[#242424] rounded-xl shadow-2xl p-4 sm:p-5 z-10 space-y-4 max-h-[90vh] overflow-y-auto"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#1E1E1E]">
              <div className="flex items-center gap-2">
                <h3 id="new-task-dialog-title" className="text-sm font-semibold text-[#F5F5F5]">
                  New Task
                </h3>
                <span className="text-[11px] font-mono text-[#8A8A8A] bg-[#181818] border border-[#262626] px-1.5 py-0.2 rounded">
                  {statusDisplayNames[createInitialStatus]}
                </span>
              </div>
              <button
                type="button"
                onClick={closeCreateTaskModal}
                className="p-1 text-[#666666] hover:text-[#F5F5F5] rounded transition-colors cursor-pointer"
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
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSubmit();
                    }
                  }}
                  placeholder="Task title (e.g. Build portfolio API)..."
                  maxLength={120}
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
                  placeholder="Description or notes (optional)..."
                  rows={2}
                  maxLength={500}
                  className="w-full bg-[#161616] text-xs text-[#E0E0E0] placeholder-[#555555] border border-[#262626] focus:border-[#444444] rounded-lg px-3 py-2 focus:outline-none resize-none leading-relaxed transition-colors"
                />
              </div>

              {/* Priority & Due Date Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Priority */}
                <div>
                  <label className="block text-[11px] font-medium text-[#777777] mb-1">
                    Priority
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as Priority | '')}
                    className="w-full bg-[#161616] text-xs text-[#E0E0E0] border border-[#262626] focus:border-[#444444] rounded-md px-2.5 py-1.5 focus:outline-none"
                  >
                    <option value="">None</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

                {/* Due Date with Quick Presets */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-medium text-[#777777]">
                      Due Date
                    </label>
                    <div className="flex items-center gap-1 text-[10px]">
                      <button
                        type="button"
                        onClick={() => setDueDatePreset('today')}
                        className="text-[#888888] hover:text-[#EDEDED] transition-colors"
                      >
                        Today
                      </button>
                      <span className="text-[#444444]">•</span>
                      <button
                        type="button"
                        onClick={() => setDueDatePreset('tomorrow')}
                        className="text-[#888888] hover:text-[#EDEDED] transition-colors"
                      >
                        Tomorrow
                      </button>
                    </div>
                  </div>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full bg-[#161616] text-xs text-[#E0E0E0] border border-[#262626] focus:border-[#444444] rounded-md px-2.5 py-1.5 focus:outline-none"
                  />
                </div>
              </div>

              {/* Tags Section */}
              <div className="space-y-2">
                <label className="block text-[11px] font-medium text-[#777777]">
                  Tags
                </label>

                {/* Tag Pills */}
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-[#1C1C1C] border border-[#2B2B2B] text-[#CCCCCC]"
                      >
                        <span>#{tag}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="text-[#777777] hover:text-rose-400 p-0.5 transition-colors"
                          aria-label={`Remove tag ${tag}`}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Tag Input Field */}
                <div className="flex items-center gap-1.5">
                  <div className="relative flex-1">
                    <TagIcon className="absolute left-2.5 top-2 w-3 h-3 text-[#555555]" />
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={handleTagKeyDown}
                      placeholder="Add tag and press Enter..."
                      className="w-full bg-[#161616] text-xs text-[#E0E0E0] placeholder-[#555555] border border-[#262626] focus:border-[#444444] rounded-md pl-7 pr-2.5 py-1.5 focus:outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAddTag()}
                    disabled={!tagInput.trim()}
                    className="px-2.5 py-1.5 text-xs bg-[#222222] hover:bg-[#2A2A2A] disabled:opacity-40 text-[#EDEDED] rounded-md border border-[#2F2F2F] transition-colors cursor-pointer"
                  >
                    Add
                  </button>
                </div>

                {/* Tag Auto-Suggestions */}
                {availableTags.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1 pt-1">
                    <span className="text-[10px] text-[#555555]">Suggestions:</span>
                    {availableTags.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => handleAddTag(tag)}
                        className="text-[10px] text-[#888888] hover:text-[#EDEDED] bg-[#181818] hover:bg-[#222222] border border-[#262626] px-1.5 py-0.5 rounded transition-colors"
                      >
                        +{tag}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#1E1E1E]">
                <button
                  type="button"
                  onClick={closeCreateTaskModal}
                  disabled={isSubmitting}
                  className="px-3 py-1.5 text-xs text-[#8A8A8A] hover:text-[#F5F5F5] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !title.trim()}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-[#F5F5F5] hover:bg-white disabled:opacity-50 text-black rounded-md shadow-xs transition-colors cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <span>Create Task</span>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
