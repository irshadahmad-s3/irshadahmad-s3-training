require('dotenv').config();
const { Pool } = require('pg');
const { logError } = require('./logger');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: Number(process.env.PGPOOL_MAX || 10),
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});
pool.on('error', (error) => logError('postgres_idle_client_error', error));

module.exports = { pool };
