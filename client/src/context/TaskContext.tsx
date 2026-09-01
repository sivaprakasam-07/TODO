import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
} from 'react';
import { Task, Status, Priority } from '../types/task';
import { User } from '../types/user';
import { storage } from '../services/storage';
import {
  subscribeToUserTasks,
  createFirestoreTask,
  updateFirestoreTask,
  moveFirestoreTask,
  reorderFirestoreTasks,
  softDeleteFirestoreTask,
  restoreFirestoreTask,
  permanentlyDeleteFirestoreTask,
  deleteAllTrashFirestoreTasks,
  deleteAllUserTasks,
  migrateLocalStorageTasksToFirestore,
} from '../services/taskService';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

export interface CreateTaskInput {
  title: string;
  description?: string;
  status?: Status;
  priority?: Priority;
  dueDate?: string;
  tags?: string[];
  order?: number;
}

interface TaskContextType {
  tasks: Task[];
  user: User;
  isLoading: boolean;
  tasksByStatus: {
    todo: Task[];
    'in-progress': Task[];
    completed: Task[];
  };
  trashTasks: Task[];
  getTaskById: (id: string) => Task | undefined;
  createTask: (input: CreateTaskInput) => Promise<string | undefined>;
  updateTask: (id: string, updates: Partial<Omit<Task, 'id' | 'createdAt' | 'taskNumber'>>) => Promise<void>;
  moveTask: (id: string, newStatus: Status, targetIndex?: number) => Promise<void>;
  reorderTasks: (status: Status, newOrderedTasks: Task[]) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  restoreTask: (id: string) => Promise<void>;
  permanentlyDeleteTask: (id: string) => Promise<void>;
  deleteAllTrashTasks: () => Promise<void>;
  clearAllTasks: () => Promise<boolean>;
  updateUser: (updates: Partial<User>) => void;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const TaskProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user: authUser } = useAuth();
  const { showToast } = useToast();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [user, setUser] = useState<User>(() => storage.getUser());

  // Real-time Firestore task sync & migration
  useEffect(() => {
    if (!authUser) {
      setTasks([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const uid = authUser.uid;
    const authorName = authUser.displayName || user.name || 'User';

    // Check one-time migration of legacy localStorage tasks
    const runMigrationAndSubscribe = async () => {
      try {
        if (!storage.isMigrationCompleted(uid)) {
          const legacyTasks = storage.getTasks();
          if (legacyTasks.length > 0) {
            const migrationSuccess = await migrateLocalStorageTasksToFirestore(
              uid,
              legacyTasks,
              authorName,
              authUser.email || undefined
            );
            if (migrationSuccess) {
              storage.markMigrationCompleted(uid);
              storage.clearLegacyTasks();
            }
          } else {
            storage.markMigrationCompleted(uid);
          }
        }
      } catch (migrationErr) {
        console.error('[TaskContext] Migration error:', migrationErr);
      }

      // Subscribe to real-time updates from Firestore
      const unsubscribe = subscribeToUserTasks(
        uid,
        (remoteTasks) => {
          setTasks(remoteTasks);
          setIsLoading(false);
        },
        (error) => {
          console.error('[TaskContext] Firestore listener error:', error);
          showToast({ message: 'Unable to load tasks.', type: 'error' });
          setIsLoading(false);
        }
      );

      return unsubscribe;
    };

    let unsubFn: (() => void) | undefined;
    runMigrationAndSubscribe().then((unsub) => {
      unsubFn = unsub;
    });

    return () => {
      if (unsubFn) unsubFn();
    };
  }, [authUser, user.name, showToast]);

  // Active non-deleted tasks sorted by order ascending
  const activeTasks = useMemo(() => {
    const list = tasks.filter((t) => !t.deletedAt);
    return list.sort((a, b) => a.order - b.order);
  }, [tasks]);

  // Soft-deleted trash tasks
  const trashTasks = useMemo(() => {
    return tasks
      .filter((t) => !!t.deletedAt)
      .sort((a, b) => new Date(b.deletedAt || 0).getTime() - new Date(a.deletedAt || 0).getTime());
  }, [tasks]);

  // Tasks grouped by Kanban status
  const tasksByStatus = useMemo(() => {
    return {
      todo: activeTasks.filter((t) => t.status === 'todo'),
      'in-progress': activeTasks.filter((t) => t.status === 'in-progress'),
      completed: activeTasks.filter((t) => t.status === 'completed'),
    };
  }, [activeTasks]);

  const getTaskById = useCallback(
    (id: string) => tasks.find((t) => t.id === id),
    [tasks]
  );

  const createTask = useCallback(
    async (input: CreateTaskInput): Promise<string | undefined> => {
      if (!authUser) {
        showToast({ message: 'Authentication required to create tasks.', type: 'error' });
        return;
      }

      try {
        const authorName = authUser.displayName || user.name || 'User';
        const newTaskId = await createFirestoreTask(
          authUser.uid,
          {
            ...input,
            createdByName: authorName,
            createdByEmail: authUser.email || undefined,
            createdByPhotoURL: authUser.photoURL || undefined,
          },
          tasks
        );
        showToast({ message: 'Task created successfully', type: 'success' });
        return newTaskId;
      } catch (err) {
        console.error('[TaskContext] Failed to create task:', err);
        showToast({ message: "Couldn't create task. Please try again.", type: 'error' });
        return;
      }
    },
    [authUser, user.name, tasks, showToast]
  );

  const updateTask = useCallback(
    async (id: string, updates: Partial<Omit<Task, 'id' | 'createdAt' | 'taskNumber'>>) => {
      if (!authUser) return;

      try {
        await updateFirestoreTask(authUser.uid, id, updates);
      } catch (err) {
        console.error('[TaskContext] Failed to update task:', err);
        showToast({ message: "Couldn't update task. Please try again.", type: 'error' });
      }
    },
    [authUser, showToast]
  );

  const moveTask = useCallback(
    async (id: string, newStatus: Status, targetIndex?: number) => {
      if (!authUser) return;

      try {
        await moveFirestoreTask(authUser.uid, id, newStatus, targetIndex);
        const statusLabels: Record<Status, string> = {
          todo: 'Todo',
          'in-progress': 'In Progress',
          completed: 'Completed',
        };
        showToast({ message: `Moved to ${statusLabels[newStatus]}`, type: 'info' });
      } catch (err) {
        console.error('[TaskContext] Failed to move task:', err);
        showToast({ message: "Couldn't move task. Please try again.", type: 'error' });
      }
    },
    [authUser, showToast]
  );

  const reorderTasks = useCallback(
    async (status: Status, newOrderedTasks: Task[]) => {
      if (!authUser) return;

      // Optimistic local state update
      setTasks((prev) => {
        const others = prev.filter((t) => t.status !== status || !!t.deletedAt);
        const updated = newOrderedTasks.map((task, idx) => ({ ...task, order: idx }));
        return [...updated, ...others];
      });

      try {
        const payload = newOrderedTasks.map((t, idx) => ({ id: t.id, order: idx }));
        await reorderFirestoreTasks(authUser.uid, payload);
      } catch (err) {
        console.error('[TaskContext] Failed to reorder tasks:', err);
        showToast({ message: "Couldn't save task order.", type: 'error' });
      }
    },
    [authUser, showToast]
  );

  const restoreTask = useCallback(
    async (id: string) => {
      if (!authUser) return;

      try {
        const taskToRestore = tasks.find((t) => t.id === id);
        const colTasks = tasks.filter(
          (t) => t.status === (taskToRestore?.status || 'todo') && !t.deletedAt
        );
        const newOrder = colTasks.length;

        await restoreFirestoreTask(authUser.uid, id, newOrder);
        showToast({ message: 'Task restored', type: 'success' });
      } catch (err) {
        console.error('[TaskContext] Failed to restore task:', err);
        showToast({ message: "Couldn't restore task. Please try again.", type: 'error' });
      }
    },
    [authUser, tasks, showToast]
  );

  const deleteTask = useCallback(
    async (id: string) => {
      if (!authUser) return;

      const task = tasks.find((t) => t.id === id);
      if (!task) return;

      try {
        await softDeleteFirestoreTask(authUser.uid, id);

        // Show toast with working Undo button
        showToast({
          message: `${task.taskNumber} deleted`,
          type: 'action',
          duration: 5000,
          action: {
            label: 'Undo',
            onClick: () => {
              restoreTask(id);
            },
          },
        });
      } catch (err) {
        console.error('[TaskContext] Failed to delete task:', err);
        showToast({ message: "Couldn't delete task. Please try again.", type: 'error' });
      }
    },
    [authUser, tasks, restoreTask, showToast]
  );

  const permanentlyDeleteTask = useCallback(
    async (id: string) => {
      if (!authUser) return;

      try {
        await permanentlyDeleteFirestoreTask(authUser.uid, id);
        showToast({ message: 'Task permanently deleted', type: 'success' });
      } catch (err) {
        console.error('[TaskContext] Failed to permanently delete task:', err);
        showToast({ message: "Couldn't permanently delete task.", type: 'error' });
      }
    },
    [authUser, showToast]
  );

  const deleteAllTrashTasks = useCallback(async () => {
    if (!authUser) return;
    if (trashTasks.length === 0) {
      showToast({ message: 'Trash is already empty.', type: 'info' });
      return;
    }

    try {
      await deleteAllTrashFirestoreTasks(authUser.uid, trashTasks);
      showToast({ message: 'Trash emptied permanently.', type: 'success' });
    } catch (err) {
      console.error('[TaskContext] Failed to empty trash:', err);
      showToast({ message: "Couldn't empty trash. Please try again.", type: 'error' });
    }
  }, [authUser, trashTasks, showToast]);

  const clearAllTasks = useCallback(async (): Promise<boolean> => {
    if (!authUser) return false;

    try {
      await deleteAllUserTasks(authUser.uid);
      showToast({ message: 'All tasks cleared successfully.', type: 'success' });
      return true;
    } catch (err) {
      console.error('[TaskContext] Failed to clear all tasks:', err);
      showToast({ message: 'Unable to clear tasks. Please try again.', type: 'error' });
      return false;
    }
  }, [authUser, showToast]);

  const updateUser = useCallback((updates: Partial<User>) => {
    setUser((prev) => {
      const next = { ...prev, ...updates };
      storage.saveUser(next);
      return next;
    });
  }, []);

  return (
    <TaskContext.Provider
      value={{
        tasks,
        user,
        isLoading,
        tasksByStatus,
        trashTasks,
        getTaskById,
        createTask,
        updateTask,
        moveTask,
        reorderTasks,
        deleteTask,
        restoreTask,
        permanentlyDeleteTask,
        deleteAllTrashTasks,
        clearAllTasks,
        updateUser,
      }}
    >
      {children}
    </TaskContext.Provider>
  );
};

export const useTasks = (): TaskContextType => {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTasks must be used within a TaskProvider');
  }
  return context;
};
