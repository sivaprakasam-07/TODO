import test from 'node:test';
import assert from 'node:assert';
import type { Task } from '../src/types/task.ts';
import { calculateDailyFocusMetrics, calculateProductivityInsights } from '../src/lib/metrics.ts';
import { getLocalDateString, parseLocalDateString, isSameLocalDay, isPastLocalDay } from '../src/lib/dateUtils.ts';

test('dateUtils - getLocalDateString and parseLocalDateString avoid timezone shifts', () => {
  const d = new Date(2026, 9, 15, 12, 0, 0); // Oct 15, 2026
  const str = getLocalDateString(d);
  assert.strictEqual(str, '2026-10-15');

  const parsed = parseLocalDateString('2026-10-15');
  assert.strictEqual(parsed.getFullYear(), 2026);
  assert.strictEqual(parsed.getMonth(), 9);
  assert.strictEqual(parsed.getDate(), 15);
});

test('dateUtils - isSameLocalDay and isPastLocalDay', () => {
  assert.strictEqual(isSameLocalDay('2026-10-15', '2026-10-15'), true);
  assert.strictEqual(isSameLocalDay('2026-10-15', '2026-10-16'), false);

  assert.strictEqual(isPastLocalDay('2026-10-14', '2026-10-15'), true);
  assert.strictEqual(isPastLocalDay('2026-10-15', '2026-10-15'), false);
  assert.strictEqual(isPastLocalDay('2026-10-16', '2026-10-15'), false);
});

test('calculateDailyFocusMetrics - calculates due today, completed today, overdue, and ratio accurately', () => {
  const refDate = new Date(2026, 9, 15, 10, 0, 0); // 2026-10-15

  const sampleTasks: Task[] = [
    {
      id: '1',
      taskNumber: 'TASK-001',
      title: 'Due Today Todo',
      status: 'todo',
      dueDate: '2026-10-15',
      tags: [],
      order: 0,
      createdAt: '2026-10-14T08:00:00.000Z',
      updatedAt: '2026-10-14T08:00:00.000Z',
    },
    {
      id: '2',
      taskNumber: 'TASK-002',
      title: 'Completed Today (due yesterday)',
      status: 'completed',
      dueDate: '2026-10-14',
      completedAt: '2026-10-15T09:30:00.000Z', // Local date is 2026-10-15
      tags: [],
      order: 1,
      createdAt: '2026-10-14T08:00:00.000Z',
      updatedAt: '2026-10-15T09:30:00.000Z',
    },
    {
      id: '3',
      taskNumber: 'TASK-003',
      title: 'Overdue active task',
      status: 'in-progress',
      dueDate: '2026-10-13',
      tags: [],
      order: 2,
      createdAt: '2026-10-12T08:00:00.000Z',
      updatedAt: '2026-10-12T08:00:00.000Z',
    },
    {
      id: '4',
      taskNumber: 'TASK-004',
      title: 'Completed in past (should not be overdue or completed today)',
      status: 'completed',
      dueDate: '2026-10-10',
      completedAt: '2026-10-11T12:00:00.000Z',
      tags: [],
      order: 3,
      createdAt: '2026-10-09T08:00:00.000Z',
      updatedAt: '2026-10-11T12:00:00.000Z',
    },
    {
      id: '5',
      taskNumber: 'TASK-005',
      title: 'Task without due date (should not be due today or overdue)',
      status: 'todo',
      tags: [],
      order: 4,
      createdAt: '2026-10-14T08:00:00.000Z',
      updatedAt: '2026-10-14T08:00:00.000Z',
    },
    {
      id: '6',
      taskNumber: 'TASK-006',
      title: 'Deleted task (should be ignored)',
      status: 'todo',
      dueDate: '2026-10-15',
      deletedAt: '2026-10-14T10:00:00.000Z',
      tags: [],
      order: 5,
      createdAt: '2026-10-14T08:00:00.000Z',
      updatedAt: '2026-10-14T10:00:00.000Z',
    },
  ];

  const metrics = calculateDailyFocusMetrics(sampleTasks, refDate);

  assert.strictEqual(metrics.dueTodayCount, 1, 'Due today should be 1');
  assert.strictEqual(metrics.completedTodayCount, 1, 'Completed today should be 1');
  assert.strictEqual(metrics.overdueCount, 1, 'Overdue count should be 1');
  assert.strictEqual(metrics.totalTodayCount, 2, 'Total today should be 2 (1 due + 1 completed)');
  assert.strictEqual(metrics.completionRatio, 0.5, 'Completion ratio should be 0.5');
  assert.strictEqual(metrics.completionPercentage, 50, 'Completion percentage should be 50%');
  assert.strictEqual(metrics.hasTasksToday, true);
});

