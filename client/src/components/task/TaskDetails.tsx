import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Priority, Status } from '../../types/task';
import { useTasks } from '../../context/TaskContext';
import { useUI } from '../../context/UIContext';
import { formatTimestamp } from '../../lib/utils';
import { X, Trash2, Tag as TagIcon, Plus } from 'lucide-react';
import { useReducedMotion } from '../../hooks/useReducedMotion';

export const TaskDetails: React.FC = () => {
  const { getTaskById, updateTask, deleteTask } = useTasks();
  const { selectedTaskId, setSelectedTaskId } = useUI();
  const prefersReduced = useReducedMotion();

  const task = selectedTaskId ? getTaskById(selectedTaskId) : undefined;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [newTag, setNewTag] = useState('');
  const [isAddingTag, setIsAddingTag] = useState(false);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setNewTag('');
      setIsAddingTag(false);
    }
  }, [task]);

  if (!task) return null;

  const handleTitleBlur = () => {
    if (title.trim() && title !== task.title) {
      updateTask(task.id, { title: title.trim() });
    } else {
      setTitle(task.title);
    }
  };

  const handleDescriptionBlur = () => {
    if (description !== (task.description || '')) {
      updateTask(task.id, { description: description.trim() || undefined });
    }
  };

  const handleStatusChange = (status: Status) => {
    updateTask(task.id, { status });
  };

  const handlePriorityChange = (priority: Priority | '') => {
    updateTask(task.id, { priority: priority ? priority : undefined });
  };

  const handleDueDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateTask(task.id, { dueDate: e.target.value || undefined });
  };

  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newTag.trim().replace(/^#/, '');
    if (clean && !task.tags.includes(clean)) {
      updateTask(task.id, { tags: [...task.tags, clean] });
      setNewTag('');
      setIsAddingTag(false);
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    updateTask(task.id, {
      tags: task.tags.filter((t) => t !== tagToRemove),
    });
  };

  const handleDelete = () => {
    deleteTask(task.id);
    setSelectedTaskId(null);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-40 flex justify-end pointer-events-none">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={prefersReduced ? { duration: 0 } : { duration: 0.12 }}
          onClick={() => setSelectedTaskId(null)}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs pointer-events-auto"
        />

        {/* Slide-over Drawer / Sheet */}
        <motion.div
          initial={
            prefersReduced
              ? { opacity: 0 }
              : { opacity: 0, x: 24 }
          }
          animate={{ opacity: 1, x: 0 }}
          exit={
            prefersReduced
              ? { opacity: 0 }
              : { opacity: 0, x: 24 }
          }
          transition={
            prefersReduced
              ? { duration: 0 }
              : { duration: 0.18, ease: [0.16, 1, 0.3, 1] }
          }
          className="pointer-events-auto relative w-full sm:max-w-md bg-[#111111] border-l border-[#242424] shadow-2xl flex flex-col h-full overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#1E1E1E]">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-semibold text-[#666666] tracking-wider uppercase">
                {task.taskNumber}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleDelete}
                className="p-1.5 text-[#666666] hover:text-rose-400 hover:bg-rose-500/10 rounded transition-colors"
                title="Delete task"
                aria-label="Delete task"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setSelectedTaskId(null)}
                className="p-1.5 text-[#666666] hover:text-[#F5F5F5] hover:bg-[#1C1C1C] rounded transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {/* Title Textarea */}
            <div>
              <textarea
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={handleTitleBlur}
                rows={2}
                placeholder="Task title..."
                className="w-full bg-transparent text-base font-semibold text-[#F5F5F5] placeholder-[#555555] border-0 focus:outline-none focus:ring-0 resize-none p-0 leading-snug"
              />
            </div>

            {/* Description */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-[#777777]">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onBlur={handleDescriptionBlur}
                rows={3}
                placeholder="Add notes, specifications, or details..."
                className="w-full bg-[#161616] text-xs text-[#E0E0E0] placeholder-[#555555] border border-[#242424] rounded-lg p-2.5 focus:outline-none focus:border-[#383838] transition-colors leading-relaxed"
              />
            </div>

            {/* Properties Grid */}
            <div className="space-y-3 bg-[#151515] border border-[#202020] rounded-lg p-3.5 text-xs">
              {/* Status */}
              <div className="grid grid-cols-3 items-center gap-2">
                <span className="text-[#777777]">Status</span>
                <div className="col-span-2">
                  <select
                    value={task.status}
                    onChange={(e) => handleStatusChange(e.target.value as Status)}
                    className="w-full bg-[#1B1B1B] border border-[#2B2B2B] rounded px-2 py-1 text-xs text-[#F5F5F5] focus:outline-none"
                  >
                    <option value="todo">Todo</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>

              {/* Priority */}
              <div className="grid grid-cols-3 items-center gap-2">
                <span className="text-[#777777]">Priority</span>
                <div className="col-span-2">
                  <select
                    value={task.priority || ''}
                    onChange={(e) => handlePriorityChange(e.target.value as Priority | '')}
                    className="w-full bg-[#1B1B1B] border border-[#2B2B2B] rounded px-2 py-1 text-xs text-[#F5F5F5] focus:outline-none"
                  >
                    <option value="">None</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              {/* Due Date */}
              <div className="grid grid-cols-3 items-center gap-2">
                <span className="text-[#777777]">Due Date</span>
                <div className="col-span-2">
                  <input
                    type="date"
                    value={task.dueDate || ''}
                    onChange={handleDueDateChange}
                    className="w-full bg-[#1B1B1B] border border-[#2B2B2B] rounded px-2 py-1 text-xs text-[#F5F5F5] focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-[#777777] flex items-center gap-1">
                  <TagIcon className="w-3 h-3" /> Tags
                </label>
                {!isAddingTag && (
                  <button
                    type="button"
                    onClick={() => setIsAddingTag(true)}
                    className="text-xs text-[#8A8A8A] hover:text-[#F5F5F5] flex items-center gap-1 transition-colors"
                  >
                    <Plus className="w-3 h-3" /> Add
                  </button>
                )}
              </div>

              <div className="flex flex-wrap gap-1.5">
                {task.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-[#181818] border border-[#262626] text-[#A0A0A0]"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="text-[#666666] hover:text-rose-400 p-0.5 transition-colors"
                    >
                      ×
                    </button>
                  </span>
                ))}
                {task.tags.length === 0 && !isAddingTag && (
                  <span className="text-xs text-[#555555] italic">No tags</span>
                )}
              </div>

              {isAddingTag && (
                <form onSubmit={handleAddTag} className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="New tag..."
                    autoFocus
                    className="flex-1 bg-[#161616] text-xs text-[#F5F5F5] border border-[#2B2B2B] rounded px-2 py-1 focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="px-2.5 py-1 text-xs bg-[#242424] hover:bg-[#303030] text-[#F5F5F5] rounded transition-colors"
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAddingTag(false)}
                    className="px-2 py-1 text-xs text-[#777777] hover:text-[#F5F5F5]"
                  >
                    Cancel
                  </button>
                </form>
              )}
            </div>

            {/* Timestamps */}
            <div className="pt-4 border-t border-[#1E1E1E] space-y-1 text-[11px] text-[#555555]">
              <div>Created: {formatTimestamp(task.createdAt)}</div>
              <div>Updated: {formatTimestamp(task.updatedAt)}</div>
              {task.completedAt && (
                <div>Completed: {formatTimestamp(task.completedAt)}</div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
