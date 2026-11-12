import { beforeEach, describe, expect, it, vi } from 'vitest';
import jwt from 'jsonwebtoken';
import { createRequire } from 'node:module';

const testRequire = createRequire(import.meta.url);
const query = vi.fn();
const dbPath = testRequire.resolve('../../src/db.js');
testRequire.cache[dbPath] = { id: dbPath, filename: dbPath, loaded: true, exports: { pool: { query } } };
const auth = testRequire('../../src/auth.js');
const secret = 'a-unit-test-signing-secret-longer-than-32-bytes';

describe('authentication helpers and middleware', () => {
  beforeEach(() => {
    query.mockReset();
    process.env.JWT_SECRET = secret;
  });

  it('requires a sufficiently long JWT secret before signing', () => {
    delete process.env.JWT_SECRET;
    expect(() => auth.assertConfigured()).toThrow('JWT_SECRET must be set');
    process.env.JWT_SECRET = 'short';
    expect(() => auth.issueToken({ id: 1 })).toThrow('JWT_SECRET must be set');
  });

  it('issues a scoped token and sets an HTTP only strict session cookie', () => {
    const user = { id: 12 };
    const token = auth.issueToken(user);
    expect(jwt.verify(token, secret, { issuer: 's3-training-api', audience: 's3-training-client' }).sub).toBe('12');
    const res = { cookie: vi.fn() };
    auth.setSession(res, user);
    expect(res.cookie).toHaveBeenCalledWith(auth.COOKIE_NAME, expect.any(String), expect.objectContaining({ httpOnly: true, sameSite: 'strict', maxAge: 3600000 }));
    expect(auth.cookieOptions().secure).toBe(false);
    process.env.NODE_ENV = 'production';
    expect(auth.cookieOptions().secure).toBe(true);
    delete process.env.NODE_ENV;
  });

  it('hashes passwords and verifies only a matching password', async () => {
    const hash = await auth.hashPassword('correct horse battery staple');
    expect(hash).not.toBe('correct horse battery staple');
    await expect(auth.verifyPassword('correct horse battery staple', hash)).resolves.toBe(true);
    await expect(auth.verifyPassword('wrong password', hash)).resolves.toBe(false);
  }, 30000);

  it('rejects missing, malformed, expired and unknown sessions', async () => {
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    await auth.authenticate({ get: () => undefined, cookies: {} }, res, vi.fn());
    expect(res.status).toHaveBeenCalledWith(401);
    for (const token of ['not-a-jwt', jwt.sign({ sub: '1' }, secret, { expiresIn: -1, issuer: 's3-training-api', audience: 's3-training-client' })]) {
      await auth.authenticate({ get: () => `Bearer ${token}`, cookies: {} }, res, vi.fn());
      expect(res.status).toHaveBeenLastCalledWith(401);
    }
    query.mockResolvedValue({ rows: [] });
    await auth.authenticate({ get: () => undefined, cookies: { [auth.COOKIE_NAME]: auth.issueToken({ id: 9 }) } }, res, vi.fn());
    expect(res.status).toHaveBeenLastCalledWith(401);
  });

  it('loads the authenticated user from the database and accepts cookie sessions', async () => {
    const user = { id: 9, email: 'user@example.test', role: 'user' };
    query.mockResolvedValue({ rows: [user] });
    const req = { get: () => undefined, cookies: { [auth.COOKIE_NAME]: auth.issueToken(user) } };
    const next = vi.fn();
    await auth.authenticate(req, {}, next);
    expect(req.user).toEqual(user);
    expect(next).toHaveBeenCalledOnce();
  });

  it('passes infrastructure failures to Express error handling', async () => {
    const failure = new Error('database unavailable');
    query.mockRejectedValue(failure);
    const next = vi.fn();
    await auth.authenticate({ get: () => `Bearer ${auth.issueToken({ id: 1 })}`, cookies: {} }, {}, next);
    expect(next).toHaveBeenCalledWith(failure);
  });

  it('enforces allowed roles and matching CSRF cookie/header tokens', () => {
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    const next = vi.fn();
    auth.requireRole('admin')({ user: { role: 'admin' } }, res, next);
    expect(next).toHaveBeenCalledOnce();
    auth.requireRole('admin')({ user: { role: 'user' } }, res, vi.fn());
    expect(res.status).toHaveBeenCalledWith(403);
    auth.requireCsrf({ method: 'GET' }, res, next);
    auth.requireCsrf({ method: 'POST', cookies: { csrf_token: 'same' }, get: () => 'same' }, res, next);
    expect(next).toHaveBeenCalledTimes(3);
    auth.requireCsrf({ method: 'DELETE', cookies: { csrf_token: 'first' }, get: () => 'different' }, res, vi.fn());
    expect(res.status).toHaveBeenLastCalledWith(403);
  });
});
