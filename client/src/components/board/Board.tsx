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
    <div className="h-full flex flex-col min-h-0 space-y-4">
      {/* Mobile Tab Selector (< 768px) */}
      <div className="shrink-0 flex md:hidden items-center bg-[#181818] border border-[#262626] rounded-lg p-1 gap-1">
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
                  ? 'bg-[#262626] text-[#F5F5F5] font-semibold'
                  : 'text-[#777777] hover:text-[#B5B5B5]'
              )}
            >
              <span>{col.title}</span>
              <span className="font-mono text-[11px] text-[#555555]">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Desktop & Tablet 3-Column Seamless Layout */}
      <div className="flex-1 min-h-0 hidden md:grid md:grid-cols-3 gap-6 lg:gap-8">
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
      <div className="flex-1 min-h-0 block md:hidden h-full">
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
