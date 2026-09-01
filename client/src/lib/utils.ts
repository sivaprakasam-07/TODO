import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Task } from '../types/task';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
}

/**
 * Computes the next readable task number (e.g. "TASK-007")
 */
export function getNextTaskNumber(existingTasks: Task[]): string {
  let maxNum = 0;
  existingTasks.forEach((t) => {
    const match = t.taskNumber?.match(/TASK-(\d+)/i);
    if (match) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && num > maxNum) {
        maxNum = num;
      }
    }
  });
  const nextNum = maxNum + 1;
  return `TASK-${String(nextNum).padStart(3, '0')}`;
}

/**
 * Formats a due date into a human readable string ("Today", "Tomorrow", "Jun 29", or "2d overdue")
 */
export function formatDueDate(dateStr?: string): {
  label: string;
  isOverdue: boolean;
  isToday: boolean;
} {
  if (!dateStr) {
    return { label: '', isOverdue: false, isToday: false };
  }

  const target = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const targetDateOnly = new Date(target);
  targetDateOnly.setHours(0, 0, 0, 0);

  const diffTime = targetDateOnly.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return { label: 'Today', isOverdue: false, isToday: true };
  } else if (diffDays === 1) {
    return { label: 'Tomorrow', isOverdue: false, isToday: false };
  } else if (diffDays === -1) {
    return { label: 'Yesterday', isOverdue: true, isToday: false };
  } else if (diffDays < 0) {
    return {
      label: `${Math.abs(diffDays)}d overdue`,
      isOverdue: true,
      isToday: false,
    };
  } else {
    const formatted = new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
    }).format(target);
    return { label: formatted, isOverdue: false, isToday: false };
  }
}

/**
 * Formats timestamp for created/updated dates
 */
export function formatTimestamp(isoStr?: string): string {
  if (!isoStr) return '';
  const date = new Date(isoStr);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
  }).format(date);
}

/**
 * Calendar utilities: generate days in a month view
 */
export interface CalendarDay {
  date: Date;
  dateString: string; // YYYY-MM-DD
  isCurrentMonth: boolean;
  isToday: boolean;
}

export function getCalendarMonthDays(year: number, month: number): CalendarDay[] {
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);

  const days: CalendarDay[] = [];
  const todayStr = new Date().toISOString().split('T')[0];

  // Monday = 1, Sunday = 0
  let startDay = firstDayOfMonth.getDay();
  // Adjust so Monday is 0
  startDay = startDay === 0 ? 6 : startDay - 1;

  // Previous month trailing days
  for (let i = startDay - 1; i >= 0; i--) {
    const d = new Date(year, month, -i);
    const dStr = d.toISOString().split('T')[0];
    days.push({
      date: d,
      dateString: dStr,
      isCurrentMonth: false,
      isToday: dStr === todayStr,
    });
  }

  // Current month days
  for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
    const d = new Date(year, month, i);
    const dStr = d.toISOString().split('T')[0];
    days.push({
      date: d,
      dateString: dStr,
      isCurrentMonth: true,
      isToday: dStr === todayStr,
    });
  }

  // Next month leading days to complete the 35 or 42 grid
  const remaining = (7 - (days.length % 7)) % 7;
  for (let i = 1; i <= remaining; i++) {
    const d = new Date(year, month + 1, i);
    const dStr = d.toISOString().split('T')[0];
    days.push({
      date: d,
      dateString: dStr,
      isCurrentMonth: false,
      isToday: dStr === todayStr,
    });
  }

  return days;
}
