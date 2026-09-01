import React, { useMemo } from 'react';
import { useTasks } from '../../context/TaskContext';
import { useUI } from '../../context/UIContext';
import { Status, Task, SortOption } from '../../types/task';
import { BoardColumn } from './BoardColumn';
import { ArrowUpDown } from 'lucide-react';
import { cn } from '../../lib/utils';

const priorityWeight: Record<string, number> = {
  high: 3,
  medium: 2,
  low: 1,
};

function sortTasks(tasks: Task[], option: SortOption): Task[] {
  const cloned = [...tasks];
  if (option === 'manual') {
    return cloned.sort((a, b) => a.order - b.order);
  }
  if (option === 'priority') {
    return cloned.sort((a, b) => {
      const pA = priorityWeight[a.priority || ''] || 0;
      const pB = priorityWeight[b.priority || ''] || 0;
      if (pB !== pA) return pB - pA;
      return a.order - b.order;
    });
  }
  if (option === 'dueDate') {
    return cloned.sort((a, b) => {
      if (a.dueDate && b.dueDate) {
        return a.dueDate.localeCompare(b.dueDate);
      }
      if (a.dueDate) return -1;
      if (b.dueDate) return 1;
      return a.order - b.order;
    });
  }
  if (option === 'createdAt') {
    return cloned.sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }
  return cloned;
}

export const Board: React.FC = () => {
  const { tasksByStatus } = useTasks();
  const { searchQuery, mobileActiveTab, setMobileActiveTab, sortOption, setSortOption } = useUI();

  const columns: { id: Status; title: string }[] = [
    { id: 'todo', title: 'Todo' },
    { id: 'in-progress', title: 'In Progress' },
    { id: 'completed', title: 'Completed' },
  ];

  // In-memory instant client search filter over loaded user tasks + view sorting
  const filteredTasksByStatus = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    const filterFn = (task: Task) => {
      if (!q) return true;
      const matchTitle = task.title.toLowerCase().includes(q);
      const matchDesc = task.description?.toLowerCase().includes(q);
      const matchNumber = task.taskNumber.toLowerCase().includes(q);
      const matchTags = task.tags?.some((tag) => tag.toLowerCase().includes(q));
      return Boolean(matchTitle || matchDesc || matchNumber || matchTags);
    };

    return {
      todo: sortTasks(tasksByStatus.todo.filter(filterFn), sortOption),
      'in-progress': sortTasks(tasksByStatus['in-progress'].filter(filterFn), sortOption),
      completed: sortTasks(tasksByStatus.completed.filter(filterFn), sortOption),
    };
  }, [tasksByStatus, searchQuery, sortOption]);

  const isSearchActive = Boolean(searchQuery.trim());

  return (
    <div className="h-full flex flex-col min-h-0 space-y-3">
      {/* Top Bar: Mobile Tabs & Sort Selector */}
      <div className="shrink-0 flex items-center justify-between gap-3">
        {/* Mobile Tab Selector (< 768px) */}
        <div className="flex md:hidden flex-1 items-center bg-[#181818] border border-[#262626] rounded-lg p-1 gap-1">
          {columns.map((col) => {
            const isActive = mobileActiveTab === col.id;
            const count = filteredTasksByStatus[col.id].length;
            return (
              <button
                key={col.id}
                type="button"
                onClick={() => setMobileActiveTab(col.id)}
                className={cn(
                  'flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-xs font-medium transition-colors cursor-pointer',
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

        {/* View Sort Control */}
        <div className="ml-auto flex items-center gap-1.5 text-xs text-[#777777]">
          <ArrowUpDown className="w-3.5 h-3.5 text-[#666666]" />
          <span className="hidden sm:inline text-[11px]">Sort:</span>
          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value as SortOption)}
            className="bg-[#181818] hover:bg-[#1E1E1E] border border-[#262626] text-[11px] text-[#D1D1D1] rounded-md px-2 py-1 focus:outline-none transition-colors cursor-pointer"
            aria-label="Sort board tasks"
          >
            <option value="manual">Manual</option>
            <option value="priority">Priority</option>
            <option value="dueDate">Due Date</option>
            <option value="createdAt">Created Date</option>
          </select>
        </div>
      </div>

      {/* Desktop & Tablet 3-Column Seamless Layout */}
      <div className="flex-1 min-h-0 hidden md:grid md:grid-cols-3 gap-6 lg:gap-8">
        {columns.map((col) => (
          <BoardColumn
            key={col.id}
            status={col.id}
            title={col.title}
            tasks={filteredTasksByStatus[col.id]}
            isSearchActive={isSearchActive}
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
              tasks={filteredTasksByStatus[col.id]}
              isSearchActive={isSearchActive}
            />
          ))}
      </div>
    </div>
  );
};
