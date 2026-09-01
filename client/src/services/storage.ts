import { Task, Status } from '../types/task';
import { User } from '../types/user';

export const STORAGE_KEYS = {
  TASKS: 'focusflow:tasks:v1',
  USER: 'focusflow:user:v1',
  SETTINGS: 'focusflow:settings:v1',
  MIGRATION_PREFIX: 'focusflow:firestore-migration:v1:',
} as const;

const now = new Date();
const todayStr = now.toISOString().split('T')[0];

const tomorrow = new Date(now);
tomorrow.setDate(tomorrow.getDate() + 1);
const tomorrowStr = tomorrow.toISOString().split('T')[0];

const nextWeek = new Date(now);
nextWeek.setDate(nextWeek.getDate() + 4);
const nextWeekStr = nextWeek.toISOString().split('T')[0];

const yesterday = new Date(now);
yesterday.setDate(yesterday.getDate() - 1);
const yesterdayStr = yesterday.toISOString().split('T')[0];

export const INITIAL_USER: User = {
  id: 'usr-1',
  name: 'Developer',
  email: 'alex@focusflow.dev',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  role: 'Product Engineer',
};

export const INITIAL_TASKS: Task[] = [
  {
    id: 'task-1',
    taskNumber: 'TASK-001',
    title: 'Complete portfolio redesign and responsive layout',
    description: 'Optimize mobile viewports, verify contrast ratios, and test micro-interactions.',
    status: 'todo' as Status,
    priority: 'high',
    dueDate: todayStr,
    tags: ['Frontend', 'UI'],
    order: 0,
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
    completedAt: null,
    deletedAt: null,
  },
  {
    id: 'task-2',
    taskNumber: 'TASK-002',
    title: 'Practice dynamic programming algorithms on LeetCode',
    description: 'Solve 2 problems covering Coin Change and Knapsack patterns.',
    status: 'todo' as Status,
    priority: 'medium',
    dueDate: tomorrowStr,
    tags: ['DSA', 'Study'],
    order: 1,
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
    completedAt: null,
    deletedAt: null,
  },
  {
    id: 'task-3',
    taskNumber: 'TASK-003',
    title: 'Build backend REST API with PostgreSQL and Prisma',
    description: 'Design schema, migration scripts, and CRUD controllers for task entities.',
    status: 'in-progress' as Status,
    priority: 'high',
    dueDate: todayStr,
    tags: ['Backend', 'Database'],
    order: 0,
    createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
    completedAt: null,
    deletedAt: null,
  },
  {
    id: 'task-4',
    taskNumber: 'TASK-004',
    title: 'Refactor state management and drag-and-drop handler',
    description: 'Streamline status transitions and drop target highlights.',
    status: 'in-progress' as Status,
    priority: 'low',
    dueDate: nextWeekStr,
    tags: ['Refactor'],
    order: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    completedAt: null,
    deletedAt: null,
  },
  {
    id: 'task-5',
    taskNumber: 'TASK-005',
    title: 'Finish landing page visual direction & dark tokens',
    description: 'Established the #0A0A0A dark-first aesthetic with thin borders and clean typography.',
    status: 'completed' as Status,
    priority: 'medium',
    dueDate: yesterdayStr,
    tags: ['Design'],
    order: 0,
    createdAt: new Date(Date.now() - 4 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    completedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    deletedAt: null,
  },
  {
    id: 'task-6',
    taskNumber: 'TASK-006',
    title: 'Set up Vite + Tailwind CSS environment and Lucide icons',
    description: 'Configured fast bundler and dark theme variables.',
    status: 'completed' as Status,
    priority: 'low',
    dueDate: yesterdayStr,
    tags: ['Setup'],
    order: 1,
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    completedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    deletedAt: null,
  },
];

class StorageService {
  private safeGet<T>(key: string, defaultValue: T): T {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return defaultValue;
      const parsed = JSON.parse(raw);
      return parsed ?? defaultValue;
    } catch (e) {
      console.warn(`[StorageService] Error reading "${key}":`, e);
      return defaultValue;
    }
  }

  private safeSet<T>(key: string, value: T): boolean {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error(`[StorageService] Error writing "${key}":`, e);
      return false;
    }
  }

  getTasks(): Task[] {
    const raw = localStorage.getItem(STORAGE_KEYS.TASKS);
    if (!raw) {
      return [];
    }
    const tasks = this.safeGet<Task[]>(STORAGE_KEYS.TASKS, []);
    return Array.isArray(tasks) ? tasks : [];
  }

  saveTasks(tasks: Task[]): void {
    this.safeSet(STORAGE_KEYS.TASKS, tasks);
  }

  getUser(): User {
    const raw = localStorage.getItem(STORAGE_KEYS.USER);
    if (!raw) {
      this.safeSet(STORAGE_KEYS.USER, INITIAL_USER);
      return INITIAL_USER;
    }
    const user = this.safeGet<User>(STORAGE_KEYS.USER, INITIAL_USER);
    return user && typeof user === 'object' ? user : INITIAL_USER;
  }

  saveUser(user: User): void {
    this.safeSet(STORAGE_KEYS.USER, user);
  }

  isMigrationCompleted(uid: string): boolean {
    try {
      return localStorage.getItem(`${STORAGE_KEYS.MIGRATION_PREFIX}${uid}`) === 'completed';
    } catch {
      return false;
    }
  }

  markMigrationCompleted(uid: string): void {
    try {
      localStorage.setItem(`${STORAGE_KEYS.MIGRATION_PREFIX}${uid}`, 'completed');
    } catch (e) {
      console.error('[StorageService] Error marking migration complete:', e);
    }
  }

  clearLegacyTasks(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.TASKS);
    } catch (e) {
      console.error('[StorageService] Error clearing legacy tasks:', e);
    }
  }

  clearAll(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.TASKS);
      localStorage.removeItem(STORAGE_KEYS.USER);
      localStorage.removeItem(STORAGE_KEYS.SETTINGS);
    } catch (e) {
      console.error('[StorageService] Error clearing storage:', e);
    }
  }
}

export const storage = new StorageService();
