import React, { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Task, Status } from '../../types/task';
import { useTasks } from '../../context/TaskContext';
import { useUI } from '../../context/UIContext';
import { TaskCard } from './TaskCard';
import { Plus, Circle, Clock, CheckCircle2, ArrowUpRight } from 'lucide-react';
import { cn } from '../../lib/utils';

interface BoardColumnProps {
  status: Status;
  title: string;
  tasks: Task[];
}

export const BoardColumn: React.FC<BoardColumnProps> = ({ status, title, tasks }) => {
  const { moveTask } = useTasks();
  const { openCreateTaskModal } = useUI();
  const [isDragOver, setIsDragOver] = useState(false);

  const statusIcons: Record<
    Status,
    { icon: React.ComponentType<{ className?: string }>; color: string }
  > = {
    todo: { icon: Circle, color: 'text-[#8A8A8A]' },
    'in-progress': { icon: Clock, color: 'text-amber-400' },
    completed: { icon: CheckCircle2, color: 'text-emerald-400' },
  };

  const StatusIcon = statusIcons[status].icon;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (!isDragOver) setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const taskId = e.dataTransfer.getData('text/plain');
    if (taskId) {
      moveTask(taskId, status);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        'flex flex-col h-full max-h-full min-h-0 transition-colors duration-150 rounded-lg',
        isDragOver && 'bg-white/[0.02] ring-1 ring-[#333333]'
      )}
    >
      {/* Column Header (Fixed) */}
      <div className="shrink-0 flex items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <StatusIcon className={cn('w-4 h-4', statusIcons[status].color)} />
          <h3 className="text-sm font-semibold text-[#F5F5F5] tracking-tight">{title}</h3>
          <span className="font-mono text-xs text-[#707070]">{tasks.length}</span>
        </div>

        <div className="flex items-center gap-1 text-[#707070]">
          <button
            type="button"
            className="p-1 hover:text-[#F5F5F5] rounded transition-colors cursor-pointer"
            title="Expand column"
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => openCreateTaskModal(status)}
            className="p-1 hover:text-[#F5F5F5] rounded transition-colors cursor-pointer"
            title={`Add task to ${title}`}
            aria-label={`Add task to ${title}`}
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Top + New Work item button */}
      <div className="shrink-0 pb-3">
        <button
          type="button"
          onClick={() => openCreateTaskModal(status)}
          className="flex items-center gap-1.5 text-xs text-[#777777] hover:text-[#F5F5F5] transition-colors cursor-pointer py-1"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Work item</span>
        </button>
      </div>

      {/* Scrollable Task Cards Area */}
      <div className="flex-1 min-h-0 overflow-y-auto space-y-3 pr-1.5">
        <AnimatePresence mode="popLayout">
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};
