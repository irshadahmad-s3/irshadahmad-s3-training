const path = require('node:path');
const dotenv = require('dotenv');

function configureTestDatabases() {
  dotenv.config({ path: path.join(__dirname, '../.env.test'), override: false });
  const postgres = process.env.TEST_DATABASE_URL;
  const mongoUri = process.env.TEST_MONGODB_URI;
  const mongoDatabase = process.env.TEST_MONGODB_DATABASE;
  if (!postgres || !mongoUri || !mongoDatabase) {
    throw new Error('Integration tests require .env.test. Copy .env.test.example and start the isolated test Compose project.');
  }

  const pgUrl = new URL(postgres);
  if (pgUrl.protocol !== 'postgresql:' || !['127.0.0.1', 'localhost'].includes(pgUrl.hostname) || pgUrl.port !== '55432' || pgUrl.pathname !== '/taskflow_test' || pgUrl.username !== 'taskflow_test' || pgUrl.password !== 'taskflow_test_only' || pgUrl.search) {
    throw new Error('Refusing integration tests: PostgreSQL must be the dedicated local taskflow_test database on port 55432.');
  }
  const mongoUrl = new URL(mongoUri);
  if (mongoUrl.protocol !== 'mongodb:' || !['127.0.0.1', 'localhost'].includes(mongoUrl.hostname) || mongoUrl.port !== '27018' || mongoUrl.username || mongoUrl.password || mongoUrl.search || mongoDatabase !== 'taskflow_test') {
    throw new Error('Refusing integration tests: MongoDB must be the dedicated local taskflow_test database on port 27018.');
  }

  // Override the application's general-purpose variables only after test targets pass strict checks.
  process.env.DATABASE_URL = postgres;
  process.env.MONGODB_URI = mongoUri;
  process.env.MONGODB_DATABASE = mongoDatabase;
  process.env.JWT_SECRET = 'taskflow-test-only-secret-at-least-32-bytes';
}

module.exports = { configureTestDatabases };
