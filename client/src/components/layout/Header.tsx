import React from 'react';
import { useUI } from '../../context/UIContext';
import { ActiveView } from '../../types/task';
import { Plus, Kanban, Calendar, User } from 'lucide-react';
import { cn } from '../../lib/utils';

export const Header: React.FC = () => {
  const { activeView, setActiveView, openCreateTaskModal } = useUI();

  const navTabs: { id: ActiveView; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'board', label: 'Board', icon: Kanban },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-4 sm:px-8 py-3.5 bg-[#0A0A0A]/95 backdrop-blur-md border-b border-[#1A1A1A]">
      {/* Left: Brand + Navigation Tabs */}
      <div className="flex items-center gap-6 sm:gap-8">
        {/* Brand */}
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-white text-black font-bold text-[11px] flex items-center justify-center">
            F
          </div>
          <span className="font-bold text-xs sm:text-sm tracking-wider uppercase text-[#F5F5F5]">
            FocusFlow
          </span>
        </div>

        {/* Tabs */}
        <nav className="flex items-center gap-1">
          {navTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeView === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveView(tab.id)}
                className={cn(
                  'flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer',
                  isActive
                    ? 'bg-[#1C1C1C] text-[#F5F5F5] font-semibold'
                    : 'text-[#777777] hover:text-[#C0C0C0] hover:bg-[#141414]'
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Right: + New Task Button */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => openCreateTaskModal('todo')}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#F5F5F5] hover:bg-white text-black text-xs font-semibold rounded-md shadow-xs transition-colors cursor-pointer"
          title="Create task (N)"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">New Task</span>
          <kbd className="hidden sm:inline ml-1 px-1 py-0.2 text-[10px] font-mono text-[#555555] bg-black/10 rounded">
            N
          </kbd>
        </button>
      </div>
    </header>
  );
};
