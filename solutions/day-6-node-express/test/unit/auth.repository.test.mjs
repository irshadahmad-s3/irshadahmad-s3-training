import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createRequire } from 'node:module';

const testRequire = createRequire(import.meta.url);
const query = vi.fn();
const dbPath = testRequire.resolve('../../src/db.js');
testRequire.cache[dbPath] = { id: dbPath, filename: dbPath, loaded: true, exports: { pool: { query } } };
const repository = testRequire('../../src/auth.repository.js');

describe('auth repository', () => {
  beforeEach(() => query.mockReset());

  it('creates a user with the default role and returns its public fields', async () => {
    const user = { id: 4, email: 'a@example.test', role: 'user' };
    query.mockResolvedValue({ rows: [user] });
    await expect(repository.createUser(user.email, 'hash')).resolves.toEqual(user);
    expect(query).toHaveBeenCalledWith(expect.stringContaining("VALUES ($1, $2, 'user')"), [user.email, 'hash']);
  });

  it('looks up users by normalized email input and lists users without password hashes', async () => {
    const user = { id: 4, email: 'a@example.test', role: 'user', password_hash: 'hash' };
    query.mockResolvedValueOnce({ rows: [user] }).mockResolvedValueOnce({ rows: [{ id: 4, email: user.email, role: user.role }] });
    await expect(repository.findUserByEmail(user.email)).resolves.toEqual(user);
    await expect(repository.listUsers()).resolves.toEqual([{ id: 4, email: user.email, role: 'user' }]);
    expect(query.mock.calls[0][1]).toEqual([user.email]);
  });

  it('returns undefined when no matching email exists', async () => {
    query.mockResolvedValue({ rows: [] });
    await expect(repository.findUserByEmail('missing@example.test')).resolves.toBeUndefined();
  });

});
