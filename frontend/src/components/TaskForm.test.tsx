import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TaskForm } from './TaskForm';
import type { Task, TaskInput } from '../types/Task';

const { user } = vi.hoisted(() => ({ user: { email: 'owner@example.test' } }));
vi.mock('../context/AuthContext', () => ({ useAuth: () => ({ user }) }));

const task: Task = { id: 1, title: 'Existing task', notes: 'Details', status: 'pending', dueDate: '2026-12-01', owner: 'owner@example.test' };

describe('task form', () => {
  beforeEach(() => { user.email = 'owner@example.test'; });

  it('validates required fields and submits entered task details', async () => {
    const onSubmit = vi.fn<(input: TaskInput) => Promise<void>>().mockResolvedValue(undefined);
    const onCancel = vi.fn();
    const actor = userEvent.setup();
    render(<TaskForm onSubmit={onSubmit} onCancel={onCancel} />);
    expect(screen.getByLabelText(/Task owner/)).toHaveValue('owner@example.test');
    await actor.click(screen.getByRole('button', { name: 'Create task' }));
    expect(onSubmit).not.toHaveBeenCalled();
    await actor.type(screen.getByLabelText('Task title'), 'Plan release');
    await actor.type(screen.getByLabelText('Description'), 'Prepare release notes');
    await actor.type(screen.getByLabelText('Due date'), '2026-12-20');
    await actor.click(screen.getByRole('button', { name: 'Create task' }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({ title: 'Plan release', notes: 'Prepare release notes', status: 'pending', dueDate: '2026-12-20', owner: 'owner@example.test' }));
  });

  it('shows save errors and allows cancellation', async () => {
    const onSubmit = vi.fn().mockRejectedValue(new Error('The API is unavailable'));
    const onCancel = vi.fn();
    render(<TaskForm task={task} onSubmit={onSubmit} onCancel={onCancel} submitLabel="Save changes" />);
    fireEvent.submit(screen.getByRole('button', { name: 'Save changes' }).closest('form')!);
    expect(await screen.findByRole('alert')).toHaveTextContent('The API is unavailable');
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalledOnce();
  });
});
