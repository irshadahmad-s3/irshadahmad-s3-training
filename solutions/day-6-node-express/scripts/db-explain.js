require('dotenv').config();
const fs = require('node:fs/promises');
const path = require('node:path');
const { pool } = require('../src/db');
(async () => {
  try {
    await pool.query("DELETE FROM tasks WHERE owner ~ '^training-[0-9]+$'");
    await pool.query("INSERT INTO tasks (title,notes,status,due_date,owner) SELECT 'Generated task '||n,'Index practice','pending',DATE '2026-12-01','training-'||n FROM generate_series(1,10000) n ON CONFLICT DO NOTHING");
    await pool.query("SELECT setval(pg_get_serial_sequence('tasks','id'), (SELECT MAX(id) FROM tasks))");
    await pool.query('DROP INDEX IF EXISTS idx_tasks_owner_status_due_date');
    await pool.query('ANALYZE tasks');
    const before = await pool.query("EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT) SELECT id,title,status,due_date FROM tasks WHERE owner='training-4242' AND status='pending' ORDER BY due_date");
    await pool.query('CREATE INDEX IF NOT EXISTS idx_tasks_owner_status_due_date ON tasks (owner,status,due_date)');
    await pool.query('ANALYZE tasks');
    const after = await pool.query("EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT) SELECT id,title,status,due_date FROM tasks WHERE owner='training-4242' AND status='pending' ORDER BY due_date");
    const output = `# Measured PostgreSQL EXPLAIN comparison\n\nGenerated using db:explain on ${new Date().toISOString()}. Dataset: ${(await pool.query('SELECT count(*) FROM tasks')).rows[0].count} total tasks.\n\n## Before index\n\n\`\`\`text\n${before.rows.map((row) => row['QUERY PLAN']).join('\n')}\n\`\`\`\n\n## After index\n\n\`\`\`text\n${after.rows.map((row) => row['QUERY PLAN']).join('\n')}\n\`\`\`\n`;
    const target = path.resolve(__dirname, '../../postgres/explain-results.md');
    await fs.writeFile(target, output);
    console.log(`Actual execution plans saved to ${target}`);
  } catch (error) { console.error(`EXPLAIN run failed: ${error.message}`); process.exitCode = 1; }
  finally { await pool.end(); }
})();