test('calculateDailyFocusMetrics - handles empty state gracefully without NaN', () => {
  const refDate = new Date(2026, 9, 15, 10, 0, 0);
  const emptyTasks: Task[] = [];
  const metrics = calculateDailyFocusMetrics(emptyTasks, refDate);

  assert.strictEqual(metrics.dueTodayCount, 0);
  assert.strictEqual(metrics.completedTodayCount, 0);
  assert.strictEqual(metrics.overdueCount, 0);
  assert.strictEqual(metrics.totalTodayCount, 0);
  assert.strictEqual(metrics.completionRatio, 0);
  assert.strictEqual(metrics.completionPercentage, 0);
  assert.strictEqual(metrics.hasTasksToday, false);
});

test('calculateProductivityInsights - weekly distribution, tie handling, and historical tasks', () => {
  // Let refDate be Thursday, Oct 15, 2026.
  // Oct 12 is Monday, Oct 18 is Sunday.
  const refDate = new Date(2026, 9, 15, 10, 0, 0);

  const sampleTasks: Task[] = [
    // Completed Monday Oct 12
    {
      id: '1',
      taskNumber: 'TASK-001',
      title: 'Mon Task',
      status: 'completed',
      completedAt: '2026-10-12T10:00:00.000Z',
      tags: [],
      order: 0,
      createdAt: '2026-10-10T00:00:00.000Z',
      updatedAt: '2026-10-12T10:00:00.000Z',
    },
    // Completed Wednesday Oct 14
    {
      id: '2',
      taskNumber: 'TASK-002',
      title: 'Wed Task 1',
      status: 'completed',
      completedAt: '2026-10-14T11:00:00.000Z',
      tags: [],
      order: 1,
      createdAt: '2026-10-10T00:00:00.000Z',
      updatedAt: '2026-10-14T11:00:00.000Z',
    },
    // Completed Wednesday Oct 14
    {
      id: '3',
      taskNumber: 'TASK-003',
      title: 'Wed Task 2',
      status: 'completed',
      completedAt: '2026-10-14T14:00:00.000Z',
      tags: [],
      order: 2,
      createdAt: '2026-10-10T00:00:00.000Z',
      updatedAt: '2026-10-14T14:00:00.000Z',
    },
    // Completed Thursday Oct 15 (Today)
    {
      id: '4',
      taskNumber: 'TASK-004',
      title: 'Thu Task (Today)',
      status: 'completed',
      completedAt: '2026-10-15T08:00:00.000Z',
      tags: [],
      order: 3,
      createdAt: '2026-10-10T00:00:00.000Z',
      updatedAt: '2026-10-15T08:00:00.000Z',
    },
    // Active task due Friday Oct 16
    {
      id: '5',
      taskNumber: 'TASK-005',
      title: 'Fri Due Task',
      status: 'in-progress',
      dueDate: '2026-10-16',
      tags: [],
      order: 4,
      createdAt: '2026-10-10T00:00:00.000Z',
      updatedAt: '2026-10-10T00:00:00.000Z',
    },
    // Legacy completed task without completedAt
    {
      id: '6',
      taskNumber: 'TASK-006',
      title: 'Legacy completed task without timestamp',
      status: 'completed',
      tags: [],
      order: 5,
      createdAt: '2026-08-01T00:00:00.000Z',
      updatedAt: '2026-08-01T00:00:00.000Z',
    },
  ];

  const insights = calculateProductivityInsights(sampleTasks, 0, refDate);

  assert.strictEqual(insights.completedTodayCount, 1, 'Completed today should be 1 (Thursday)');
  assert.strictEqual(insights.completedThisWeekCount, 4, 'Completed this week should be 4 (1 Mon + 2 Wed + 1 Thu)');
  assert.strictEqual(insights.legacyCompletedCountWithoutTimestamp, 1, 'Legacy completed count should be 1');
  assert.strictEqual(insights.totalHistoricalCompletedCount, 5, 'Total historical completed should be 5');

  // Verify daily breakdown (Mon=1, Tue=0, Wed=2, Thu=1, Fri=0, Sat=0, Sun=0)
  assert.strictEqual(insights.weeklyActivity[0].completionCount, 1); // Mon
  assert.strictEqual(insights.weeklyActivity[1].completionCount, 0); // Tue (zero-activity day)
  assert.strictEqual(insights.weeklyActivity[2].completionCount, 2); // Wed
  assert.strictEqual(insights.weeklyActivity[3].completionCount, 1); // Thu

  // Most productive day: Wed has 2
  assert.strictEqual(insights.mostProductiveDayLabel, 'Wed (2)');

  // Completion rate: 4 completed / (4 completed + 1 active due Fri) = 80%
  assert.strictEqual(insights.completionRatePercentage, 80);
});
