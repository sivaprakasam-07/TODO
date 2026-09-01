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
import { generateId, getNextTaskNumber } from '../lib/utils';
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
  tasksByStatus: {
    todo: Task[];
    'in-progress': Task[];
    completed: Task[];
  };
  getTaskById: (id: string) => Task | undefined;
  createTask: (input: CreateTaskInput) => Task;
  updateTask: (id: string, updates: Partial<Omit<Task, 'id' | 'createdAt' | 'taskNumber'>>) => void;
  moveTask: (id: string, newStatus: Status, targetIndex?: number) => void;
  deleteTask: (id: string) => void;
  restoreTask: (id: string) => void;
  updateUser: (updates: Partial<User>) => void;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const TaskProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [tasks, setTasks] = useState<Task[]>(() => storage.getTasks());
  const [user, setUser] = useState<User>(() => storage.getUser());
  const { showToast } = useToast();

  useEffect(() => {
    storage.saveTasks(tasks);
  }, [tasks]);

  useEffect(() => {
    storage.saveUser(user);
  }, [user]);

  // Active non-deleted tasks
  const activeTasks = useMemo(() => tasks.filter((t) => !t.deletedAt), [tasks]);

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
    (input: CreateTaskInput): Task => {
      const now = new Date().toISOString();
      const nextNumber = getNextTaskNumber(tasks);

      const newTask: Task = {
        id: `task-${generateId()}`,
        taskNumber: nextNumber,
        title: input.title.trim(),
        description: input.description?.trim() || undefined,
        status: input.status || 'todo',
        priority: input.priority || undefined,
        dueDate: input.dueDate || undefined,
        tags: input.tags || [],
        createdAt: now,
        updatedAt: now,
        completedAt: input.status === 'completed' ? now : null,
        deletedAt: null,
      };

      setTasks((prev) => [newTask, ...prev]);
      showToast({ message: `${newTask.taskNumber} created`, type: 'success' });
      return newTask;
    },
    [tasks, showToast]
  );

  const updateTask = useCallback(
    (id: string, updates: Partial<Omit<Task, 'id' | 'createdAt' | 'taskNumber'>>) => {
      const now = new Date().toISOString();
      setTasks((prev) =>
        prev.map((t) => {
          if (t.id !== id) return t;
          const updated: Task = {
            ...t,
            ...updates,
            updatedAt: now,
          };
          if (updates.status === 'completed' && !t.completedAt) {
            updated.completedAt = now;
          } else if (updates.status && updates.status !== 'completed') {
            updated.completedAt = null;
          }
          return updated;
        })
      );
    },
    []
  );

  const moveTask = useCallback(
    (id: string, newStatus: Status, targetIndex?: number) => {
      const now = new Date().toISOString();
      setTasks((prev) => {
        const taskToMove = prev.find((t) => t.id === id);
        if (!taskToMove) return prev;

        const updatedTask: Task = {
          ...taskToMove,
          status: newStatus,
          updatedAt: now,
          completedAt: newStatus === 'completed' ? (taskToMove.completedAt || now) : null,
        };

        const withoutTask = prev.filter((t) => t.id !== id);

        if (typeof targetIndex === 'number' && targetIndex >= 0) {
          const newTasks = [...withoutTask];
          newTasks.splice(targetIndex, 0, updatedTask);
          return newTasks;
        }

        // Prepend to top of destination column
        return [updatedTask, ...withoutTask];
      });

      const statusLabels: Record<Status, string> = {
        todo: 'Todo',
        'in-progress': 'In Progress',
        completed: 'Completed',
      };
      showToast({ message: `Moved to ${statusLabels[newStatus]}`, type: 'info' });
    },
    [showToast]
  );

  const restoreTask = useCallback(
    (id: string) => {
      const now = new Date().toISOString();
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, deletedAt: null, updatedAt: now } : t))
      );
      showToast({ message: 'Task restored', type: 'success' });
    },
    [showToast]
  );

  const deleteTask = useCallback(
    (id: string) => {
      const task = tasks.find((t) => t.id === id);
      if (!task) return;

      const now = new Date().toISOString();
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, deletedAt: now, updatedAt: now } : t))
      );

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
    },
    [tasks, restoreTask, showToast]
  );

  const updateUser = useCallback((updates: Partial<User>) => {
    setUser((prev) => ({ ...prev, ...updates }));
    showToast({ message: 'Profile updated', type: 'success' });
  }, [showToast]);

  return (
    <TaskContext.Provider
      value={{
        tasks,
        user,
        tasksByStatus,
        getTaskById,
        createTask,
        updateTask,
        moveTask,
        deleteTask,
        restoreTask,
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
