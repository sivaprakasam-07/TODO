import { useEffect, useRef } from 'react';
import { useTasks } from '../context/TaskContext';
import { useUI } from '../context/UIContext';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { checkDueReminders, showDesktopNotification } from '../services/notificationService';
import { cancelFirestoreTaskReminder } from '../services/taskService';

/**
 * Manages foreground reminder alerts, service worker message navigation,
 * and URL parameter deep-linking for FocusFlow 2.0.
 */
export function useReminderManager(): void {
  const { tasks } = useTasks();
  const { setSelectedTaskId, setActiveView } = useUI();
  const { showToast } = useToast();
  const { user } = useAuth();
  const initialUrlChecked = useRef(false);

  // Check URL query param ?taskId=... on initial mount
  useEffect(() => {
    if (initialUrlChecked.current) return;
    initialUrlChecked.current = true;

    try {
      const params = new URLSearchParams(window.location.search);
      const taskId = params.get('taskId');
      if (taskId) {
        setSelectedTaskId(taskId);
        setActiveView('board');
        // Clean up URL query without reloading
        const cleanUrl = window.location.pathname;
        window.history.replaceState({}, '', cleanUrl);
      }
    } catch {
      // non-blocking
    }
  }, [setSelectedTaskId, setActiveView]);

  // Listen for service worker navigation messages and custom events
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'NOTIFICATION_NAVIGATE' && event.data.taskId) {
        setSelectedTaskId(event.data.taskId);
        setActiveView('board');
      }
    };

    const handleCustomNav = (event: Event) => {
      const customEvent = event as CustomEvent<{ taskId?: string }>;
      if (customEvent.detail?.taskId) {
        setSelectedTaskId(customEvent.detail.taskId);
        setActiveView('board');
      }
    };

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleMessage);
    }
    window.addEventListener('focusflow:navigate-task', handleCustomNav);

    return () => {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleMessage);
      }
      window.removeEventListener('focusflow:navigate-task', handleCustomNav);
    };
  }, [setSelectedTaskId, setActiveView]);

  // Periodic foreground reminder check (every 10 seconds)
  useEffect(() => {
    const checkReminders = () => {
      const dueTasks = checkDueReminders(tasks);

      for (const dueTask of dueTasks) {
        // 1. Show browser desktop notification if permission is granted
        showDesktopNotification(`Reminder: ${dueTask.title}`, {
          body: dueTask.dueDate ? `Due on ${dueTask.dueDate}` : 'Scheduled reminder',
          taskId: dueTask.id,
        });

        // 2. Show in-app FocusFlow toast notification with View action
        showToast({
          message: `Reminder: ${dueTask.title}`,
          type: 'action',
          duration: 8000,
          action: {
            label: 'View',
            onClick: () => {
              setSelectedTaskId(dueTask.id);
              setActiveView('board');
            },
          },
        });

        // 3. Mark reminder status in Firestore so it doesn't trigger again
        if (user) {
          cancelFirestoreTaskReminder(user.uid, dueTask.id).catch(() => {});
        }
      }
    };

    // Run check immediately, then on interval
    checkReminders();
    const interval = setInterval(checkReminders, 10000);

    return () => clearInterval(interval);
  }, [tasks, user, showToast, setSelectedTaskId, setActiveView]);
}
