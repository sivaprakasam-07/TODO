import React, { useState, useRef, useEffect } from 'react';
import { Status } from '../../types/task';
import { useTasks } from '../../context/TaskContext';
import { useUI } from '../../context/UIContext';
import { MoreHorizontal, Edit2, Trash2, Circle, Clock, CheckCircle2 } from 'lucide-react';
import { cn } from '../../lib/utils';

interface TaskMenuProps {
  taskId: string;
  currentStatus: Status;
}

export const TaskMenu: React.FC<TaskMenuProps> = ({ taskId, currentStatus }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { moveTask, deleteTask } = useTasks();
  const { setSelectedTaskId } = useUI();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(false);
    setSelectedTaskId(taskId);
  };

  const handleMove = (e: React.MouseEvent, newStatus: Status) => {
    e.stopPropagation();
    setIsOpen(false);
    moveTask(taskId, newStatus);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(false);
    deleteTask(taskId);
  };

  const statusOptions: { id: Status; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'todo', label: 'Move to Todo', icon: Circle },
    { id: 'in-progress', label: 'Move to In Progress', icon: Clock },
    { id: 'completed', label: 'Move to Completed', icon: CheckCircle2 },
  ];

  return (
    <div className="relative" ref={menuRef} onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen((prev) => !prev);
        }}
        className={cn(
          'p-1 text-[#666666] hover:text-[#F5F5F5] hover:bg-[#222222] rounded transition-colors',
          isOpen && 'text-[#F5F5F5] bg-[#222222]'
        )}
        aria-label="Task options"
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 z-50 w-44 bg-[#181818] border border-[#2B2B2B] rounded-lg shadow-xl py-1 text-xs text-[#E5E5E5] animate-in fade-in zoom-in-95 duration-100">
          <button
            type="button"
            onClick={handleEdit}
            className="w-full flex items-center gap-2.5 px-3 py-1.5 hover:bg-[#242424] hover:text-white text-left transition-colors"
          >
            <Edit2 className="w-3.5 h-3.5 text-[#8A8A8A]" />
            <span>Edit Details</span>
          </button>

          <div className="my-1 border-t border-[#262626]" />

          {statusOptions
            .filter((opt) => opt.id !== currentStatus)
            .map((opt) => {
              const Icon = opt.icon;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={(e) => handleMove(e, opt.id)}
                  className="w-full flex items-center gap-2.5 px-3 py-1.5 hover:bg-[#242424] hover:text-white text-left transition-colors text-[#A0A0A0]"
                >
                  <Icon className="w-3.5 h-3.5 text-[#707070]" />
                  <span>{opt.label}</span>
                </button>
              );
            })}

          <div className="my-1 border-t border-[#262626]" />

          <button
            type="button"
            onClick={handleDelete}
            className="w-full flex items-center gap-2.5 px-3 py-1.5 hover:bg-rose-500/10 text-rose-400 hover:text-rose-300 text-left transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Task</span>
          </button>
        </div>
      )}
    </div>
  );
};
