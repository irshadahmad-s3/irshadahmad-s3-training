require('dotenv').config();
const fs = require('node:fs/promises');
const path = require('node:path');
const { pool } = require('../src/db');
(async () => {
  try {
    const sql = await fs.readFile(path.join(__dirname, '../db/schema.sql'), 'utf8');
    await pool.query(sql);
    console.log('Database schema initialized.');
  } catch (error) { console.error(`Database initialization failed: ${error.message}`); process.exitCode = 1; }
  finally { await pool.end(); }
})();
