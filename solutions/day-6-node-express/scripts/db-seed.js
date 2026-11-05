require('dotenv').config();
const { pool } = require('../src/db');
(async () => {
  try {
    await pool.query(`INSERT INTO tasks (id,title,notes,status,due_date,owner) VALUES
      (1,'Prepare training report','Summarize Day 7 database work','pending','2026-12-01','Irshad'),
      (2,'Review MongoDB exercises','Run the saved mongosh examples','in-progress','2026-12-03','Irshad')
      ON CONFLICT (id) DO UPDATE SET title=EXCLUDED.title, notes=EXCLUDED.notes, status=EXCLUDED.status, due_date=EXCLUDED.due_date, owner=EXCLUDED.owner`);
    await pool.query("SELECT setval(pg_get_serial_sequence('tasks','id'), GREATEST((SELECT COALESCE(MAX(id),1) FROM tasks),1))");
    await pool.query(`INSERT INTO notes (id,title,description,status) VALUES
      (1,'Read API docs','Review the task endpoints','open'),
      (2,'Practice SQL','Try parameterized queries','in-progress')
      ON CONFLICT (id) DO UPDATE SET title=EXCLUDED.title, description=EXCLUDED.description, status=EXCLUDED.status`);
    await pool.query("SELECT setval(pg_get_serial_sequence('notes','id'), GREATEST((SELECT COALESCE(MAX(id),1) FROM notes),1))");
    console.log('Seed records inserted or refreshed (safe to rerun).');
  } catch (error) { console.error(`Database seed failed: ${error.message}`); process.exitCode = 1; }
  finally { await pool.end(); }
})();
