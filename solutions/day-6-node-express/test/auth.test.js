const { test } = require('node:test');
const assert = require('node:assert/strict');
process.env.JWT_SECRET ||= 'test-only-secret-with-at-least-thirty-two-characters';
const jwt = require('jsonwebtoken');
const { app } = require('../src/app');

async function withServer(run) {
  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  try { await run(`http://127.0.0.1:${server.address().port}`); }
  finally { await new Promise((resolve) => server.close(resolve)); }
}

test('protected APIs return 401 when authentication is missing', async () => withServer(async (base) => {
  const response = await fetch(`${base}/auth/me`);
  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), { message: 'Authentication required' });
  assert.equal((await fetch(`${base}/tasks`)).status, 401);
}));

test('registration and login reject missing or invalid credentials', async () => withServer(async (base) => {
  const csrfResponse = await fetch(`${base}/auth/csrf`);
  const csrfToken = (await csrfResponse.json()).csrfToken;
  const csrfCookie = csrfResponse.headers.getSetCookie().map((value) => value.split(';')[0]).find((value) => value.startsWith('csrf_token='));
  const headers = { 'content-type': 'application/json', cookie: csrfCookie, 'x-csrf-token': csrfToken };
  const response = await fetch(`${base}/auth/register`, { method: 'POST', headers, body: '{}' });
  assert.equal(response.status, 400);
  assert.ok((await response.json()).message);
  const invalid = await fetch(`${base}/auth/register`, { method: 'POST', headers, body: JSON.stringify({ email: 'not-an-email', password: 'too-short' }) });
  assert.equal(invalid.status, 400);
  const tooManyBytes = await fetch(`${base}/auth/register`, { method: 'POST', headers, body: JSON.stringify({ email: 'learner@example.test', password: 'a'.repeat(12) + 'é'.repeat(31) }) });
  assert.equal(tooManyBytes.status, 400);
}));

test('invalid and expired JWTs are rejected with 401 before database access', async () => withServer(async (base) => {
  for (const token of ['not-a-token', jwt.sign({ sub: '1' }, process.env.JWT_SECRET, { expiresIn: -1, issuer: 's3-training-api', audience: 's3-training-client' })]) {
    const response = await fetch(`${base}/auth/me`, { headers: { cookie: `s3_training_session=${token}` } });
    assert.equal(response.status, 401);
    assert.deepEqual(await response.json(), { message: 'Authentication required' });
  }
}));

test('state-changing requests carrying an auth cookie require a CSRF token', async () => withServer(async (base) => {
  const response = await fetch(`${base}/auth/logout`, { method: 'POST', headers: { cookie: 's3_training_session=present' } });
  assert.equal(response.status, 403);
  assert.deepEqual(await response.json(), { message: 'CSRF token missing or invalid' });
  const login = await fetch(`${base}/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' });
  assert.equal(login.status, 403);
}));

test('CORS permits the configured frontend origin with credentials', async () => withServer(async (base) => {
  const response = await fetch(`${base}/health`, { headers: { Origin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173' } });
  assert.equal(response.headers.get('access-control-allow-origin'), process.env.FRONTEND_ORIGIN || 'http://localhost:5173');
  assert.equal(response.headers.get('access-control-allow-credentials'), 'true');
}));

test('login rate limit returns 429 after five failed attempts', async () => withServer(async (base) => {
  const csrfResponse = await fetch(`${base}/auth/csrf`);
  const csrfToken = (await csrfResponse.json()).csrfToken;
  const csrfCookie = csrfResponse.headers.getSetCookie().map((value) => value.split(';')[0]).find((value) => value.startsWith('csrf_token='));
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const response = await fetch(`${base}/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json', cookie: csrfCookie, 'x-csrf-token': csrfToken }, body: '{}' });
    assert.equal(response.status, 400);
  }
  const limited = await fetch(`${base}/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json', cookie: csrfCookie, 'x-csrf-token': csrfToken }, body: '{}' });
  assert.equal(limited.status, 429);
  assert.deepEqual(await limited.json(), { message: 'Too many login attempts. Try again later.' });
}));
