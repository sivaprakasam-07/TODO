import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Task, Status } from '../../types/task';
import { useUI } from '../../context/UIContext';
import { useTasks } from '../../context/TaskContext';
import { useAuth } from '../../context/AuthContext';
import { TaskMenu } from './TaskMenu';
import { formatDueDate, cn } from '../../lib/utils';
import {
  Calendar,
  Circle,
  Clock,
  CheckCircle2,
  Paperclip,
  CircleSlash,
  Timer,
  LayoutGrid,
} from 'lucide-react';
import { useReducedMotion } from '../../hooks/useReducedMotion';

interface TaskCardProps {
  task: Task;
  index?: number;
  onDropOnTask?: (draggedTaskId: string, targetTaskId: string) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, onDropOnTask }) => {
  const { setSelectedTaskId } = useUI();
  const { user } = useTasks();
  const { user: authUser } = useAuth();
  const [isDragging, setIsDragging] = useState(false);
  const [isOverCard, setIsOverCard] = useState(false);
  const prefersReduced = useReducedMotion();

  const isCompleted = task.status === 'completed';
  const dueDateInfo = formatDueDate(task.dueDate);

  const statusIcons: Record<
    Status,
    { icon: React.ComponentType<{ className?: string }>; label: string; color: string }
  > = {
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

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    if (!isOverCard) setIsOverCard(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOverCard(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOverCard(false);
    const draggedId = e.dataTransfer.getData('text/plain');
    if (draggedId && onDropOnTask) {
      onDropOnTask(draggedId, task.id);
    }
  };

  const tagColors = ['bg-rose-500', 'bg-sky-500', 'bg-amber-500', 'bg-emerald-500', 'bg-purple-500'];
  const creatorName = task.createdBy || authUser?.displayName || user.name || 'User';
  const creatorInitial = creatorName.charAt(0).toUpperCase() || 'S';
  const creatorPhoto = task.createdByPhotoURL || (task.createdByUid === authUser?.uid ? authUser?.photoURL : undefined);

  return (
    <motion.div
      layout={!prefersReduced}
      initial={prefersReduced ? { opacity: 0 } : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={
        prefersReduced
          ? { opacity: 0 }
          : { opacity: 0, scale: 0.98, transition: { duration: 0.1 } }
      }
      transition={prefersReduced ? { duration: 0 } : { duration: 0.15, ease: 'easeOut' }}
    >
      <div
        draggable
        onDragStart={handleNativeDragStart}
        onDragEnd={handleNativeDragEnd}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => setSelectedTaskId(task.id)}
        className={cn(
          'group relative bg-[#1A1A1A] hover:bg-[#202020] border border-[#262626] hover:border-[#333333] rounded-lg p-3.5 space-y-2.5 transition-all duration-150 cursor-pointer select-none shadow-xs',
          isDragging && 'opacity-30 border-dashed border-neutral-400 scale-[0.99]',
          isOverCard && 'border-t-2 border-t-[#EDEDED] bg-[#222222]',
          isCompleted && 'bg-[#151515] border-[#222222]'
        )}
      >
        {/* Top Header: Task ID & Three-dot Menu */}
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-xs font-semibold text-[#666666] tracking-wide uppercase">
            {task.taskNumber}
          </span>
          <TaskMenu taskId={task.id} currentStatus={task.status} />
        </div>

        {/* Task Title */}
        <h4
          className={cn(
            'text-[13px] font-semibold text-[#EDEDED] group-hover:text-white leading-snug break-words transition-colors',
            isCompleted && 'line-through text-[#666666]'
          )}
        >
          {task.title}
        </h4>

        {/* Metadata Controls Icon Strip */}
        <div className="flex flex-wrap items-center gap-1.5 pt-0.5 text-xs text-[#8A8A8A]">
          {/* Status Chip */}
          <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-[#242424] border border-[#2F2F2F] text-[#A5A5A5] font-medium select-none">
            <StatusIcon className={cn('w-3 h-3', statusIcons[task.status].color)} />
            <span>{statusIcons[task.status].label}</span>
          </span>

          {/* Priority / Blocked Chip */}
          {task.priority ? (
            <span
              className={cn(
                'inline-flex items-center p-1 rounded bg-[#242424] border border-[#2F2F2F] text-[11px] select-none',
                task.priority === 'high'
                  ? 'text-rose-400 border-rose-500/20 bg-rose-500/10'
                  : task.priority === 'medium'
                  ? 'text-amber-400 border-amber-500/20 bg-amber-500/10'
                  : 'text-slate-400 border-slate-500/20 bg-slate-500/10'
              )}
              title={`Priority: ${task.priority}`}
            >
              <CircleSlash className="w-3 h-3" />
            </span>
          ) : (
            <span
              className="inline-flex items-center p-1 rounded bg-[#242424] border border-[#2F2F2F] text-[#666666]"
              title="No priority set"
            >
              <CircleSlash className="w-3 h-3" />
            </span>
          )}

          {/* Timer estimate icon */}
          <span className="inline-flex items-center p-1 rounded bg-[#242424] border border-[#2F2F2F] text-[#666666]">
            <Timer className="w-3 h-3" />
          </span>

          {/* Due Date Chip */}
          {task.dueDate && (
            <span
              className={cn(
                'inline-flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded bg-[#242424] border border-[#2F2F2F] select-none',
                dueDateInfo.isOverdue
                  ? 'text-rose-400 border-rose-500/30 bg-rose-500/10'
                  : dueDateInfo.isToday
                  ? 'text-amber-400 border-amber-500/30 bg-amber-500/10'
                  : dueDateInfo.isTomorrow
                  ? 'text-sky-400 border-sky-500/30 bg-sky-500/10'
                  : 'text-[#999999]'
              )}
              title={`Due: ${task.dueDate}`}
            >
              <Calendar className="w-3 h-3" />
              {dueDateInfo.label && <span className="text-[10px]">{dueDateInfo.label}</span>}
            </span>
          )}

          {/* Assignee / Creator Avatar Circle with name tooltip */}
          <div
            className="w-5 h-5 rounded-full bg-teal-600 text-white font-bold text-[10px] flex items-center justify-center border border-white/10 overflow-hidden shrink-0"
            title={`Created by ${creatorName}`}
          >
            {creatorPhoto ? (
              <img
                src={creatorPhoto}
                alt={creatorName}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <span>{creatorInitial}</span>
            )}
          </div>

          {/* Grid View icon */}
          <span className="inline-flex items-center p-1 rounded bg-[#242424] border border-[#2F2F2F] text-[#666666]">
            <LayoutGrid className="w-3 h-3" />
          </span>

          {/* Attachments Counter */}
          <span className="inline-flex items-center gap-0.5 text-[11px] text-[#666666] pl-0.5">
            <Paperclip className="w-3 h-3" />
            <span>1</span>
          </span>
        </div>

        {/* Tags with indicator dot */}
        {task.tags && task.tags.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
            {task.tags.map((tag, idx) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1.5 text-[11px] px-2 py-0.5 rounded-md bg-[#242424] border border-[#2F2F2F] text-[#CCCCCC] font-medium"
              >
                <span
                  className={cn(
                    'w-1.5 h-1.5 rounded-full shrink-0',
                    tagColors[idx % tagColors.length]
                  )}
                />
                <span>{tag}</span>
              </span>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};
