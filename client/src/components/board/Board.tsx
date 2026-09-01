import React, { useState } from 'react';
import { useTasks } from '../../context/TaskContext';
import { Status } from '../../types/task';
import { BoardColumn } from './BoardColumn';
import { cn } from '../../lib/utils';

export const Board: React.FC = () => {
  const { tasksByStatus } = useTasks();
  const [mobileActiveTab, setMobileActiveTab] = useState<Status>('todo');

  const columns: { id: Status; title: string }[] = [
    { id: 'todo', title: 'Todo' },
    { id: 'in-progress', title: 'In Progress' },
    { id: 'completed', title: 'Completed' },
  ];

  return (
    <div className="space-y-4">
      {/* Mobile Tab Selector (< 768px) */}
      <div className="flex md:hidden items-center bg-[#121212] border border-[#222222] rounded-lg p-1 gap-1">
        {columns.map((col) => {
          const isActive = mobileActiveTab === col.id;
          const count = tasksByStatus[col.id].length;
          return (
            <button
              key={col.id}
              type="button"
              onClick={() => setMobileActiveTab(col.id)}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-xs font-medium transition-colors',
                isActive
                  ? 'bg-[#222222] text-[#F5F5F5] font-semibold'
                  : 'text-[#7A7A7A] hover:text-[#B5B5B5]'
              )}
            >
              <span>{col.title}</span>
              <span className="font-mono text-[11px] text-[#555555]">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Desktop & Tablet 3-Column Layout */}
      <div className="hidden md:grid md:grid-cols-3 gap-4 lg:gap-6 items-start">
        {columns.map((col) => (
          <BoardColumn
            key={col.id}
            status={col.id}
            title={col.title}
            tasks={tasksByStatus[col.id]}
          />
        ))}
      </div>

      {/* Mobile Single-Column Active Tab View */}
      <div className="block md:hidden">
        {columns
          .filter((col) => col.id === mobileActiveTab)
          .map((col) => (
            <BoardColumn
              key={col.id}
              status={col.id}
              title={col.title}
              tasks={tasksByStatus[col.id]}
            />
          ))}
      </div>
    </div>
  );
};
