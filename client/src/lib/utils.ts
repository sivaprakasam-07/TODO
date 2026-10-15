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
 * Formats a due date into a human readable string ("Today", "Tomorrow", "Sep 12", or "2d overdue")
 * Parses YYYY-MM-DD without UTC timezone offsets.
 */
export function formatDueDate(dateStr?: string): {
  label: string;
  isOverdue: boolean;
  isToday: boolean;
  isTomorrow: boolean;
} {
  if (!dateStr) {
    return { label: '', isOverdue: false, isToday: false, isTomorrow: false };
  }

  const parts = dateStr.split('-');
  let targetDateOnly: Date;
  if (parts.length === 3) {
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    targetDateOnly = new Date(y, m, d);
  } else {
    targetDateOnly = new Date(dateStr);
  }
  targetDateOnly.setHours(0, 0, 0, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diffTime = targetDateOnly.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return { label: 'Today', isOverdue: false, isToday: true, isTomorrow: false };
  } else if (diffDays === 1) {
    return { label: 'Tomorrow', isOverdue: false, isToday: false, isTomorrow: true };
  } else if (diffDays === -1) {
    return { label: '1d overdue', isOverdue: true, isToday: false, isTomorrow: false };
  } else if (diffDays < 0) {
    return {
      label: `${Math.abs(diffDays)}d overdue`,
      isOverdue: true,
      isToday: false,
      isTomorrow: false,
    };
  } else {
    const formatted = new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
    }).format(targetDateOnly);
    return { label: formatted, isOverdue: false, isToday: false, isTomorrow: false };
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
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  // Monday = 1, Sunday = 0
  let startDay = firstDayOfMonth.getDay();
  // Adjust so Monday is 0
  startDay = startDay === 0 ? 6 : startDay - 1;

  // Previous month trailing days
  for (let i = startDay - 1; i >= 0; i--) {
    const d = new Date(year, month, -i);
    const dStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
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
    const dStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
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
    const dStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    days.push({
      date: d,
      dateString: dStr,
      isCurrentMonth: false,
      isToday: dStr === todayStr,
    });
  }

  return days;
}
