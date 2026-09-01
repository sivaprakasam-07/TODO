import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTasks } from '../../context/TaskContext';
import { useUI } from '../../context/UIContext';
import { Status, Task } from '../../types/task';
import { X, Clock, CheckCircle2, Circle, ArrowRight, Plus } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useReducedMotion } from '../../hooks/useReducedMotion';

interface SelectTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetStatus: 'in-progress' | 'completed' | null;
}

export const SelectTaskModal: React.FC<SelectTaskModalProps> = ({
  isOpen,
  onClose,
  targetStatus,
}) => {
  const { tasks, moveTask } = useTasks();
  const { openCreateTaskModal } = useUI();
  const prefersReduced = useReducedMotion();

  if (!targetStatus) return null;

  // Filter available candidate tasks
  // For 'in-progress': candidate tasks are from 'todo'
  // For 'completed': candidate tasks are from 'in-progress' and 'todo'
  const availableTasks = tasks.filter((t) => {
    if (t.deletedAt) return false;
    if (targetStatus === 'in-progress') {
      return t.status === 'todo';
    }
    if (targetStatus === 'completed') {
      return t.status === 'in-progress' || t.status === 'todo';
    }
    return false;
  });

  const handleSelectTask = (task: Task) => {
    moveTask(task.id, targetStatus);
    onClose();
  };

  const handleCreateNewInTodo = () => {
    onClose();
    openCreateTaskModal('todo');
  };

  const isTargetInProgress = targetStatus === 'in-progress';
  const modalTitle = isTargetInProgress ? 'Start a Task' : 'Complete a Task';
  const modalSubtitle = isTargetInProgress
    ? 'Select a task from Todo to move to In Progress'
    : 'Select an active task to mark as Completed';

  const statusIcons: Record<Status, React.ComponentType<{ className?: string }>> = {
    todo: Circle,
    'in-progress': Clock,
    completed: CheckCircle2,
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="select-task-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={prefersReduced ? { duration: 0 } : { duration: 0.12 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-xs"
          />

          {/* Modal Content */}
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
            className="relative w-full max-w-lg bg-[#111111] border border-[#242424] rounded-xl shadow-2xl p-4 sm:p-5 z-10 space-y-4 max-h-[85vh] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#1E1E1E] shrink-0">
              <div className="flex items-center gap-2">
                {isTargetInProgress ? (
                  <Clock className="w-4 h-4 text-amber-400" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                )}
                <div>
                  <h3 id="select-task-modal-title" className="text-sm font-semibold text-[#F5F5F5]">
                    {modalTitle}
                  </h3>
                  <p className="text-[11px] text-[#777777] mt-0.5">{modalSubtitle}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1 text-[#666666] hover:text-[#F5F5F5] rounded transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Task List Container */}
            <div className="flex-1 overflow-y-auto space-y-2 min-h-[160px] pr-1">
              {availableTasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 border border-dashed border-[#202020] rounded-lg text-center p-5 space-y-2">
                  <span className="text-xs text-[#777777]">
                    {isTargetInProgress
                      ? 'No tasks available in Todo.'
                      : 'No active tasks to complete.'}
                  </span>
                  <button
                    type="button"
                    onClick={handleCreateNewInTodo}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#EDEDED] hover:text-white bg-[#1C1C1C] hover:bg-[#252525] border border-[#2C2C2C] rounded-lg transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create a task in Todo</span>
                  </button>
                </div>
              ) : (
                availableTasks.map((task) => {
                  const CurrentIcon = statusIcons[task.status];
                  return (
                    <button
                      key={task.id}
                      type="button"
                      onClick={() => handleSelectTask(task)}
                      className="w-full group text-left bg-[#161616] hover:bg-[#1E1E1E] border border-[#262626] hover:border-[#383838] rounded-lg p-3 transition-all duration-150 flex items-center justify-between gap-3 cursor-pointer shadow-xs"
                    >
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[11px] font-semibold text-[#666666] uppercase">
                            {task.taskNumber}
                          </span>
                          {!isTargetInProgress && (
                            <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.2 rounded bg-[#202020] text-[#999999] border border-[#2C2C2C]">
                              <CurrentIcon className="w-2.5 h-2.5" />
                              {task.status === 'in-progress' ? 'In Progress' : 'Todo'}
                            </span>
                          )}
                          {task.priority && (
                            <span
                              className={cn(
                                'text-[10px] px-1.5 py-0.2 rounded uppercase font-semibold',
                                task.priority === 'high'
                                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                  : task.priority === 'medium'
                                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                  : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                              )}
                            >
                              {task.priority}
                            </span>
                          )}
                        </div>

                        <h4 className="text-xs font-semibold text-[#E5E5E5] group-hover:text-white truncate">
                          {task.title}
                        </h4>

                        {task.tags && task.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-0.5">
                            {task.tags.map((tag) => (
                              <span
                                key={tag}
                                className="text-[10px] text-[#777777] bg-[#1E1E1E] px-1.5 py-0.2 rounded"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="shrink-0 flex items-center gap-1 text-xs text-[#666666] group-hover:text-[#F5F5F5] transition-colors">
                        <span className="hidden sm:inline text-[11px]">
                          {isTargetInProgress ? 'Start' : 'Complete'}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-[#1E1E1E] shrink-0 text-xs">
              <span className="text-[11px] text-[#555555]">
                {availableTasks.length} {availableTasks.length === 1 ? 'task' : 'tasks'} available
              </span>
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 text-xs text-[#8A8A8A] hover:text-[#F5F5F5] transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
