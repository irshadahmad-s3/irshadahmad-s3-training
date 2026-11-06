export type TaskStatus = 'pending' | 'in-progress' | 'completed';

export interface Task {
  id: number;
  title: string;
  notes: string;
  status: TaskStatus;
  dueDate: string;
  owner: string;
}

export type TaskInput = Omit<Task, 'id'>;
