import { onSchedule } from 'firebase-functions/v2/scheduler';
import { onRequest } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { evaluateReminderEligibility } from './reminderScheduler.js';
import type { ReminderRecord, TaskRecord } from './reminderScheduler.js';

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();
const messaging = admin.messaging();

/**
 * Core execution routine to process due reminders in safe, bounded batches.
 */
export async function executeReminderBatch(batchSize: number = 50): Promise<{
  processed: number;
  sent: number;
  cancelled: number;
  failed: number;
}> {
  const now = admin.firestore.Timestamp.now();
  const nowMs = now.toMillis();

  // Query pending reminders whose scheduled time has passed
  const remindersQuery = db
    .collectionGroup('reminders')
    .where('status', '==', 'pending')
    .where('scheduledAt', '<=', now)
    .limit(batchSize);

  const snapshot = await remindersQuery.get();

  let sent = 0;
  let cancelled = 0;
  let failed = 0;

  for (const docSnap of snapshot.docs) {
    const reminderData = docSnap.data();
    const reminderId = docSnap.id;
    const uid = reminderData.uid;
    const taskId = reminderData.taskId;

    const reminder: ReminderRecord = {
      id: reminderId,
      taskId,
      uid,
      taskTitle: reminderData.taskTitle || 'Untitled Task',
      scheduledAt: reminderData.scheduledAt,
      status: reminderData.status || 'pending',
      attemptCount: reminderData.attemptCount || 0,
      lastErrorCode: reminderData.lastErrorCode || null,
    };

    // Lease the reminder atomically to prevent concurrent double-execution
    try {
      await docSnap.ref.update({
        status: 'processing',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    } catch {
      // If another execution leased it concurrently, skip
      continue;
    }

    // Fetch associated task document to verify validity
    let taskRecord: TaskRecord | null = null;
    try {
      const taskDocSnap = await db.doc(`users/${uid}/tasks/${taskId}`).get();
      if (taskDocSnap.exists) {
        const tData = taskDocSnap.data()!;
        taskRecord = {
          id: taskDocSnap.id,
          title: tData.title,
          status: tData.status,
          dueDate: tData.dueDate,
          deletedAt: tData.deletedAt,
          createdByUid: tData.createdByUid,
        };
      }
    } catch (err) {
      console.warn(`[ReminderFunction] Error fetching task ${taskId}:`, err);
    }

    const evaluation = evaluateReminderEligibility(reminder, taskRecord, nowMs);

    if (evaluation.action === 'cancel') {
      await docSnap.ref.update({
        status: 'cancelled',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        lastErrorCode: evaluation.reason || 'task_inactive',
      });
      cancelled++;
      continue;
    }

    if (evaluation.action === 'skip' || evaluation.action === 'wait') {
      // Revert status back to pending if needed
      await docSnap.ref.update({
        status: 'pending',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      continue;
    }

    // Deliver via FCM Push
    try {
      // Retrieve registered tokens for the user
      const tokensSnap = await db.collection(`users/${uid}/fcmTokens`).get();
      const tokens: string[] = [];
      const tokenDocMap = new Map<string, FirebaseFirestore.DocumentReference>();

      tokensSnap.forEach((tDoc) => {
        const tokenVal = tDoc.data().token;
        if (tokenVal) {
          tokens.push(tokenVal);
          tokenDocMap.set(tokenVal, tDoc.ref);
        }
      });

      if (tokens.length > 0) {
        const payload = {
          tokens,
          notification: {
            title: `Reminder: ${reminder.taskTitle}`,
            body: taskRecord?.dueDate ? `Due date: ${taskRecord.dueDate}` : 'Scheduled task reminder',
          },
          data: {
            taskId,
            url: `/?taskId=${taskId}`,
          },
        };

        const response = await messaging.sendEachForMulticast(payload);

        // Clean up invalid or expired registration tokens
        response.responses.forEach((res, idx) => {
          if (!res.success && res.error) {
            const errCode = res.error.code;
            if (
              errCode === 'messaging/registration-token-not-registered' ||
              errCode === 'messaging/invalid-registration-token'
            ) {
              const staleToken = tokens[idx];
              const docRef = tokenDocMap.get(staleToken);
              if (docRef) docRef.delete().catch(() => {});
            }
          }
        });
      }

      // Mark reminder as successfully sent
      await docSnap.ref.update({
        status: 'sent',
        sentAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        attemptCount: (reminder.attemptCount || 0) + 1,
      });

      sent++;
    } catch (err: unknown) {
      console.error(`[ReminderFunction] Error sending push for reminder ${reminderId}:`, err);
      const attempts = (reminder.attemptCount || 0) + 1;
      const isFinalFailure = attempts >= 3;

      await docSnap.ref.update({
        status: isFinalFailure ? 'failed' : 'pending',
        attemptCount: attempts,
        lastErrorCode: (err as Error)?.message || 'delivery_error',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      failed++;
    }
  }

  return {
    processed: snapshot.size,
    sent,
    cancelled,
    failed,
  };
}

/**
 * Cloud Scheduler trigger: Runs every 1 minute to deliver due reminders.
 */
export const checkDueRemindersScheduled = onSchedule(
  {
    schedule: 'every 1 minutes',
    timeZone: 'UTC',
    retryCount: 1,
  },
  async () => {
    const result = await executeReminderBatch();
    console.log('[ReminderScheduler] Batch finished:', result);
  }
);

/**
 * HTTPS trigger for testing or invocation via external scheduler.
 */
export const checkDueRemindersHttp = onRequest(async (req, res) => {
  try {
    const result = await executeReminderBatch();
    res.status(200).json({ success: true, result });
  } catch (error) {
    console.error('[ReminderScheduler] HTTP trigger error:', error);
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});
