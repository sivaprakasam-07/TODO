export type Status = 'todo' | 'in-progress' | 'completed';

export type Priority = 'low' | 'medium' | 'high';

export interface Task {
  id: string;
  taskNumber: string; // e.g. "TASK-001"
  title: string;
  description?: string;
  status: Status;
  priority?: Priority;
  dueDate?: string; // YYYY-MM-DD format
  tags: string[];
  createdAt: string;
  updatedAt: string;
  completedAt?: string | null;
  deletedAt?: string | null; // For soft delete / undo
  createdBy?: string;        // Creator display name e.g. "Tamil mani Siva Prakasam"
  createdByUid?: string;     // Creator Firebase UID
  createdByEmail?: string;   // Creator Email
  createdByPhotoURL?: string;// Creator Profile Photo
}

export type ActiveView = 'board' | 'calendar' | 'profile';
