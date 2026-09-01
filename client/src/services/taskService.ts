import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  Unsubscribe,
  writeBatch,
  DocumentData,
  QueryDocumentSnapshot,
} from 'firebase/firestore';
import { db } from './firebase';
import { Task, Status, Priority } from '../types/task';
import { getNextTaskNumber } from '../lib/utils';

export interface CreateTaskServiceInput {
  title: string;
  description?: string;
  status?: Status;
  priority?: Priority;
  dueDate?: string;
  tags?: string[];
  order?: number;
  createdByName?: string;
  createdByEmail?: string;
  createdByPhotoURL?: string;
}

/**
 * Converts a Firestore timestamp or date string to ISO string.
 */
function timestampToIso(value: unknown): string {
  if (!value) return new Date().toISOString();
  if (value instanceof Timestamp) {
    return value.toDate().toISOString();
  }
  if (typeof value === 'object' && value !== null && 'toDate' in value && typeof (value as { toDate: () => Date }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  if (typeof value === 'string') {
    return value;
  }
  return new Date().toISOString();
}

/**
 * Parses a Firestore document snapshot into a Task entity.
 */
export function parseFirestoreTask(docSnap: QueryDocumentSnapshot<DocumentData>, fallbackIndex: number = 0): Task {
  const data = docSnap.data();

  return {
    id: docSnap.id,
    taskNumber: data.taskNumber || 'TASK-001',
    title: data.title || 'Untitled Task',
    description: data.description || undefined,
    status: (data.status as Status) || 'todo',
    priority: (data.priority as Priority) || undefined,
    dueDate: data.dueDate || undefined,
    tags: Array.isArray(data.tags) ? data.tags : [],
    order: typeof data.order === 'number' ? data.order : fallbackIndex,
    createdAt: timestampToIso(data.createdAt),
    updatedAt: timestampToIso(data.updatedAt),
    completedAt: data.completedAt ? timestampToIso(data.completedAt) : null,
    deletedAt: data.deletedAt ? timestampToIso(data.deletedAt) : null,
    createdBy: data.createdBy || undefined,
    createdByUid: data.createdByUid || undefined,
    createdByEmail: data.createdByEmail || undefined,
    createdByPhotoURL: data.createdByPhotoURL || undefined,
  };
}

/**
 * Subscribes in real time to the authenticated user's task collection.
 * Path: users/{uid}/tasks
 */
export function subscribeToUserTasks(
  uid: string,
  onTasksUpdate: (tasks: Task[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  if (!db) {
    if (onError) onError(new Error('Firestore is not initialized.'));
    return () => {};
  }

  const tasksCollectionRef = collection(db, 'users', uid, 'tasks');

  return onSnapshot(
    tasksCollectionRef,
    (snapshot) => {
      const tasks = snapshot.docs.map((d, idx) => parseFirestoreTask(d, idx));
      onTasksUpdate(tasks);
    },
    (error) => {
      console.error('[TaskService] Firestore snapshot error:', error);
      if (onError) onError(error);
    }
  );
}

/**
 * Creates a new task document in Firestore under users/{uid}/tasks with author details and order.
 */
export async function createFirestoreTask(
  uid: string,
  input: CreateTaskServiceInput,
  existingTasks: Task[]
): Promise<string> {
  if (!db) throw new Error('Firestore is not initialized.');

  const nextTaskNumber = getNextTaskNumber(existingTasks);
  const tasksCollectionRef = collection(db, 'users', uid, 'tasks');
  const newDocRef = doc(tasksCollectionRef);

  const initialStatus = input.status || 'todo';
  const columnTasks = existingTasks.filter((t) => t.status === initialStatus && !t.deletedAt);
  const taskOrder = typeof input.order === 'number' ? input.order : columnTasks.length;

  const taskPayload = {
    taskNumber: nextTaskNumber,
    title: input.title.trim(),
    description: input.description?.trim() || null,
    status: initialStatus,
    priority: input.priority || null,
    dueDate: input.dueDate || null,
    tags: input.tags || [],
    order: taskOrder,
    createdBy: input.createdByName || null,
    createdByUid: uid,
    createdByEmail: input.createdByEmail || null,
    createdByPhotoURL: input.createdByPhotoURL || null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    completedAt: initialStatus === 'completed' ? serverTimestamp() : null,
    deletedAt: null,
  };

  await setDoc(newDocRef, taskPayload);
  return newDocRef.id;
}

/**
 * Updates an existing task document in Firestore.
 */
export async function updateFirestoreTask(
  uid: string,
  taskId: string,
  updates: Partial<Omit<Task, 'id' | 'createdAt' | 'taskNumber'>>
): Promise<void> {
  if (!db) throw new Error('Firestore is not initialized.');

  const taskDocRef = doc(db, 'users', uid, 'tasks', taskId);

  const payload: Record<string, unknown> = {
    updatedAt: serverTimestamp(),
  };

  if (updates.title !== undefined) payload.title = updates.title.trim();
  if (updates.description !== undefined) payload.description = updates.description?.trim() || null;
  if (updates.status !== undefined) {
    payload.status = updates.status;
    if (updates.status === 'completed') {
      payload.completedAt = serverTimestamp();
    } else {
      payload.completedAt = null;
    }
  }
  if (updates.priority !== undefined) payload.priority = updates.priority || null;
  if (updates.dueDate !== undefined) payload.dueDate = updates.dueDate || null;
  if (updates.tags !== undefined) payload.tags = updates.tags;
  if (updates.order !== undefined) payload.order = updates.order;
  if (updates.deletedAt !== undefined) payload.deletedAt = updates.deletedAt;

  await updateDoc(taskDocRef, payload);
}

/**
 * Moves a task to a new Kanban status and optional order.
 */
export async function moveFirestoreTask(
  uid: string,
  taskId: string,
  newStatus: Status,
  newOrder?: number
): Promise<void> {
  if (!db) throw new Error('Firestore is not initialized.');

  const taskDocRef = doc(db, 'users', uid, 'tasks', taskId);

  const payload: Record<string, unknown> = {
    status: newStatus,
    updatedAt: serverTimestamp(),
    completedAt: newStatus === 'completed' ? serverTimestamp() : null,
  };

  if (typeof newOrder === 'number') {
    payload.order = newOrder;
  }

  await updateDoc(taskDocRef, payload);
}

/**
 * Persists updated ordering of tasks in a column.
 */
export async function reorderFirestoreTasks(
  uid: string,
  reorderedTasks: { id: string; order: number }[]
): Promise<void> {
  if (!db || reorderedTasks.length === 0) return;

  const firestore = db;
  const batch = writeBatch(firestore);

  reorderedTasks.forEach(({ id, order }) => {
    const taskDocRef = doc(firestore, 'users', uid, 'tasks', id);
    batch.update(taskDocRef, {
      order,
      updatedAt: serverTimestamp(),
    });
  });

  await batch.commit();
}

/**
 * Soft deletes a task (sets deletedAt timestamp).
 */
export async function softDeleteFirestoreTask(uid: string, taskId: string): Promise<void> {
  if (!db) throw new Error('Firestore is not initialized.');

  const taskDocRef = doc(db, 'users', uid, 'tasks', taskId);
  await updateDoc(taskDocRef, {
    deletedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

/**
 * Restores a soft-deleted task (clears deletedAt).
 */
export async function restoreFirestoreTask(uid: string, taskId: string, newOrder?: number): Promise<void> {
  if (!db) throw new Error('Firestore is not initialized.');

  const taskDocRef = doc(db, 'users', uid, 'tasks', taskId);
  const payload: Record<string, unknown> = {
    deletedAt: null,
    updatedAt: serverTimestamp(),
  };
  if (typeof newOrder === 'number') {
    payload.order = newOrder;
  }

  await updateDoc(taskDocRef, payload);
}

/**
 * Permanently deletes a task document from Firestore.
 */
export async function permanentlyDeleteFirestoreTask(uid: string, taskId: string): Promise<void> {
  if (!db) throw new Error('Firestore is not initialized.');

  const taskDocRef = doc(db, 'users', uid, 'tasks', taskId);
  await deleteDoc(taskDocRef);
}

/**
 * Permanently deletes all soft-deleted tasks for the user (Empty Trash).
 */
export async function deleteAllTrashFirestoreTasks(uid: string, trashTasks: Task[]): Promise<void> {
  if (!db) throw new Error('Firestore is not initialized.');
  if (trashTasks.length === 0) return;

  const firestore = db;
  const BATCH_SIZE = 400;

  for (let i = 0; i < trashTasks.length; i += BATCH_SIZE) {
    const batch = writeBatch(firestore);
    const chunk = trashTasks.slice(i, i + BATCH_SIZE);
    chunk.forEach((task) => {
      const taskDocRef = doc(firestore, 'users', uid, 'tasks', task.id);
      batch.delete(taskDocRef);
    });
    await batch.commit();
  }
}

/**
 * Permanently deletes ALL tasks belonging to the user from Firestore in safe batches.
 * Only targets documents under users/{uid}/tasks.
 */
export async function deleteAllUserTasks(uid: string): Promise<number> {
  if (!db) throw new Error('Firestore is not initialized.');

  const firestore = db;
  const tasksCollectionRef = collection(firestore, 'users', uid, 'tasks');
  const snapshot = await getDocs(tasksCollectionRef);

  if (snapshot.empty) {
    return 0;
  }

  const docs = snapshot.docs;
  const BATCH_SIZE = 400; // Safe chunk size (Firestore limit is 500 operations per batch)

  for (let i = 0; i < docs.length; i += BATCH_SIZE) {
    const batch = writeBatch(firestore);
    const chunk = docs.slice(i, i + BATCH_SIZE);
    chunk.forEach((docSnap) => {
      batch.delete(docSnap.ref);
    });
    await batch.commit();
  }

  return docs.length;
}

/**
 * Performs one-time migration of legacy localStorage tasks into the user's Firestore collection.
 */
export async function migrateLocalStorageTasksToFirestore(
  uid: string,
  legacyTasks: Task[],
  authorName?: string,
  authorEmail?: string
): Promise<boolean> {
  if (!db || legacyTasks.length === 0) return true;

  try {
    const firestore = db;
    const batch = writeBatch(firestore);
    const tasksCollectionRef = collection(firestore, 'users', uid, 'tasks');

    legacyTasks.forEach((task, idx) => {
      const docRef = task.id ? doc(tasksCollectionRef, task.id) : doc(tasksCollectionRef);
      batch.set(docRef, {
        taskNumber: task.taskNumber || 'TASK-001',
        title: task.title,
        description: task.description || null,
        status: task.status || 'todo',
        priority: task.priority || null,
        dueDate: task.dueDate || null,
        tags: task.tags || [],
        order: typeof task.order === 'number' ? task.order : idx,
        createdBy: task.createdBy || authorName || null,
        createdByUid: task.createdByUid || uid,
        createdByEmail: task.createdByEmail || authorEmail || null,
        createdByPhotoURL: task.createdByPhotoURL || null,
        createdAt: task.createdAt ? new Date(task.createdAt) : serverTimestamp(),
        updatedAt: task.updatedAt ? new Date(task.updatedAt) : serverTimestamp(),
        completedAt: task.completedAt ? new Date(task.completedAt) : null,
        deletedAt: task.deletedAt ? new Date(task.deletedAt) : null,
      });
    });

    await batch.commit();
    return true;
  } catch (error) {
    console.error('[TaskService] Migration to Firestore failed:', error);
    return false;
  }
}
