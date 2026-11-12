import { afterEach, describe, expect, it } from 'vitest';
import { createRequire } from 'node:module';

const testRequire = createRequire(import.meta.url);
const { configureTestDatabases } = testRequire('../test-database-config.js');
const keys = ['TEST_DATABASE_URL', 'TEST_MONGODB_URI', 'TEST_MONGODB_DATABASE', 'DATABASE_URL', 'MONGODB_URI', 'MONGODB_DATABASE'];
const previous = Object.fromEntries(keys.map((key) => [key, process.env[key]]));

afterEach(() => {
  for (const key of keys) {
    if (previous[key] === undefined) delete process.env[key];
    else process.env[key] = previous[key];
  }
});

describe('integration database safety guard', () => {
  it('refuses development or remote PostgreSQL targets before database setup', () => {
    process.env.TEST_DATABASE_URL = 'postgresql://dev:secret@db.example.test:5432/training';
    process.env.TEST_MONGODB_URI = 'mongodb://127.0.0.1:27018';
    process.env.TEST_MONGODB_DATABASE = 'taskflow_test';
    expect(() => configureTestDatabases()).toThrow(/dedicated local taskflow_test database/);
  });

  it('refuses a MongoDB target outside the dedicated local test port/database', () => {
    process.env.TEST_DATABASE_URL = 'postgresql://taskflow_test:taskflow_test_only@127.0.0.1:55432/taskflow_test';
    process.env.TEST_MONGODB_URI = 'mongodb://127.0.0.1:27017';
    process.env.TEST_MONGODB_DATABASE = 's3_training';
    expect(() => configureTestDatabases()).toThrow(/dedicated local taskflow_test database/);
  });
});
