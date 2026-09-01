import React, { useState, useMemo } from 'react';
import { useTasks } from '../../context/TaskContext';
import { getCalendarMonthDays } from '../../lib/utils';
import { TaskCard } from '../board/TaskCard';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Plus } from 'lucide-react';
import { useUI } from '../../context/UIContext';
import { cn } from '../../lib/utils';

export const CalendarView: React.FC = () => {
  const { tasks } = useTasks();
  const { openCreateTaskModal } = useUI();

  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string>(
    () => new Date().toISOString().split('T')[0]
  );

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthName = new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
  }).format(currentDate);

  const calendarDays = useMemo(() => {
    return getCalendarMonthDays(year, month);
  }, [year, month]);

  // Map of date string -> tasks due on that date
  const tasksByDate = useMemo(() => {
    const map: Record<string, typeof tasks> = {};
    tasks
      .filter((t) => !t.deletedAt && t.dueDate)
      .forEach((t) => {
        if (!map[t.dueDate!]) {
          map[t.dueDate!] = [];
        }
        map[t.dueDate!].push(t);
      });
    return map;
  }, [tasks]);

  const selectedDateTasks = useMemo(() => {
    return tasks.filter((t) => !t.deletedAt && t.dueDate === selectedDateStr);
  }, [tasks, selectedDateStr]);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    const now = new Date();
    setCurrentDate(now);
    setSelectedDateStr(now.toISOString().split('T')[0]);
  };

  const dayHeaders = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const formattedSelectedDate = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(`${selectedDateStr}T00:00:00`));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-6xl">
      {/* Left 2 Cols: Month Calendar Grid */}
      <div className="lg:col-span-2 bg-[#0E0E0E] border border-[#1F1F1F] rounded-xl p-4 sm:p-5 space-y-4">
        {/* Month Navigation Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#1A1A1A]">
          <div className="flex items-center gap-2.5">
            <CalendarIcon className="w-4 h-4 text-[#8A8A8A]" />
            <h3 className="text-sm font-semibold text-[#F5F5F5]">{monthName}</h3>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleToday}
              className="px-2.5 py-1 text-xs text-[#8A8A8A] hover:text-[#F5F5F5] bg-[#161616] hover:bg-[#1C1C1C] border border-[#222222] rounded transition-colors"
            >
              Today
            </button>
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1 text-[#666666] hover:text-[#F5F5F5] hover:bg-[#1A1A1A] rounded transition-colors"
              aria-label="Previous month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1 text-[#666666] hover:text-[#F5F5F5] hover:bg-[#1A1A1A] rounded transition-colors"
              aria-label="Next month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Day Header Row */}
        <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold uppercase tracking-wider text-[#555555]">
          {dayHeaders.map((day) => (
            <div key={day} className="py-1">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
          {calendarDays.map((calDay) => {
            const hasTasks = (tasksByDate[calDay.dateString]?.length || 0) > 0;
            const isSelected = selectedDateStr === calDay.dateString;

            return (
              <button
                key={calDay.dateString}
                type="button"
                onClick={() => setSelectedDateStr(calDay.dateString)}
                className={cn(
                  'relative h-12 sm:h-16 flex flex-col items-center justify-start pt-1.5 rounded-lg border text-xs transition-colors cursor-pointer',
                  isSelected
                    ? 'bg-[#1C1C1C] border-[#444444] text-[#F5F5F5] font-semibold shadow-xs'
                    : calDay.isCurrentMonth
                    ? 'bg-[#121212] border-[#1C1C1C] text-[#C0C0C0] hover:border-[#2C2C2C] hover:bg-[#161616]'
                    : 'bg-[#0B0B0B] border-transparent text-[#444444] hover:text-[#777777]',
                  calDay.isToday && !isSelected && 'border-[#303030] text-[#F5F5F5]'
                )}
              >
                <span>{calDay.date.getDate()}</span>

                {/* Task Indicator Dot */}
                {hasTasks && (
                  <span className="mt-1 w-1.5 h-1.5 rounded-full bg-emerald-400" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Right Col: Selected Date Agenda */}
      <div className="bg-[#0E0E0E] border border-[#1F1F1F] rounded-xl p-4 sm:p-5 flex flex-col space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#1A1A1A]">
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#777777]">
              Agenda
            </h4>
            <p className="text-xs font-medium text-[#EDEDED] mt-0.5">
              {formattedSelectedDate}
            </p>
          </div>

          <button
            type="button"
            onClick={() => openCreateTaskModal('todo')}
            className="p-1 text-[#666666] hover:text-[#F5F5F5] hover:bg-[#1A1A1A] rounded transition-colors"
            title="New task"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Tasks list on selected date */}
        <div className="flex-1 overflow-y-auto space-y-2.5 min-h-[200px]">
          {selectedDateTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 border border-dashed border-[#1E1E1E] rounded-lg text-center p-4 space-y-2">
              <span className="text-xs text-[#555555]">No tasks due on this date</span>
              <button
                type="button"
                onClick={() => openCreateTaskModal('todo')}
                className="text-xs text-[#8A8A8A] hover:text-[#F5F5F5] flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Add task
              </button>
            </div>
          ) : (
            selectedDateTasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))
          )}
        </div>
      </div>
    </div>
  );
};
