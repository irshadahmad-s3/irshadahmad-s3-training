const { test } = require('node:test');
const assert = require('node:assert/strict');
const { app } = require('../src/app');

test('health endpoint returns the existing response shape', async () => {
  const server = app.listen(0);
  try {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/health`);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { status: 'OK' });
  } finally { await new Promise((resolve) => server.close(resolve)); }
});

test('hello endpoint uses Guest when name is omitted', async () => {
  const server = app.listen(0);
  try {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/hello`);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { message: 'Hello Guest' });
  } finally { await new Promise((resolve) => server.close(resolve)); }
});
