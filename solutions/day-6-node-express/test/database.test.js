const { test } = require('node:test');
const assert = require('node:assert/strict');
if (process.env.RUN_DB_TESTS === '1') process.env.ENABLE_SQL_INJECTION_DEMO ||= 'true';
const { pool } = require('../src/db');
const { mongo } = require('../src/notes');
const { closeMongo } = require('../src/mongo-db');
const { after } = require('node:test');
const { once } = require('node:events');
process.env.JWT_SECRET ||= 'test-only-secret-with-at-least-thirty-two-characters';
const { app } = require('../src/app');
const { hashPassword } = require('../src/auth');

// Run with RUN_DB_TESTS=1 after starting both database services and initializing PostgreSQL.
const enabled = process.env.RUN_DB_TESTS === '1';
const sample = { title: 'Integration test note', description: 'CRUD verification', status: 'open' };
after(async () => { await Promise.all([pool.end(), closeMongo()]); });

async function createClient(base, email = `test-${Date.now()}-${Math.random()}@example.test`) {
  const csrfResponse = await fetch(`${base}/auth/csrf`);
  const csrfToken = (await csrfResponse.json()).csrfToken;
  const cookieValues = csrfResponse.headers.getSetCookie().map((value) => value.split(';')[0]);
  const csrfCookie = cookieValues.find((value) => value.startsWith('csrf_token='));
  const response = await fetch(`${base}/auth/register`, {
    method: 'POST', headers: { 'content-type': 'application/json', 'x-csrf-token': csrfToken, cookie: csrfCookie },
    body: JSON.stringify({ email, password: 'training-test-password-123' }),
  });
  if (response.status !== 201) throw new Error(`Test user registration returned ${response.status}`);
  const user = (await response.json()).user;
  const sessionHeader = response.headers.getSetCookie().find((value) => value.startsWith('s3_training_session='));
  assert.ok(sessionHeader.includes('HttpOnly'));
  assert.ok(sessionHeader.includes('SameSite=Strict'));
  assert.ok(sessionHeader.includes('Max-Age=3600'));
  const sessionCookie = sessionHeader.split(';')[0];
  const cookie = `${csrfCookie}; ${sessionCookie}`;
  return { user, email, csrfToken, cookie, headers: { cookie, 'x-csrf-token': csrfToken } };
}

test('PostgreSQL notes support create, list, read, update, delete', { skip: !enabled }, async () => {
  let id;
  try {
    const created = (await pool.query('INSERT INTO notes(title,description,status) VALUES($1,$2,$3) RETURNING id', [sample.title, sample.description, sample.status])).rows[0];
    id = created.id;
    const listed = await pool.query('SELECT id FROM notes WHERE id=$1', [id]);
    if (listed.rowCount !== 1) throw new Error('Created note was not listed');
    const updated = await pool.query("UPDATE notes SET title='Updated integration test' WHERE id=$1 RETURNING title", [id]);
    if (updated.rows[0].title !== 'Updated integration test') throw new Error('Note update failed');
    const deleted = await pool.query('DELETE FROM notes WHERE id=$1', [id]);
    if (deleted.rowCount !== 1) throw new Error('Note delete failed');
  } finally { if (id) await pool.query('DELETE FROM notes WHERE id=$1', [id]); }
});

test('MongoDB notes support create, list, read, update, delete', { skip: !enabled }, async () => {
  let created;
  try {
    created = await mongo.create(sample);
    if (!(await mongo.all()).some((note) => note.id === created.id)) throw new Error('Created note was not listed');
    if ((await mongo.byId(created.id)).title !== sample.title) throw new Error('Note read failed');
    const updated = await mongo.update(created.id, { ...sample, title: 'Updated integration test' });
    if (updated.title !== 'Updated integration test') throw new Error('Note update failed');
    if (!(await mongo.delete(created.id))) throw new Error('Note delete failed');
    created = undefined;
  } finally { if (created) await mongo.delete(created.id); }
});

