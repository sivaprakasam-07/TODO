/**
 * Date and timezone utilities for FocusFlow 2.0.
 * Ensures consistent local-day boundary calculations across Board, Calendar, and Reminders.
 */

/**
 * Returns a YYYY-MM-DD string formatted in the user's local timezone.
 * Avoids UTC timezone conversion shifts.
 */
export function getLocalDateString(dateInput: Date | string = new Date()): string {
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parses a YYYY-MM-DD date string into a local midnight Date object without UTC drift.
 */
export function parseLocalDateString(dateStr: string): Date {
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    return new Date(year, month, day, 0, 0, 0, 0);
  }
  const fallback = new Date(dateStr);
  fallback.setHours(0, 0, 0, 0);
  return fallback;
}

/**
 * Checks whether two dates or date strings fall on the exact same local calendar day.
 */
export function isSameLocalDay(d1: Date | string, d2: Date | string): boolean {
  const str1 = typeof d1 === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d1) ? d1 : getLocalDateString(d1);
  const str2 = typeof d2 === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d2) ? d2 : getLocalDateString(d2);
  return Boolean(str1 && str2 && str1 === str2);
}

/**
 * Checks whether a YYYY-MM-DD due date is strictly in the past relative to the local today.
 */
export function isPastLocalDay(dueDateStr: string, referenceTodayStr?: string): boolean {
  if (!dueDateStr) return false;
  const todayStr = referenceTodayStr || getLocalDateString();
  return dueDateStr < todayStr;
}

/**
 * Formats a scheduled ISO timestamp for compact UI display.
 * E.g., "Today at 4:00 PM", "Tomorrow at 9:00 AM", or "Oct 22 at 2:15 PM"
 */
export function formatReminderDisplay(isoStr?: string | null): string {
  if (!isoStr) return '';
  const date = new Date(isoStr);
  if (isNaN(date.getTime())) return '';

  const todayStr = getLocalDateString();
  const reminderDayStr = getLocalDateString(date);

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = getLocalDateString(tomorrow);

  const timeStr = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);

  if (reminderDayStr === todayStr) {
    return `Today at ${timeStr}`;
  }
  if (reminderDayStr === tomorrowStr) {
    return `Tomorrow at ${timeStr}`;
  }

  const datePart = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(date);

  return `${datePart} at ${timeStr}`;
}

export interface LocalWeekDay {
  date: Date;
  dateStr: string; // YYYY-MM-DD
  dayLabel: string; // "Mon", "Tue", etc.
  dayNum: number; // 1 to 31
  isToday: boolean;
}

export interface LocalWeekInfo {
  monday: Date;
  sunday: Date;
  mondayStr: string;
  sundayStr: string;
  days: LocalWeekDay[];
  weekRangeLabel: string;
}

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/**
 * Computes Monday-to-Sunday week boundaries for a given week offset from today.
 * offset = 0 means current week, offset = -1 means previous week.
 */
export function getLocalWeekInfo(weekOffset: number = 0, referenceDate: Date = new Date()): LocalWeekInfo {
  const base = new Date(referenceDate);
  // Add weeks
  base.setDate(base.getDate() + weekOffset * 7);

  // Compute Monday
  const dayOfWeek = base.getDay(); // 0 is Sunday, 1 is Monday
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

  const monday = new Date(base.getFullYear(), base.getMonth(), base.getDate() + diffToMonday, 0, 0, 0, 0);
  const sunday = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 6, 23, 59, 59, 999);

  const todayStr = getLocalDateString(referenceDate);
  const days: LocalWeekDay[] = [];

  for (let i = 0; i < 7; i++) {
    const d = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i);
    const dStr = getLocalDateString(d);
    days.push({
      date: d,
      dateStr: dStr,
      dayLabel: DAY_LABELS[i],
      dayNum: d.getDate(),
      isToday: dStr === todayStr,
    });
  }

  const mondayStr = getLocalDateString(monday);
  const sundayStr = getLocalDateString(sunday);

  const sameMonth = monday.getMonth() === sunday.getMonth();
  const sameYear = monday.getFullYear() === sunday.getFullYear();

  let weekRangeLabel = '';
  if (sameMonth && sameYear) {
    const mStr = new Intl.DateTimeFormat('en-US', { month: 'short' }).format(monday);
    weekRangeLabel = `${mStr} ${monday.getDate()} – ${sunday.getDate()}, ${monday.getFullYear()}`;
  } else if (sameYear) {
    const m1 = new Intl.DateTimeFormat('en-US', { month: 'short' }).format(monday);
    const m2 = new Intl.DateTimeFormat('en-US', { month: 'short' }).format(sunday);
    weekRangeLabel = `${m1} ${monday.getDate()} – ${m2} ${sunday.getDate()}, ${monday.getFullYear()}`;
  } else {
    const m1 = new Intl.DateTimeFormat('en-US', { month: 'short' }).format(monday);
    const m2 = new Intl.DateTimeFormat('en-US', { month: 'short' }).format(sunday);
    weekRangeLabel = `${m1} ${monday.getDate()}, ${monday.getFullYear()} – ${m2} ${sunday.getDate()}, ${sunday.getFullYear()}`;
  }

  return {
    monday,
    sunday,
    mondayStr,
    sundayStr,
    days,
    weekRangeLabel,
  };
}
