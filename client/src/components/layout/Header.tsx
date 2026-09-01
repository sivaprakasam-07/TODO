import React, { useRef } from 'react';
import { useUI } from '../../context/UIContext';
import { ActiveView } from '../../types/task';
import { Plus, Kanban, Calendar, User, Search, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';

export const Header: React.FC = () => {
  const {
    activeView,
    setActiveView,
    openCreateTaskModal,
    searchQuery,
    setSearchQuery,
  } = useUI();

  const searchInputRef = useRef<HTMLInputElement>(null);
  useKeyboardShortcuts(searchInputRef);

  const navTabs: { id: ActiveView; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'board', label: 'Board', icon: Kanban },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-3 px-3 sm:px-6 py-2.5 bg-[#141414]/95 backdrop-blur-md border-b border-[#222222]">
      {/* Left: Brand + Navigation Tabs */}
      <div className="flex items-center gap-3 sm:gap-6">
        {/* Brand */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-5 h-5 rounded bg-white text-black font-bold text-[11px] flex items-center justify-center">
            F
          </div>
          <span className="font-bold text-xs sm:text-sm tracking-wider uppercase text-[#F5F5F5] hidden xs:inline">
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
                  'flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer',
                  isActive
                    ? 'bg-[#222222] text-[#F5F5F5] font-semibold'
                    : 'text-[#777777] hover:text-[#C0C0C0] hover:bg-[#1A1A1A]'
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Center/Right: Search Bar */}
      <div className="flex-1 max-w-xs sm:max-w-sm mx-1 sm:mx-4">
        <div className="relative flex items-center">
          <Search className="absolute left-2.5 w-3.5 h-3.5 text-[#666666] pointer-events-none" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tasks..."
            aria-label="Search tasks"
            className="w-full bg-[#181818] hover:bg-[#1C1C1C] focus:bg-[#1C1C1C] text-xs text-[#EDEDED] placeholder-[#555555] border border-[#262626] focus:border-[#444444] rounded-md pl-8 pr-8 py-1.5 focus:outline-none transition-colors"
          />
          {searchQuery ? (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2 p-0.5 text-[#666666] hover:text-[#EDEDED] rounded transition-colors"
              title="Clear search"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <kbd className="hidden sm:flex absolute right-2 px-1 py-0.2 text-[10px] font-mono text-[#555555] bg-[#222222] border border-[#2E2E2E] rounded pointer-events-none items-center justify-center">
              /
            </kbd>
          )}
        </div>
      </div>

      {/* Right: + New Task Button */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={() => openCreateTaskModal('todo')}
          className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-[#F5F5F5] hover:bg-white text-black text-xs font-semibold rounded-md shadow-xs transition-colors cursor-pointer"
          title="Create task (N)"
          aria-label="New Task"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">New Task</span>
          <kbd className="hidden md:inline ml-1 px-1 py-0.2 text-[10px] font-mono text-[#555555] bg-black/10 rounded">
            N
          </kbd>
        </button>
      </div>
    </header>
  );
};
