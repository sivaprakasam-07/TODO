import React, { useState, useMemo } from 'react';
import { useTasks } from '../../context/TaskContext';
import { calculateProductivityInsights } from '../../lib/metrics';
import {
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Award,
  CheckCircle2,
  Calendar,
  Info,
} from 'lucide-react';
import { cn } from '../../lib/utils';

export const ProductivityInsights: React.FC = () => {
  const { tasks } = useTasks();
  const [weekOffset, setWeekOffset] = useState<number>(0);

  const insights = useMemo(() => {
    return calculateProductivityInsights(tasks, weekOffset);
  }, [tasks, weekOffset]);

  const handlePrevWeek = () => setWeekOffset((prev) => prev - 1);
  const handleNextWeek = () => setWeekOffset((prev) => Math.min(0, prev + 1));
  const handleCurrentWeek = () => setWeekOffset(0);

  const isCurrentWeek = weekOffset === 0;

  return (
    <div className="bg-[#0E0E0E] border border-[#1F1F1F] rounded-xl p-4 sm:p-5 space-y-4 text-[#F5F5F5] select-none">
      {/* Header & Week Navigation Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#1A1A1A] gap-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-semibold text-[#F5F5F5]">Productivity Insights</h3>
          <span className="text-[11px] font-mono text-[#8A8A8A] bg-[#161616] border border-[#222222] px-2 py-0.5 rounded-md">
            {insights.weekRangeLabel}
          </span>
        </div>

        {/* Period Selector (Prev, Current, Next) */}
        <div className="flex items-center gap-1.5 self-end sm:self-auto">
          {!isCurrentWeek && (
            <button
              type="button"
              onClick={handleCurrentWeek}
              className="flex items-center gap-1 px-2 py-1 text-[11px] text-[#A1A1AA] hover:text-[#F5F5F5] bg-[#161616] hover:bg-[#1F1F1F] border border-[#262626] rounded transition-colors cursor-pointer"
              title="Return to current week"
            >
              <RotateCcw className="w-3 h-3" />
              <span>This Week</span>
            </button>
          )}

          <button
            type="button"
            onClick={handlePrevWeek}
            className="p-1 text-[#71717A] hover:text-[#F5F5F5] hover:bg-[#1A1A1A] rounded transition-colors cursor-pointer"
            aria-label="Previous week"
            title="Previous week"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleNextWeek}
            disabled={isCurrentWeek}
            className={cn(
              'p-1 rounded transition-colors',
              isCurrentWeek
                ? 'text-[#333333] cursor-not-allowed'
                : 'text-[#71717A] hover:text-[#F5F5F5] hover:bg-[#1A1A1A] cursor-pointer'
            )}
            aria-label="Next week"
            title="Next week"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        {/* Completed Today */}
        <div className="bg-[#121212] border border-[#1C1C1C] rounded-lg p-3 flex flex-col justify-between">
          <div className="flex items-center gap-1.5 text-[11px] text-[#8A8A8A] font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Completed Today</span>
          </div>
          <span className="font-mono text-xl font-bold text-[#F5F5F5] mt-1.5">
            {insights.completedTodayCount}
          </span>
        </div>

        {/* Completed This Week */}
        <div className="bg-[#121212] border border-[#1C1C1C] rounded-lg p-3 flex flex-col justify-between">
          <div className="flex items-center gap-1.5 text-[11px] text-[#8A8A8A] font-medium">
            <Calendar className="w-3.5 h-3.5 text-sky-400" />
            <span>{isCurrentWeek ? 'This Week' : 'Selected Week'}</span>
          </div>
          <span className="font-mono text-xl font-bold text-[#F5F5F5] mt-1.5">
            {insights.completedThisWeekCount}
          </span>
        </div>

        {/* Completion Rate */}
        <div className="bg-[#121212] border border-[#1C1C1C] rounded-lg p-3 flex flex-col justify-between">
          <div className="flex items-center gap-1.5 text-[11px] text-[#8A8A8A] font-medium">
            <TrendingUp className="w-3.5 h-3.5 text-[#F5A524]" />
            <span>Completion Rate</span>
          </div>
          <span className="font-mono text-xl font-bold text-[#F5F5F5] mt-1.5">
            {insights.hasEligibleTasks ? `${insights.completionRatePercentage}%` : '—'}
          </span>
        </div>

        {/* Most Productive Day */}
        <div className="bg-[#121212] border border-[#1C1C1C] rounded-lg p-3 flex flex-col justify-between">
          <div className="flex items-center gap-1.5 text-[11px] text-[#8A8A8A] font-medium">
            <Award className="w-3.5 h-3.5 text-amber-400" />
            <span>Most Productive</span>
          </div>
          <span className="text-xs font-semibold text-[#F5F5F5] mt-1.5 truncate">
            {insights.mostProductiveDayLabel}
          </span>
        </div>
      </div>

      {/* Weekly Activity Bar Chart */}
      <div className="bg-[#121212] border border-[#1C1C1C] rounded-lg p-3.5 space-y-3">
        <div className="flex items-center justify-between text-xs text-[#8A8A8A]">
          <span className="font-medium">Daily Activity</span>
          <span className="text-[11px] font-mono">
            {insights.completedThisWeekCount} task{insights.completedThisWeekCount === 1 ? '' : 's'} completed
          </span>
        </div>

        {/* Bar chart grid: 7 columns (Mon - Sun) */}
        <div className="grid grid-cols-7 gap-1.5 sm:gap-3 h-28 items-end pt-4 pb-1 border-b border-[#1E1E1E]">
          {insights.weeklyActivity.map((day) => {
            const heightPercent =
              day.completionCount > 0
                ? Math.max(18, Math.round((day.completionCount / insights.maxDailyCompletions) * 100))
                : 4;

            return (
              <div
                key={day.dateStr}
                className="flex flex-col items-center justify-end h-full group cursor-default relative"
              >
                {/* Floating tooltip on hover */}
                <div className="absolute -top-7 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none bg-[#242424] border border-[#333333] text-[10px] font-mono px-1.5 py-0.5 rounded shadow-sm whitespace-nowrap z-10 text-[#F5F5F5]">
                  {day.completionCount} completed ({day.dateStr})
                </div>

                {/* Completion count label on top of bar */}
                {day.completionCount > 0 && (
                  <span className="text-[10px] font-mono text-[#A1A1AA] mb-1 font-semibold">
                    {day.completionCount}
                  </span>
                )}

                {/* Visual Bar */}
                <div
                  className={cn(
                    'w-full max-w-[28px] sm:max-w-[36px] rounded-t transition-all duration-300',
                    day.completionCount > 0
                      ? day.isToday
                        ? 'bg-emerald-400 group-hover:bg-emerald-300'
                        : 'bg-emerald-600/80 group-hover:bg-emerald-500'
                      : 'bg-[#1C1C1C]'
                  )}
                  style={{ height: `${heightPercent}%` }}
                />
              </div>
            );
          })}
        </div>

        {/* Day of Week Labels Row */}
        <div className="grid grid-cols-7 gap-1.5 sm:gap-3 text-center text-[10px] font-medium text-[#71717A]">
          {insights.weeklyActivity.map((day) => (
            <div
              key={day.dateStr}
              className={cn(
                'py-0.5 rounded',
                day.isToday && 'text-emerald-400 font-semibold bg-emerald-500/10'
              )}
            >
              <span>{day.dayLabel}</span>
              <span className="block text-[9px] text-[#52525B]">{day.dayNum}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Historical Data Disclaimer / Information Banner */}
      {insights.legacyCompletedCountWithoutTimestamp > 0 && (
        <div className="flex items-start gap-2 text-[11px] text-[#71717A] bg-[#121212] border border-[#1A1A1A] rounded-lg p-2.5">
          <Info className="w-3.5 h-3.5 text-[#A1A1AA] shrink-0 mt-0.5" />
          <span>
            {insights.legacyCompletedCountWithoutTimestamp} legacy task
            {insights.legacyCompletedCountWithoutTimestamp === 1 ? '' : 's'} completed prior to timestamp tracking{' '}
            {insights.legacyCompletedCountWithoutTimestamp === 1 ? 'is' : 'are'} counted in your total history ({insights.totalHistoricalCompletedCount} completed all-time) but excluded from daily charts.
          </span>
        </div>
      )}
    </div>
  );
};
