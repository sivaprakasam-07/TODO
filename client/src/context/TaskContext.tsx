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
  moveTask: (id: string, newStatus: Status) => Promise<void>;
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

  // Active non-deleted tasks
  const activeTasks = useMemo(() => tasks.filter((t) => !t.deletedAt), [tasks]);

  // Soft-deleted trash tasks
  const trashTasks = useMemo(() => tasks.filter((t) => !!t.deletedAt), [tasks]);

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
        showToast({ message: 'Task could not be saved.', type: 'error' });
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
        showToast({ message: 'Failed to update task.', type: 'error' });
      }
    },
    [authUser, showToast]
  );

  const moveTask = useCallback(
    async (id: string, newStatus: Status) => {
      if (!authUser) return;

      try {
        await moveFirestoreTask(authUser.uid, id, newStatus);
        const statusLabels: Record<Status, string> = {
          todo: 'Todo',
          'in-progress': 'In Progress',
          completed: 'Completed',
        };
        showToast({ message: `Moved to ${statusLabels[newStatus]}`, type: 'info' });
      } catch (err) {
        console.error('[TaskContext] Failed to move task:', err);
        showToast({ message: 'Failed to move task.', type: 'error' });
      }
    },
    [authUser, showToast]
  );

  const restoreTask = useCallback(
    async (id: string) => {
      if (!authUser) return;

      try {
        await restoreFirestoreTask(authUser.uid, id);
        showToast({ message: 'Task restored', type: 'success' });
      } catch (err) {
        console.error('[TaskContext] Failed to restore task:', err);
        showToast({ message: 'Failed to restore task.', type: 'error' });
      }
    },
    [authUser, showToast]
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
        showToast({ message: 'Task could not be deleted.', type: 'error' });
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
        showToast({ message: 'Failed to permanently delete task.', type: 'error' });
      }
    },
    [authUser, showToast]
  );

  const deleteAllTrashTasks = useCallback(async () => {
    if (!authUser) return;

    try {
      await deleteAllTrashFirestoreTasks(authUser.uid, trashTasks);
      showToast({ message: 'Trash emptied', type: 'success' });
    } catch (err) {
      console.error('[TaskContext] Failed to empty trash:', err);
      showToast({ message: 'Failed to empty trash.', type: 'error' });
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
