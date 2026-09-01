import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Task, Status } from '../../types/task';
import { useUI } from '../../context/UIContext';
import { TaskMenu } from './TaskMenu';
import { formatDueDate, cn } from '../../lib/utils';
import { Calendar, Circle, Clock, CheckCircle2 } from 'lucide-react';
import { useReducedMotion } from '../../hooks/useReducedMotion';

interface TaskCardProps {
  task: Task;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task }) => {
  const { setSelectedTaskId } = useUI();
  const [isDragging, setIsDragging] = useState(false);
  const prefersReduced = useReducedMotion();

  const isCompleted = task.status === 'completed';
  const dueDateInfo = formatDueDate(task.dueDate);

  const priorityStyles = {
    high: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    medium: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    low: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  };

  const statusIcons: Record<Status, { icon: React.ComponentType<{ className?: string }>; label: string; color: string }> = {
    todo: { icon: Circle, label: 'Todo', color: 'text-[#8A8A8A]' },
    'in-progress': { icon: Clock, label: 'In Progress', color: 'text-amber-400' },
    completed: { icon: CheckCircle2, label: 'Done', color: 'text-emerald-400' },
  };

  const StatusIcon = statusIcons[task.status].icon;

  const handleNativeDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    setIsDragging(true);
    e.dataTransfer.setData('text/plain', task.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleNativeDragEnd = () => {
    setIsDragging(false);
  };

  return (
    <motion.div
      layout={!prefersReduced}
      initial={prefersReduced ? { opacity: 0 } : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={prefersReduced ? { opacity: 0 } : { opacity: 0, scale: 0.98, transition: { duration: 0.1 } }}
      transition={prefersReduced ? { duration: 0 } : { duration: 0.15, ease: 'easeOut' }}
    >
      <div
        draggable
        onDragStart={handleNativeDragStart}
        onDragEnd={handleNativeDragEnd}
        onClick={() => setSelectedTaskId(task.id)}
        className={cn(
          'group relative bg-[#141414] hover:bg-[#181818] border border-[#222222] hover:border-[#303030] rounded-lg p-3.5 space-y-2.5 transition-all duration-150 cursor-pointer select-none',
          isDragging && 'opacity-40 border-dashed border-neutral-500 scale-[0.99]',
          isCompleted && 'bg-[#101010] border-[#1C1C1C]'
        )}
      >
        {/* Top Header: Task ID & Three-dot Menu */}
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-[11px] font-semibold text-[#666666] tracking-wider uppercase">
            {task.taskNumber}
          </span>
          <TaskMenu taskId={task.id} currentStatus={task.status} />
        </div>

        {/* Task Title */}
        <h4
          className={cn(
            'text-[13px] font-medium text-[#EDEDED] group-hover:text-white leading-snug break-words transition-colors',
            isCompleted && 'line-through text-[#666666]'
          )}
        >
          {task.title}
        </h4>

        {/* Metadata Controls Row */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          {/* Status Chip */}
          <span
            className={cn(
              'inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-[#1A1A1A] border border-[#262626] font-medium select-none',
              statusIcons[task.status].color
            )}
          >
            <StatusIcon className="w-3 h-3" />
            <span>{statusIcons[task.status].label}</span>
          </span>

          {/* Priority Badge */}
          {task.priority && (
            <span
              className={cn(
                'inline-flex items-center text-[11px] px-2 py-0.5 rounded border font-medium capitalize select-none',
                priorityStyles[task.priority]
              )}
            >
              {task.priority}
            </span>
          )}

          {/* Due Date Chip */}
          {task.dueDate && dueDateInfo.label && (
            <span
              className={cn(
                'inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded border font-medium select-none',
                dueDateInfo.isOverdue
                  ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                  : dueDateInfo.isToday
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  : 'bg-[#1A1A1A] text-[#8A8A8A] border-[#262626]'
              )}
            >
              <Calendar className="w-3 h-3" />
              {dueDateInfo.label}
            </span>
          )}

          {/* Tags */}
          {task.tags &&
            task.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center text-[11px] px-2 py-0.5 rounded bg-[#181818] border border-[#262626] text-[#7A7A7A] font-medium"
              >
                #{tag}
              </span>
            ))}
        </div>
      </div>
    </motion.div>
  );
};
