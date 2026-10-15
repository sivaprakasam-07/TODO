import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTasks } from '../../context/TaskContext';
import { Task, Status } from '../../types/task';
import { formatTimestamp } from '../../lib/utils';
import {
  Trash2,
  RotateCcw,
  AlertTriangle,
  Circle,
  Clock,
  CheckCircle2,
  X,
  Loader2,
} from 'lucide-react';
import { useReducedMotion } from '../../hooks/useReducedMotion';

export const TrashView: React.FC = () => {
  const { trashTasks, restoreTask, permanentlyDeleteTask, deleteAllTrashTasks } = useTasks();
  const prefersReduced = useReducedMotion();

  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [isEmptyTrashConfirmOpen, setIsEmptyTrashConfirmOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const statusIcons: Record<Status, { icon: React.ComponentType<{ className?: string }>; label: string }> = {
    todo: { icon: Circle, label: 'Todo' },
    'in-progress': { icon: Clock, label: 'In Progress' },
    completed: { icon: CheckCircle2, label: 'Completed' },
  };

  const handleConfirmPermanentDelete = async () => {
    if (!taskToDelete || isProcessing) return;
    setIsProcessing(true);
    try {
      await permanentlyDeleteTask(taskToDelete.id);
      setTaskToDelete(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmEmptyTrash = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      await deleteAllTrashTasks();
      setIsEmptyTrashConfirmOpen(false);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-5">
      {/* Header with Title and Empty Trash Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#222222]">
        <div>
          <div className="flex items-center gap-2">
            <Trash2 className="w-4 h-4 text-[#8A8A8A]" />
            <h2 className="text-sm font-semibold text-[#F5F5F5]">Trash</h2>
            <span className="font-mono text-xs text-[#666666]">({trashTasks.length})</span>
          </div>
          <p className="text-xs text-[#777777] mt-0.5">
            Soft-deleted tasks can be restored to their previous column or deleted permanently.
          </p>
        </div>

        {trashTasks.length > 0 && (
          <button
            type="button"
            onClick={() => setIsEmptyTrashConfirmOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-lg transition-colors cursor-pointer shrink-0 self-start sm:self-auto"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Empty Trash</span>
          </button>
        )}
      </div>

      {/* Task List or Empty State */}
      {trashTasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 border border-dashed border-[#202020] rounded-xl text-center p-6 space-y-2">
          <Trash2 className="w-6 h-6 text-[#444444]" />
          <p className="text-xs font-medium text-[#777777]">Trash is empty</p>
          <p className="text-[11px] text-[#4E4E4E]">
            Tasks you delete will appear here before being permanently removed.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {trashTasks.map((task) => {
            const StatusIcon = statusIcons[task.status].icon;
            return (
              <div
                key={task.id}
                className="bg-[#181818] hover:bg-[#1C1C1C] border border-[#242424] hover:border-[#303030] rounded-lg p-3.5 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
              >
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-semibold text-[#666666] uppercase">
                      {task.taskNumber}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.2 rounded bg-[#222222] text-[#8A8A8A] border border-[#2C2C2C]">
                      <StatusIcon className="w-2.5 h-2.5" />
                      {statusIcons[task.status].label}
                    </span>
                    {task.priority && (
                      <span className="text-[10px] text-[#777777] uppercase">
                        • {task.priority}
                      </span>
                    )}
                  </div>
                  <h4 className="text-xs font-medium text-[#EDEDED] line-through decoration-[#555555] break-words">
                    {task.title}
                  </h4>
                  <p className="text-[11px] text-[#555555]">
                    Deleted {formatTimestamp(task.deletedAt || undefined)}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => restoreTask(task.id)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-[#CCCCCC] hover:text-white bg-[#222222] hover:bg-[#2A2A2A] border border-[#2F2F2F] rounded-md transition-colors cursor-pointer"
                    title="Restore task to previous column"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Restore</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTaskToDelete(task)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-md transition-colors cursor-pointer"
                    title="Delete permanently"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Single Task Permanently Confirmation Modal */}
      <AnimatePresence>
        {taskToDelete && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-perm-title"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs"
            onClick={() => {
              if (!isProcessing) setTaskToDelete(null);
            }}
          >
            <motion.div
              initial={prefersReduced ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={prefersReduced ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 6 }}
              transition={{ duration: 0.15 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#141414] border border-[#2B2B2B] rounded-xl p-5 max-w-sm w-full space-y-4 shadow-2xl"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2 text-rose-400">
                  <AlertTriangle className="w-5 h-5 shrink-0" />
                  <h3 id="delete-perm-title" className="text-sm font-semibold text-[#F5F5F5]">
                    Delete task permanently?
                  </h3>
                </div>
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => setTaskToDelete(null)}
                  className="p-1 text-[#666666] hover:text-[#F5F5F5] rounded transition-colors cursor-pointer"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-[#999999] leading-relaxed">
                <strong className="text-white font-medium">{taskToDelete.taskNumber}: {taskToDelete.title}</strong> will be permanently removed and cannot be restored.
              </p>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => setTaskToDelete(null)}
                  className="px-3 py-1.5 text-xs text-[#8A8A8A] hover:text-[#F5F5F5] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={handleConfirmPermanentDelete}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white rounded-md transition-colors cursor-pointer shadow-sm"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <span>Delete Permanently</span>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Empty Trash Confirmation Modal */}
      <AnimatePresence>
        {isEmptyTrashConfirmOpen && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="empty-trash-title"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs"
            onClick={() => {
              if (!isProcessing) setIsEmptyTrashConfirmOpen(false);
            }}
          >
            <motion.div
              initial={prefersReduced ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={prefersReduced ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 6 }}
              transition={{ duration: 0.15 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#141414] border border-[#2B2B2B] rounded-xl p-5 max-w-sm w-full space-y-4 shadow-2xl"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2 text-rose-400">
                  <AlertTriangle className="w-5 h-5 shrink-0" />
                  <h3 id="empty-trash-title" className="text-sm font-semibold text-[#F5F5F5]">
                    Empty Trash?
                  </h3>
                </div>
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => setIsEmptyTrashConfirmOpen(false)}
                  className="p-1 text-[#666666] hover:text-[#F5F5F5] rounded transition-colors cursor-pointer"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-[#999999] leading-relaxed">
                This will permanently remove all {trashTasks.length} deleted tasks. This action cannot be undone.
              </p>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => setIsEmptyTrashConfirmOpen(false)}
                  className="px-3 py-1.5 text-xs text-[#8A8A8A] hover:text-[#F5F5F5] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={handleConfirmEmptyTrash}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white rounded-md transition-colors cursor-pointer shadow-sm"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Emptying...</span>
                    </>
                  ) : (
                    <span>Empty Trash</span>
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
