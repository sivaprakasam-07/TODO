import React, { useState, useMemo } from 'react';
import { useTasks } from '../../context/TaskContext';
import { useUI, BoardFilter } from '../../context/UIContext';
import { calculateDailyFocusMetrics } from '../../lib/metrics';
import { Sparkles, ChevronDown, ChevronUp, Calendar, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { cn } from '../../lib/utils';

export const DailyFocusDashboard: React.FC = () => {
  const { tasks } = useTasks();
  const { boardFilter, setBoardFilter, setMobileActiveTab } = useUI();
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  // Compute metrics using pure timezone-safe logic
  const metrics = useMemo(() => {
    return calculateDailyFocusMetrics(tasks);
  }, [tasks]);

  const handleMetricClick = (filter: BoardFilter) => {
    if (boardFilter === filter) {
      setBoardFilter('all');
    } else {
      setBoardFilter(filter);
      if (filter === 'completedToday') {
        setMobileActiveTab('completed');
      }
    }
  };

  return (
    <div className="shrink-0 bg-[#111111] border border-[#222222] hover:border-[#2A2A2A] rounded-xl p-3 sm:p-3.5 transition-colors select-none">
      {/* Top Header Row: Title, Motivational Quote, Collapse Toggle */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#A1A1AA] flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Daily Focus
          </span>

          <span className="hidden sm:inline text-[#333333]">•</span>

          {/* Understated motivational quote */}
          <div className="hidden sm:flex items-center gap-1 text-[11px] text-[#71717A] truncate">
            <Sparkles className="w-3 h-3 text-[#A1A1AA]/60 shrink-0" />
            <span className="truncate">{metrics.motivationalMessage}</span>
          </div>
        </div>

        {/* Right side: Active filter badge & Collapse button */}
        <div className="flex items-center gap-2 shrink-0">
          {boardFilter !== 'all' && (
            <button
              type="button"
              onClick={() => setBoardFilter('all')}
              className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-[#222222] border border-[#333333] text-[#F4F4F5] hover:bg-[#2A2A2A] transition-colors cursor-pointer"
              title="Reset filter to show all tasks"
            >
              <span>Filtered: {boardFilter === 'dueToday' ? 'Due Today' : boardFilter === 'completedToday' ? 'Completed Today' : 'Overdue'}</span>
              <X className="w-3 h-3 text-[#A1A1AA]" />
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsCollapsed((prev) => !prev)}
            className="p-1 text-[#71717A] hover:text-[#EDEDED] hover:bg-[#1E1E1E] rounded transition-colors cursor-pointer"
            aria-label={isCollapsed ? 'Expand Daily Focus' : 'Collapse Daily Focus'}
            title={isCollapsed ? 'Expand Daily Focus' : 'Collapse Daily Focus'}
          >
            {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expandable Content Area */}
      {!isCollapsed && (
        <div className="mt-2.5 pt-2.5 border-t border-[#1C1C1C] flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Left: Metric Buttons */}
          <div className="grid grid-cols-3 gap-2 sm:gap-2.5 flex-1 max-w-lg">
            {/* Due Today */}
            <button
              type="button"
              onClick={() => handleMetricClick('dueToday')}
              className={cn(
                'flex flex-col items-start px-2.5 py-1.5 rounded-lg border transition-all text-left cursor-pointer',
                boardFilter === 'dueToday'
                  ? 'bg-[#1C1C1C] border-[#F5A524]/60 shadow-xs'
                  : 'bg-[#161616] border-[#242424] hover:border-[#333333] hover:bg-[#1A1A1A]'
              )}
            >
              <div className="flex items-center gap-1.5 text-[10px] text-[#A1A1AA] font-medium">
                <Calendar className="w-3 h-3 text-[#F5A524]" />
                <span>Due Today</span>
              </div>
              <span className="font-mono text-sm sm:text-base font-semibold text-[#F5F5F5] mt-0.5">
                {metrics.dueTodayCount}
              </span>
            </button>

            {/* Completed Today */}
            <button
              type="button"
              onClick={() => handleMetricClick('completedToday')}
              className={cn(
                'flex flex-col items-start px-2.5 py-1.5 rounded-lg border transition-all text-left cursor-pointer',
                boardFilter === 'completedToday'
                  ? 'bg-[#1C1C1C] border-emerald-500/60 shadow-xs'
                  : 'bg-[#161616] border-[#242424] hover:border-[#333333] hover:bg-[#1A1A1A]'
              )}
            >
              <div className="flex items-center gap-1.5 text-[10px] text-[#A1A1AA] font-medium">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span>Completed</span>
              </div>
              <span className="font-mono text-sm sm:text-base font-semibold text-[#F5F5F5] mt-0.5">
                {metrics.completedTodayCount}
              </span>
            </button>

            {/* Overdue */}
            <button
              type="button"
              onClick={() => handleMetricClick('overdue')}
              className={cn(
                'flex flex-col items-start px-2.5 py-1.5 rounded-lg border transition-all text-left cursor-pointer',
                boardFilter === 'overdue'
                  ? 'bg-[#1C1C1C] border-rose-500/60 shadow-xs'
                  : 'bg-[#161616] border-[#242424] hover:border-[#333333] hover:bg-[#1A1A1A]'
              )}
            >
              <div className="flex items-center gap-1.5 text-[10px] text-[#A1A1AA] font-medium">
                <AlertCircle className={cn('w-3 h-3', metrics.overdueCount > 0 ? 'text-rose-400' : 'text-[#71717A]')} />
                <span>Overdue</span>
              </div>
              <span
                className={cn(
                  'font-mono text-sm sm:text-base font-semibold mt-0.5',
                  metrics.overdueCount > 0 ? 'text-rose-400' : 'text-[#71717A]'
                )}
              >
                {metrics.overdueCount}
              </span>
            </button>
          </div>

          {/* Right: Daily Progress Ratio and Slim Progress Bar */}
          <div className="md:w-64 flex flex-col justify-center space-y-1.5 bg-[#161616] border border-[#222222] rounded-lg px-3 py-2">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-[#8A8A8A] font-medium">Daily Progress</span>
              <span className="font-mono font-semibold text-[#F5F5F5]">
                {metrics.hasTasksToday ? (
                  <>
                    <span>
                      {metrics.completedTodayCount}/{metrics.totalTodayCount}
                    </span>
                    <span className="text-[#71717A] text-[10px] ml-1.5">
                      ({metrics.completionPercentage}%)
                    </span>
                  </>
                ) : (
                  <span className="text-[#71717A] text-[10px]">No tasks due today</span>
                )}
              </span>
            </div>

            {/* Progress Bar */}
            <div
              className="w-full h-1.5 bg-[#262626] rounded-full overflow-hidden"
              role="progressbar"
              aria-valuenow={metrics.completionPercentage}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Daily task completion progress"
            >
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${metrics.completionPercentage}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
