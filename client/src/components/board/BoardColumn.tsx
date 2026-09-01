import React, { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Task, Status } from '../../types/task';
import { useTasks } from '../../context/TaskContext';
import { useUI } from '../../context/UIContext';
import { TaskCard } from './TaskCard';
import { Plus, Circle, Clock, CheckCircle2 } from 'lucide-react';
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

  const statusIcons: Record<Status, { icon: React.ComponentType<{ className?: string }>; color: string }> = {
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
        'flex flex-col flex-1 min-w-[280px] bg-[#0E0E0E] border border-[#1F1F1F] rounded-xl p-3 sm:p-4 space-y-3 transition-colors duration-150',
        isDragOver && 'border-[#404040] bg-[#141414]/80 ring-1 ring-[#404040]'
      )}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between pb-2 border-b border-[#1A1A1A]">
        <div className="flex items-center gap-2">
          <StatusIcon className={cn('w-4 h-4', statusIcons[status].color)} />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[#F5F5F5]">
            {title}
          </h3>
          <span className="font-mono text-xs text-[#707070] bg-[#181818] border border-[#242424] px-1.5 py-0.2 rounded">
            {tasks.length}
          </span>
        </div>

        <button
          type="button"
          onClick={() => openCreateTaskModal(status)}
          className="p-1 text-[#666666] hover:text-[#F5F5F5] hover:bg-[#1A1A1A] rounded transition-colors"
          title={`Add task to ${title}`}
          aria-label={`Add task to ${title}`}
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Task Cards List */}
      <div className="flex-1 overflow-y-auto space-y-2.5 min-h-[160px]">
        {tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-36 border border-dashed border-[#1E1E1E] rounded-lg text-center p-4 space-y-2">
            <span className="text-xs text-[#555555]">No tasks here</span>
            <button
              type="button"
              onClick={() => openCreateTaskModal(status)}
              className="text-xs text-[#8A8A8A] hover:text-[#F5F5F5] flex items-center gap-1 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Add task
            </button>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {tasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Bottom + New Task Action */}
      <button
        type="button"
        onClick={() => openCreateTaskModal(status)}
        className="w-full flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-medium text-[#7A7A7A] hover:text-[#F5F5F5] bg-[#121212] hover:bg-[#181818] border border-[#1E1E1E] hover:border-[#2C2C2C] rounded-lg transition-colors cursor-pointer"
      >
        <Plus className="w-3.5 h-3.5" />
        <span>New Task</span>
      </button>
    </div>
  );
};
