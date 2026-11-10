import axios from 'axios';
import { api } from './api';
import type { Task, TaskInput } from '../types/Task';

interface ApiResponse<T> { message: string; data: T }

export function getTasks(): Promise<Task[]> {
  return api.get<ApiResponse<Task[]>>('/tasks').then(({ data }) => data.data);
}

export function getTask(id: number): Promise<Task> {
  return api.get<ApiResponse<Task>>(`/tasks/${id}`).then(({ data }) => data.data);
}

export function createTask(task: TaskInput): Promise<Task> {
  return api.post<ApiResponse<Task>>('/tasks', task).then(({ data }) => data.data);
}

export function updateTask(id: number, task: TaskInput): Promise<Task> {
  return api.put<ApiResponse<Task>>(`/tasks/${id}`, task).then(({ data }) => data.data);
}

export function deleteTask(id: number): Promise<void> {
  return api.delete(`/tasks/${id}`).then(() => undefined);
}

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError<{ message?: string }>(error)) {
    return error.response?.data?.message ?? (error.code === 'ERR_NETWORK'
      ? 'Unable to reach the task API. Check that the backend is running on port 3000.'
      : error.message);
  }
  return error instanceof Error ? error.message : 'Something went wrong. Please try again.';
}