test('Tasks API reads and writes PostgreSQL records over HTTP', { skip: !enabled }, async () => {
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const base = `http://127.0.0.1:${server.address().port}`;
  let id;
  let client;
  try {
    client = await createClient(base);
    let response = await fetch(`${base}/tasks`, { method: 'POST', headers: { ...client.headers, 'content-type': 'application/json' }, body: JSON.stringify({ title: 'API integration task', notes: 'PostgreSQL CRUD', status: 'pending', dueDate: '2026-12-15', owner: 'forged owner' }) });
    if (response.status !== 201) throw new Error(`Task create returned ${response.status}`);
    const created = await response.json();
    id = created.data.id;
    response = await fetch(`${base}/tasks/${id}`, { headers: client.headers });
    if ((await response.json()).data.title !== 'API integration task') throw new Error('Task read failed');
    response = await fetch(`${base}/tasks/${id}`, { method: 'PUT', headers: { ...client.headers, 'content-type': 'application/json' }, body: JSON.stringify({ title: 'Updated API integration task', notes: 'Updated', status: 'in-progress', dueDate: '2026-12-16', owner: 'forged owner' }) });
    if ((await response.json()).data.title !== 'Updated API integration task') throw new Error('Task update failed');
    response = await fetch(`${base}/tasks/${id}`, { method: 'DELETE', headers: client.headers });
    if (response.status !== 200) throw new Error('Task delete failed');
    id = undefined;
  } finally {
    if (id) await pool.query('DELETE FROM tasks WHERE id=$1', [id]);
    if (client) await pool.query('DELETE FROM users WHERE id=$1', [client.user.id]);
    await new Promise((resolve) => server.close(resolve));
  }
});

test('Notes API exposes equivalent CRUD endpoints for PostgreSQL and MongoDB', { skip: !enabled }, async () => {
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const base = `http://127.0.0.1:${server.address().port}`;
  let client;
  try {
    client = await createClient(base);
    for (const database of ['postgres', 'mongo']) {
      const endpoint = `${base}/notes/${database}`;
      let response = await fetch(endpoint, { method: 'POST', headers: { ...client.headers, 'content-type': 'application/json' }, body: JSON.stringify(sample) });
      if (response.status !== 201) throw new Error(`${database} note create returned ${response.status}`);
      const created = (await response.json()).data;
      try {
        response = await fetch(endpoint, { headers: client.headers });
        if (!(await response.json()).data.some((note) => String(note.id) === String(created.id))) throw new Error(`${database} note list failed`);
        response = await fetch(`${endpoint}/${created.id}`, { headers: client.headers });
        if ((await response.json()).data.title !== sample.title) throw new Error(`${database} note read failed`);
        response = await fetch(`${endpoint}/${created.id}`, { method: 'PUT', headers: { ...client.headers, 'content-type': 'application/json' }, body: JSON.stringify({ ...sample, title: 'Updated via API' }) });
        if ((await response.json()).data.title !== 'Updated via API') throw new Error(`${database} note update failed`);
      } finally {
        await fetch(`${endpoint}/${created.id}`, { method: 'DELETE', headers: client.headers });
      }
    }
  } finally { if (client) await pool.query('DELETE FROM users WHERE id=$1', [client.user.id]); await new Promise((resolve) => server.close(resolve)); }
});

