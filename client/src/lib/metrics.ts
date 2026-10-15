import type { Task } from '../types/task.ts';
import {
  getLocalDateString,
  getLocalWeekInfo,
  isPastLocalDay,
  isSameLocalDay,
} from './dateUtils.ts';

export interface DailyFocusMetrics {
  dueTodayCount: number;
  completedTodayCount: number;
  overdueCount: number;
  totalTodayCount: number; // dueToday + completedToday
  completionRatio: number; // 0 to 1
  completionPercentage: number; // 0 to 100
  hasTasksToday: boolean;
  motivationalMessage: string;
}

/**
 * Calculates compact Daily Focus metrics for the Kanban board header.
 * Pure function with strict local timezone awareness.
 */
export function calculateDailyFocusMetrics(
  tasks: Task[],
  referenceDate: Date = new Date()
): DailyFocusMetrics {
  const todayStr = getLocalDateString(referenceDate);

  let dueTodayCount = 0;
  let completedTodayCount = 0;
  let overdueCount = 0;

  for (const task of tasks) {
    if (task.deletedAt) continue;

    const isCompleted = task.status === 'completed';

    // Completed Today: check if task has valid completedAt matching today's local date
    if (task.completedAt && isSameLocalDay(task.completedAt, todayStr)) {
      completedTodayCount++;
    }

    // Due Today: active task whose due date is today
    if (!isCompleted && task.dueDate === todayStr) {
      dueTodayCount++;
    }

    // Overdue: active task whose due date is strictly in the past
    if (!isCompleted && task.dueDate && isPastLocalDay(task.dueDate, todayStr)) {
      overdueCount++;
    }
  }

  const totalTodayCount = dueTodayCount + completedTodayCount;
  const hasTasksToday = totalTodayCount > 0;
  const completionRatio = hasTasksToday ? completedTodayCount / totalTodayCount : 0;
  const completionPercentage = hasTasksToday ? Math.round(completionRatio * 100) : 0;

  return {
    dueTodayCount,
    completedTodayCount,
    overdueCount,
    totalTodayCount,
    completionRatio,
    completionPercentage,
    hasTasksToday,
    motivationalMessage: 'Small steps. Real progress.',
  };
}

export interface DayActivity {
  dateStr: string; // YYYY-MM-DD
  dayLabel: string; // "Mon", "Tue", etc.
  dayNum: number;
  completionCount: number;
  isToday: boolean;
}

export interface ProductivityInsightsMetrics {
  completedTodayCount: number;
  completedThisWeekCount: number;
  weeklyActivity: DayActivity[];
  maxDailyCompletions: number;
  completionRatePercentage: number;
  hasEligibleTasks: boolean;
  mostProductiveDayLabel: string;
  legacyCompletedCountWithoutTimestamp: number;
  totalHistoricalCompletedCount: number;
  weekRangeLabel: string;
  activeDueThisWeekCount: number;
}

/**
 * Calculates Productivity Insights metrics for the Calendar page.
 * Pure function that respects week navigation and local timezone boundaries.
 */
export function calculateProductivityInsights(
  tasks: Task[],
  weekOffset: number = 0,
  referenceDate: Date = new Date()
): ProductivityInsightsMetrics {
  const weekInfo = getLocalWeekInfo(weekOffset, referenceDate);
  const todayStr = getLocalDateString(referenceDate);

  let completedTodayCount = 0;
  let legacyCompletedCountWithoutTimestamp = 0;
  let totalHistoricalCompletedCount = 0;

  // Track daily completion counts for the 7 days of the selected week
  const dayCountMap = new Map<string, number>();
  for (const day of weekInfo.days) {
    dayCountMap.set(day.dateStr, 0);
  }

  let activeDueThisWeekCount = 0;

  for (const task of tasks) {
    if (task.deletedAt) continue;

    const isCompleted = task.status === 'completed';

    if (isCompleted) {
      totalHistoricalCompletedCount++;
      if (!task.completedAt) {
        legacyCompletedCountWithoutTimestamp++;
      }
    }

    // Check completed today
    if (task.completedAt && isSameLocalDay(task.completedAt, todayStr)) {
      completedTodayCount++;
    }

    // Check if task completed in selected week
    if (task.completedAt) {
      const taskCompletedDayStr = getLocalDateString(task.completedAt);
      if (dayCountMap.has(taskCompletedDayStr)) {
        dayCountMap.set(taskCompletedDayStr, (dayCountMap.get(taskCompletedDayStr) || 0) + 1);
      }
    }

    // Check if active task is due during this selected week
    if (!isCompleted && task.dueDate) {
      if (task.dueDate >= weekInfo.mondayStr && task.dueDate <= weekInfo.sundayStr) {
        activeDueThisWeekCount++;
      }
    }
  }

  const weeklyActivity: DayActivity[] = weekInfo.days.map((day) => {
    return {
      dateStr: day.dateStr,
      dayLabel: day.dayLabel,
      dayNum: day.dayNum,
      completionCount: dayCountMap.get(day.dateStr) || 0,
      isToday: day.isToday,
    };
  });

  const completedThisWeekCount = weeklyActivity.reduce((sum, d) => sum + d.completionCount, 0);
  const maxDailyCompletions = Math.max(1, ...weeklyActivity.map((d) => d.completionCount));

  // Eligible tasks: completed during the week + remaining active tasks due during the week
  const totalEligible = completedThisWeekCount + activeDueThisWeekCount;
  const hasEligibleTasks = totalEligible > 0;
  const completionRatePercentage = hasEligibleTasks
    ? Math.round((completedThisWeekCount / totalEligible) * 100)
    : 0;

  // Most Productive Day calculation (deterministic tie handling)
  let mostProductiveDayLabel = 'None';
  if (completedThisWeekCount > 0) {
    const highestCount = Math.max(...weeklyActivity.map((d) => d.completionCount));
    const highestDays = weeklyActivity.filter((d) => d.completionCount === highestCount);

    if (highestDays.length === 1) {
      mostProductiveDayLabel = `${highestDays[0].dayLabel} (${highestCount})`;
    } else {
      mostProductiveDayLabel = `${highestDays.map((d) => d.dayLabel).join(', ')} (${highestCount})`;
    }
  }

  return {
    completedTodayCount,
    completedThisWeekCount,
    weeklyActivity,
    maxDailyCompletions,
    completionRatePercentage,
    hasEligibleTasks,
    mostProductiveDayLabel,
    legacyCompletedCountWithoutTimestamp,
    totalHistoricalCompletedCount,
    weekRangeLabel: weekInfo.weekRangeLabel,
    activeDueThisWeekCount,
  };
}
