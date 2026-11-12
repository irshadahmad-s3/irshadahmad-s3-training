import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createRequire } from 'node:module';

const testRequire = createRequire(import.meta.url);
const query = vi.fn();
const dbPath = testRequire.resolve('../../src/db.js');
testRequire.cache[dbPath] = { id: dbPath, filename: dbPath, loaded: true, exports: { pool: { query } } };
const repository = testRequire('../../src/task.repository.js');

const task = { id: 3, title: 'Write tests', notes: '', status: 'pending', dueDate: '2026-12-01', owner: 'a@example.test' };
const user = { id: 7, role: 'user' };

describe('task repository', () => {
  beforeEach(() => query.mockReset());

  it('creates a task with its owner account and returns the API field names', async () => {
    query.mockResolvedValue({ rows: [task] });
    await expect(repository.createTask({ ...task, userId: user.id })).resolves.toEqual(task);
    expect(query.mock.calls[0][0]).toContain('user_id');
    expect(query.mock.calls[0][1]).toEqual([task.title, task.notes, task.status, task.dueDate, task.owner, user.id]);
  });

  it('scopes list and read queries to the current account', async () => {
    query.mockResolvedValueOnce({ rows: [task] }).mockResolvedValueOnce({ rows: [task] });
    await expect(repository.getAllTasks(user)).resolves.toEqual([task]);
    await expect(repository.getTaskById(task.id, user)).resolves.toEqual(task);
    expect(query.mock.calls[0][1]).toEqual(['user', user.id]);
    expect(query.mock.calls[1][1]).toEqual([task.id, 'user', user.id]);
  });

  it('allows admin queries to span owners', async () => {
    query.mockResolvedValue({ rows: [task] });
    await repository.getAllTasks({ id: 1, role: 'admin' });
    expect(query.mock.calls[0][1]).toEqual(['admin', 1]);
  });

  it('updates and deletes only records visible to the supplied user', async () => {
    query.mockResolvedValueOnce({ rows: [task] }).mockResolvedValueOnce({ rowCount: 1 });
    await expect(repository.updateTask(task.id, task, user)).resolves.toEqual(task);
    await expect(repository.deleteTask(task.id, user)).resolves.toBe(true);
    expect(query.mock.calls[0][1]).toEqual([task.title, task.notes, task.status, task.dueDate, task.owner, task.id, 'user', user.id]);
    expect(query.mock.calls[1][1]).toEqual([task.id, 'user', user.id]);
  });

  it('returns absent results for missing task updates and deletes', async () => {
    query.mockResolvedValueOnce({ rows: [] }).mockResolvedValueOnce({ rowCount: 0 });
    await expect(repository.updateTask(404, task, user)).resolves.toBeUndefined();
    await expect(repository.deleteTask(404, user)).resolves.toBe(false);
  });

});