test('registration, login, duplicate email, roles, ownership, and logout work', { skip: !enabled }, async () => {
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const base = `http://127.0.0.1:${server.address().port}`;
  let first;
  let second;
  let adminId;
  let taskId;
  const email = `auth-${Date.now()}@example.test`;
  try {
    first = await createClient(base, email);
    assert.equal(first.user.role, 'user');
    const registrationCookie = (await fetch(`${base}/auth/csrf`)).headers.getSetCookie();
    assert.ok(registrationCookie.some((value) => value.startsWith('csrf_token=') && value.includes('SameSite=Strict')));
    assert.ok((await fetch(`${base}/auth/login`, { method: 'POST', headers: { ...first.headers, 'content-type': 'application/json' }, body: JSON.stringify({ email, password: 'training-test-password-123' }) })).status === 200);
    assert.equal((await fetch(`${base}/auth/register`, { method: 'POST', headers: { ...first.headers, 'content-type': 'application/json' }, body: JSON.stringify({ email, password: 'training-test-password-123', role: 'admin' }) })).status, 409);
    const wrong = await fetch(`${base}/auth/login`, { method: 'POST', headers: { ...first.headers, 'content-type': 'application/json' }, body: JSON.stringify({ email, password: 'incorrect-password-123' }) });
    assert.equal(wrong.status, 401);
    assert.equal((await wrong.json()).message, 'Invalid email or password');
    assert.equal((await fetch(`${base}/auth/me`, { headers: first.headers })).status, 200);
    assert.equal((await fetch(`${base}/admin/users`, { headers: first.headers })).status, 403);

    const forgedEmail = `forged-role-${Date.now()}@example.test`;
    const forgedCsrf = await fetch(`${base}/auth/csrf`);
    const forgedCookie = forgedCsrf.headers.getSetCookie().map((value) => value.split(';')[0]).find((value) => value.startsWith('csrf_token='));
    const forgedToken = (await forgedCsrf.json()).csrfToken;
    const forgedResponse = await fetch(`${base}/auth/register`, { method: 'POST', headers: { cookie: forgedCookie, 'x-csrf-token': forgedToken, 'content-type': 'application/json' }, body: JSON.stringify({ email: forgedEmail, password: 'training-test-password-123', role: 'admin' }) });
    assert.equal(forgedResponse.status, 201);
    const forgedUser = (await forgedResponse.json()).user;
    assert.equal(forgedUser.role, 'user');
    await pool.query('DELETE FROM users WHERE id=$1', [forgedUser.id]);

    second = await createClient(base);
    const created = await fetch(`${base}/tasks`, { method: 'POST', headers: { ...first.headers, 'content-type': 'application/json' }, body: JSON.stringify({ title: 'Private owner task', notes: '', status: 'pending', dueDate: '2026-12-15', owner: 'attacker' }) });
    taskId = (await created.json()).data.id;
    assert.equal((await fetch(`${base}/tasks/${taskId}`, { headers: second.headers })).status, 404);
    assert.equal((await fetch(`${base}/tasks/${taskId}`, { method: 'PUT', headers: { ...second.headers, 'content-type': 'application/json' }, body: JSON.stringify({ title: 'Changed by another account', notes: '', status: 'completed', dueDate: '2026-12-15', owner: first.email }) })).status, 404);
    assert.equal((await fetch(`${base}/tasks/${taskId}`, { method: 'DELETE', headers: second.headers })).status, 404);

    const { rows } = await pool.query("INSERT INTO users(email,password_hash,role) VALUES($1,$2,'admin') RETURNING id", [`admin-${Date.now()}@example.test`, await hashPassword('training-admin-password-123')]);
    adminId = rows[0].id;
    const admin = await createClient(base, `admin-client-${Date.now()}@example.test`);
    await pool.query("UPDATE users SET role='admin' WHERE id=$1", [admin.user.id]);
    const csrfAgain = await fetch(`${base}/auth/csrf`);
    const adminCookie = csrfAgain.headers.getSetCookie().map((value) => value.split(';')[0]).find((value) => value.startsWith('csrf_token='));
    const adminToken = (await csrfAgain.json()).csrfToken;
    const adminLogin = await fetch(`${base}/auth/login`, { method: 'POST', headers: { cookie: adminCookie, 'x-csrf-token': adminToken, 'content-type': 'application/json' }, body: JSON.stringify({ email: admin.email, password: 'training-test-password-123' }) });
    const loginCookies = adminLogin.headers.getSetCookie().map((value) => value.split(';')[0]);
    const adminSession = loginCookies.find((value) => value.startsWith('s3_training_session='));
    const adminHeaders = { cookie: `${adminCookie}; ${adminSession}`, 'x-csrf-token': adminToken };
    assert.equal(adminLogin.status, 200);
    assert.equal((await adminLogin.json()).user.role, 'admin');
    assert.equal((await fetch(`${base}/admin/users`, { headers: adminHeaders })).status, 200);
    const logout = await fetch(`${base}/auth/logout`, { method: 'POST', headers: adminHeaders });
    assert.equal(logout.status, 200);
    assert.ok(logout.headers.getSetCookie().some((value) => value.startsWith('s3_training_session=') && value.includes('Expires=')));
    assert.equal((await fetch(`${base}/auth/me`, { headers: { cookie: adminCookie } })).status, 401);
    await pool.query('DELETE FROM users WHERE id=$1', [admin.user.id]);
  } finally {
    if (taskId) await pool.query('DELETE FROM tasks WHERE id=$1', [taskId]);
    for (const client of [first, second]) if (client) await pool.query('DELETE FROM users WHERE id=$1', [client.user.id]);
    if (adminId) await pool.query('DELETE FROM users WHERE id=$1', [adminId]);
    await new Promise((resolve) => server.close(resolve));
  }
});

test('SQL injection lesson changes only the two dummy rows and parameterized result is safe', { skip: !enabled }, async () => {
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  try {
    const base = `http://127.0.0.1:${server.address().port}`;
    const payload = "' OR '1'='1'-- ";
    const result = await fetch(`${base}/dev/sql-injection-demo?${new URLSearchParams({ name: payload })}`);
    assert.equal(result.status, 200);
    const data = await result.json();
    assert.deepEqual(data.unsafe.map((row) => row.username), ['alice', 'bob']);
    assert.deepEqual(data.safe, []);
  } finally { await new Promise((resolve) => server.close(resolve)); }
});
