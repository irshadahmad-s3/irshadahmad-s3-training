const { test } = require('node:test');
const { pool } = require('../src/db');
const { mongo } = require('../src/notes');
const { closeMongo } = require('../src/mongo-db');
const { after } = require('node:test');
const { once } = require('node:events');
const { app } = require('../src/app');

// Run with RUN_DB_TESTS=1 after starting both database services and initializing PostgreSQL.
const enabled = process.env.RUN_DB_TESTS === '1';
const sample = { title: 'Integration test note', description: 'CRUD verification', status: 'open' };
after(async () => { await Promise.all([pool.end(), closeMongo()]); });

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
  try {
    let response = await fetch(`${base}/tasks`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ title: 'API integration task', notes: 'PostgreSQL CRUD', status: 'pending', dueDate: '2026-12-15', owner: 'Day 7 tests' }) });
    if (response.status !== 201) throw new Error(`Task create returned ${response.status}`);
    const created = await response.json();
    id = created.data.id;
    response = await fetch(`${base}/tasks/${id}`);
    if ((await response.json()).data.title !== 'API integration task') throw new Error('Task read failed');
    response = await fetch(`${base}/tasks/${id}`, { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ title: 'Updated API integration task', notes: 'Updated', status: 'in-progress', dueDate: '2026-12-16', owner: 'Day 7 tests' }) });
    if ((await response.json()).data.title !== 'Updated API integration task') throw new Error('Task update failed');
    response = await fetch(`${base}/tasks/${id}`, { method: 'DELETE' });
    if (response.status !== 200) throw new Error('Task delete failed');
    id = undefined;
  } finally {
    if (id) await pool.query('DELETE FROM tasks WHERE id=$1', [id]);
    await new Promise((resolve) => server.close(resolve));
  }
});

test('Notes API exposes equivalent CRUD endpoints for PostgreSQL and MongoDB', { skip: !enabled }, async () => {
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    for (const database of ['postgres', 'mongo']) {
      const endpoint = `${base}/notes/${database}`;
      let response = await fetch(endpoint, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(sample) });
      if (response.status !== 201) throw new Error(`${database} note create returned ${response.status}`);
      const created = (await response.json()).data;
      try {
        response = await fetch(endpoint);
        if (!(await response.json()).data.some((note) => String(note.id) === String(created.id))) throw new Error(`${database} note list failed`);
        response = await fetch(`${endpoint}/${created.id}`);
        if ((await response.json()).data.title !== sample.title) throw new Error(`${database} note read failed`);
        response = await fetch(`${endpoint}/${created.id}`, { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ...sample, title: 'Updated via API' }) });
        if ((await response.json()).data.title !== 'Updated via API') throw new Error(`${database} note update failed`);
      } finally {
        await fetch(`${endpoint}/${created.id}`, { method: 'DELETE' });
      }
    }
  } finally { await new Promise((resolve) => server.close(resolve)); }
});
