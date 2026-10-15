import { getMessaging, getToken, isSupported as isMessagingSupported } from 'firebase/messaging';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import { Task } from '../types/task';

export type NotificationPermissionState = 'default' | 'granted' | 'denied' | 'unsupported';

/**
 * Checks whether Web Notifications and Service Workers are supported by the browser.
 */
export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator;
}

/**
 * Returns current browser notification permission state.
 */
export function getNotificationPermission(): NotificationPermissionState {
  if (!isNotificationSupported()) {
    return 'unsupported';
  }
  return Notification.permission as NotificationPermissionState;
}

/**
 * Requests browser notification permission after an explicit user interaction.
 * If granted, optionally registers the FCM push token in Firestore under users/{uid}/fcmTokens.
 */
export async function requestNotificationPermission(uid?: string): Promise<NotificationPermissionState> {
  if (!isNotificationSupported()) {
    return 'unsupported';
  }

  try {
    const permission = await Notification.requestPermission();

    if (permission === 'granted' && uid && db) {
      await registerFcmPushToken(uid).catch((err) => {
        console.info('[NotificationService] FCM token registration note:', err?.message || err);
      });
    }

    return permission as NotificationPermissionState;
  } catch (error) {
    console.error('[NotificationService] Error requesting notification permission:', error);
    return getNotificationPermission();
  }
}

/**
 * Registers Web Push FCM token for the user in Firestore if FCM credentials are available.
 */
export async function registerFcmPushToken(uid: string): Promise<string | null> {
  if (!isNotificationSupported() || !db) return null;

  try {
    const supported = await isMessagingSupported();
    if (!supported) return null;

    const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
    // If no VAPID key is configured, push background delivery cannot be initialized
    if (!vapidKey || vapidKey.trim() === '') {
      console.info(
        '[NotificationService] VITE_FIREBASE_VAPID_KEY is not set. Web Push registration skipped; local notifications will remain active.'
      );
      return null;
    }

    const registration = await navigator.serviceWorker.ready;
    const messaging = getMessaging();

    const currentToken = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: registration,
    });

    if (currentToken) {
      // Create a deterministic safe token id/hash
      const tokenDocId = btoa(currentToken.slice(-32)).replace(/[/+=]/g, '_');
      const tokenRef = doc(db, 'users', uid, 'fcmTokens', tokenDocId);

      await setDoc(
        tokenRef,
        {
          token: currentToken,
          uid,
          userAgent: navigator.userAgent,
          updatedAt: serverTimestamp(),
          createdAt: serverTimestamp(),
        },
        { merge: true }
      );

      return currentToken;
    }
  } catch (error) {
    console.warn('[NotificationService] FCM push token registration warning:', error);
  }

  return null;
}

/**
 * Dispatches a native browser desktop notification for a due task.
 */
export function showDesktopNotification(
  title: string,
  options: { body?: string; taskId?: string } = {}
): Notification | null {
  if (!isNotificationSupported() || Notification.permission !== 'granted') {
    return null;
  }

  try {
    const notif = new Notification(title, {
      body: options.body || 'Task reminder from FocusFlow',
      icon: '/icons/focusflow-192.png',
      badge: '/favicon.png',
      tag: options.taskId || 'focusflow-reminder',
    });

    notif.onclick = () => {
      window.focus();
      if (options.taskId && window.location) {
        // Dispatches custom event for in-app navigation
        window.dispatchEvent(
          new CustomEvent('focusflow:navigate-task', {
            detail: { taskId: options.taskId },
          })
        );
      }
      notif.close();
    };

    return notif;
  } catch (e) {
    console.warn('[NotificationService] Native notification dispatch error:', e);
    return null;
  }
}

/**
 * In-memory set of reminder IDs triggered in this active browser session to prevent duplicates.
 */
const sessionTriggeredReminders = new Set<string>();

/**
 * Evaluates active tasks for any pending reminders whose scheduled time has arrived.
 * Returns tasks that are currently due for reminder notification.
 */
export function checkDueReminders(tasks: Task[]): Task[] {
  const now = Date.now();
  const dueTasks: Task[] = [];

  for (const task of tasks) {
    if (task.deletedAt || task.status === 'completed' || !task.reminderEnabled || !task.reminderAt) {
      continue;
    }

    const scheduledTime = new Date(task.reminderAt).getTime();
    if (isNaN(scheduledTime)) continue;

    // Trigger if scheduled time is reached and within the last 2 hours (avoid firing ancient reminders on reload)
    const isDue = scheduledTime <= now;
    const isNotStale = now - scheduledTime < 2 * 60 * 60 * 1000;

    if (isDue && isNotStale && !sessionTriggeredReminders.has(task.id)) {
      sessionTriggeredReminders.add(task.id);
      dueTasks.push(task);
    }
  }

  return dueTasks;
}
