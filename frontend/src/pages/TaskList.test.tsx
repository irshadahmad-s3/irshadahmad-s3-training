import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TaskProvider } from '../context/TaskContext';
import type { Task } from '../types/Task';
import { TaskList } from './TaskList';

const { getTasks, createTask, deleteTask, getErrorMessage, updateTask } = vi.hoisted(() => ({
  getTasks: vi.fn(), createTask: vi.fn(), deleteTask: vi.fn(),
  getErrorMessage: vi.fn((error: unknown) => error instanceof Error ? error.message : 'Request failed'),
  updateTask: vi.fn(),
}));
vi.mock('../services/taskService', () => ({ getTasks, createTask, deleteTask, getErrorMessage, updateTask }));
vi.mock('../context/AuthContext', () => ({ useAuth: () => ({ user: { email: 'owner@example.test', id: 1, role: 'user' } }) }));

const task: Task = { id: 1, title: 'Ship release', notes: 'Finish review', status: 'pending', dueDate: '2026-12-20', owner: 'owner@example.test' };
function renderTasks() { return render(<MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><TaskProvider><TaskList /></TaskProvider></MemoryRouter>); }

describe('task list', () => {
  beforeEach(() => {
    getTasks.mockReset().mockResolvedValue([]);
    createTask.mockReset();
    deleteTask.mockReset();
    updateTask.mockReset();
  });

  it('shows a loading state while tasks are fetched', () => {
    getTasks.mockReturnValue(new Promise(() => {}));
    renderTasks();
    expect(screen.getByRole('status')).toHaveTextContent('Loading tasks');
  });

  it('shows a fetch error and lets the user retry', async () => {
    getTasks.mockRejectedValueOnce(new Error('Unable to reach the API')).mockResolvedValueOnce([]);
    renderTasks();
    expect(await screen.findByText('Unable to reach the API')).toBeVisible();
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    await waitFor(() => expect(getTasks).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(screen.queryByText('Unable to reach the API')).not.toBeInTheDocument());
  });

  it('renders tasks and filters visible cards by the search field', async () => {
    getTasks.mockResolvedValue([task, { ...task, id: 2, title: 'Write documentation' }]);
    renderTasks();
    expect(await screen.findByRole('link', { name: 'Ship release' })).toBeVisible();
    expect(screen.getByRole('link', { name: 'Write documentation' })).toBeVisible();
    await userEvent.type(screen.getByRole('textbox', { name: 'Search tasks by title' }), 'release');
    expect(screen.getByRole('link', { name: 'Ship release' })).toBeVisible();
    expect(screen.queryByRole('link', { name: 'Write documentation' })).not.toBeInTheDocument();
  });

  it('creates a task from the task form and displays the saved task', async () => {
    createTask.mockResolvedValue(task);
    renderTasks();
    const actor = userEvent.setup();
    await actor.click(screen.getByRole('button', { name: /Add task/ }));
    await actor.type(screen.getByLabelText('Task title'), task.title);
    await actor.type(screen.getByLabelText('Description'), task.notes);
    await actor.type(screen.getByLabelText('Due date'), task.dueDate);
    await actor.click(screen.getByRole('button', { name: 'Create task' }));
    expect(await screen.findByRole('link', { name: task.title })).toBeVisible();
    expect(createTask).toHaveBeenCalledWith(expect.objectContaining({ title: task.title, owner: task.owner }));
  }, 15000);

  it('opens an existing task for editing and displays the updated task', async () => {
    getTasks.mockResolvedValue([task]);
    const updated = { ...task, title: 'Updated release task' };
    updateTask.mockResolvedValue(updated);
    renderTasks();
    const actor = userEvent.setup();
    await screen.findByRole('link', { name: task.title });
    await actor.click(screen.getByRole('button', { name: 'Edit' }));
    expect(screen.getByRole('heading', { name: 'Edit task' })).toBeVisible();
    await actor.clear(screen.getByLabelText('Task title'));
    await actor.type(screen.getByLabelText('Task title'), updated.title);
    await actor.click(screen.getByRole('button', { name: 'Save changes' }));
    expect(await screen.findByRole('link', { name: updated.title })).toBeVisible();
    expect(updateTask).toHaveBeenCalledWith(task.id, expect.objectContaining({ title: updated.title }));
  }, 15000);

  it('keeps the edit form open and shows an update error', async () => {
    getTasks.mockResolvedValue([task]);
    updateTask.mockRejectedValue(new Error('Update request failed'));
    renderTasks();
    const actor = userEvent.setup();
    await screen.findByRole('link', { name: task.title });
    await actor.click(screen.getByRole('button', { name: 'Edit' }));
    await actor.clear(screen.getByLabelText('Task title'));
    await actor.type(screen.getByLabelText('Task title'), 'Changed title');
    await actor.click(screen.getByRole('button', { name: 'Save changes' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Update request failed');
    expect(screen.getByRole('heading', { name: 'Edit task' })).toBeVisible();
  }, 15000);

  it('closes a new task form when the user cancels', async () => {
    renderTasks();
    const actor = userEvent.setup();
    await actor.click(screen.getByRole('button', { name: /Add task/ }));
    await actor.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByRole('heading', { name: 'Create a task' })).not.toBeInTheDocument();
  });

  it('deletes a task after confirmation', async () => {
    getTasks.mockResolvedValue([task]);
    deleteTask.mockResolvedValue(undefined);
    renderTasks();
    const actor = userEvent.setup();
    await screen.findByRole('link', { name: task.title });
    await actor.click(screen.getByRole('button', { name: 'Delete' }));
    await actor.click(screen.getByRole('button', { name: 'Delete task' }));
    await waitFor(() => expect(screen.queryByRole('link', { name: task.title })).not.toBeInTheDocument());
    expect(deleteTask).toHaveBeenCalledWith(task.id);
  }, 15000);

  it('keeps the task and reports a failed delete action', async () => {
    getTasks.mockResolvedValue([task]);
    deleteTask.mockRejectedValue(new Error('Delete request failed'));
    renderTasks();
    const actor = userEvent.setup();
    await screen.findByRole('link', { name: task.title });
    await actor.click(screen.getByRole('button', { name: 'Delete' }));
    expect(screen.getByRole('dialog', { name: 'Delete this task?' })).toBeVisible();
    await actor.click(screen.getByRole('button', { name: 'Delete task' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Delete request failed');
    expect(screen.getByRole('link', { name: task.title })).toBeVisible();
    expect(deleteTask).toHaveBeenCalledWith(task.id);
  }, 15000);
});
