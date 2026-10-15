/**
 * Core Reminder Scheduler logic for FocusFlow 2.0.
 * Handles batch processing, idempotency, task validation, token rotation, and bounded retries.
 */

export interface TaskRecord {
  id: string;
  title: string;
  status: 'todo' | 'in-progress' | 'completed';
  dueDate?: string | null;
  deletedAt?: unknown | null;
  createdByUid?: string;
}

export interface ReminderRecord {
  id: string;
  taskId: string;
  uid: string;
  taskTitle: string;
  scheduledAt: Date | { toDate: () => Date } | string;
  status: 'pending' | 'processing' | 'sent' | 'cancelled' | 'failed';
  attemptCount?: number;
  lastErrorCode?: string | null;
}

export type ReminderAction = 'send' | 'cancel' | 'wait' | 'skip';

export interface EligibilityResult {
  action: ReminderAction;
  reason?: string;
}

/**
 * Pure evaluation function that determines the action to take for a given reminder.
 * Testable without live database dependencies.
 */
export function evaluateReminderEligibility(
  reminder: ReminderRecord,
  task: TaskRecord | null,
  nowMs: number = Date.now()
): EligibilityResult {
  // If already sent or cancelled, skip
  if (reminder.status === 'sent' || reminder.status === 'cancelled') {
    return { action: 'skip', reason: `Already in terminal state: ${reminder.status}` };
  }

  // Convert scheduledAt to timestamp in ms
  let scheduledMs = 0;
  if (reminder.scheduledAt instanceof Date) {
    scheduledMs = reminder.scheduledAt.getTime();
  } else if (
    typeof reminder.scheduledAt === 'object' &&
    reminder.scheduledAt !== null &&
    'toDate' in reminder.scheduledAt &&
    typeof (reminder.scheduledAt as { toDate: () => Date }).toDate === 'function'
  ) {
    scheduledMs = (reminder.scheduledAt as { toDate: () => Date }).toDate().getTime();
  } else if (typeof reminder.scheduledAt === 'string') {
    scheduledMs = new Date(reminder.scheduledAt).getTime();
  }

  // If scheduled time has not arrived yet, wait
  if (scheduledMs > nowMs) {
    return { action: 'wait', reason: 'Scheduled time is in the future' };
  }

  // If task no longer exists, cancel reminder
  if (!task) {
    return { action: 'cancel', reason: 'Associated task document no longer exists' };
  }

  // If task has been soft-deleted (moved to trash) or deleted
  if (task.deletedAt) {
    return { action: 'cancel', reason: 'Associated task is deleted or in trash' };
  }

  // If task is already completed, do not send obsolete reminder
  if (task.status === 'completed') {
    return { action: 'cancel', reason: 'Associated task is already completed' };
  }

  // If attempt count exceeds threshold (e.g. 3 attempts), fail
  if ((reminder.attemptCount || 0) >= 3) {
    return { action: 'skip', reason: 'Maximum retry attempts exceeded' };
  }

  return { action: 'send' };
}
