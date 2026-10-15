import test from 'node:test';
import assert from 'node:assert';
import { evaluateReminderEligibility } from '../functions/src/reminderScheduler.ts';
import type { ReminderRecord, TaskRecord } from '../functions/src/reminderScheduler.ts';

test('reminderScheduler - sends eligible reminder when time has arrived', () => {
  const now = new Date(2026, 9, 15, 12, 0, 0).getTime();

  const reminder: ReminderRecord = {
    id: 'rem-1',
    taskId: 'task-1',
    uid: 'user-1',
    taskTitle: 'Important Interview Prep',
    scheduledAt: new Date(2026, 9, 15, 11, 55, 0), // 5 min ago
    status: 'pending',
    attemptCount: 0,
  };

  const task: TaskRecord = {
    id: 'task-1',
    title: 'Important Interview Prep',
    status: 'todo',
    dueDate: '2026-10-15',
    deletedAt: null,
  };

  const result = evaluateReminderEligibility(reminder, task, now);
  assert.strictEqual(result.action, 'send');
});

test('reminderScheduler - waits when scheduledAt is in the future', () => {
  const now = new Date(2026, 9, 15, 12, 0, 0).getTime();

  const reminder: ReminderRecord = {
    id: 'rem-2',
    taskId: 'task-2',
    uid: 'user-1',
    taskTitle: 'Future Task',
    scheduledAt: new Date(2026, 9, 15, 12, 30, 0), // 30 min in future
    status: 'pending',
    attemptCount: 0,
  };

  const task: TaskRecord = {
    id: 'task-2',
    title: 'Future Task',
    status: 'in-progress',
    dueDate: '2026-10-15',
    deletedAt: null,
  };

  const result = evaluateReminderEligibility(reminder, task, now);
  assert.strictEqual(result.action, 'wait');
});

test('reminderScheduler - cancels reminder when task is already completed', () => {
  const now = new Date(2026, 9, 15, 12, 0, 0).getTime();

  const reminder: ReminderRecord = {
    id: 'rem-3',
    taskId: 'task-3',
    uid: 'user-1',
    taskTitle: 'Finished Early',
    scheduledAt: new Date(2026, 9, 15, 11, 0, 0),
    status: 'pending',
  };

  const task: TaskRecord = {
    id: 'task-3',
    title: 'Finished Early',
    status: 'completed',
    deletedAt: null,
  };

  const result = evaluateReminderEligibility(reminder, task, now);
  assert.strictEqual(result.action, 'cancel');
  assert.ok(result.reason?.includes('completed'));
});

test('reminderScheduler - cancels reminder when task is soft-deleted or deleted', () => {
  const now = new Date(2026, 9, 15, 12, 0, 0).getTime();

  const reminder: ReminderRecord = {
    id: 'rem-4',
    taskId: 'task-4',
    uid: 'user-1',
    taskTitle: 'Deleted Task',
    scheduledAt: new Date(2026, 9, 15, 11, 0, 0),
    status: 'pending',
  };

  // Case 1: soft-deleted
  const softDeletedTask: TaskRecord = {
    id: 'task-4',
    title: 'Deleted Task',
    status: 'todo',
    deletedAt: '2026-10-15T10:00:00.000Z',
  };
  assert.strictEqual(evaluateReminderEligibility(reminder, softDeletedTask, now).action, 'cancel');

  // Case 2: task document completely gone (null)
  assert.strictEqual(evaluateReminderEligibility(reminder, null, now).action, 'cancel');
});

test('reminderScheduler - skips terminal or over-retried reminders (idempotency & retry cap)', () => {
  const now = new Date(2026, 9, 15, 12, 0, 0).getTime();

  const task: TaskRecord = {
    id: 'task-5',
    title: 'Test Task',
    status: 'todo',
    deletedAt: null,
  };

  // Already sent
  const sentReminder: ReminderRecord = {
    id: 'rem-5',
    taskId: 'task-5',
    uid: 'user-1',
    taskTitle: 'Test Task',
    scheduledAt: new Date(2026, 9, 15, 11, 0, 0),
    status: 'sent',
  };
  assert.strictEqual(evaluateReminderEligibility(sentReminder, task, now).action, 'skip');

  // Maximum retries reached
  const maxRetryReminder: ReminderRecord = {
    id: 'rem-6',
    taskId: 'task-5',
    uid: 'user-1',
    taskTitle: 'Test Task',
    scheduledAt: new Date(2026, 9, 15, 11, 0, 0),
    status: 'pending',
    attemptCount: 3,
  };
  assert.strictEqual(evaluateReminderEligibility(maxRetryReminder, task, now).action, 'skip');
});
