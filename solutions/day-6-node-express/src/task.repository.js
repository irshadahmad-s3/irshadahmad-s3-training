const { pool } = require('./db');

// The existing Day 6 API exposed numeric IDs; cast PostgreSQL BIGINT IDs back
// to the same JSON number type in responses.
const columns = 'id::int AS id, title, notes, status, due_date AS "dueDate", owner';
async function createTask(task) {
  const { rows } = await pool.query(
    `INSERT INTO tasks (title, notes, status, due_date, owner) VALUES ($1, $2, $3, $4, $5) RETURNING ${columns}`,
    [task.title, task.notes, task.status, task.dueDate, task.owner],
  );
  return rows[0];
}
async function getAllTasks() {
  const { rows } = await pool.query(`SELECT ${columns} FROM tasks ORDER BY id`);
  return rows;
}
async function getTaskById(id) {
  const { rows } = await pool.query(`SELECT ${columns} FROM tasks WHERE id = $1`, [id]);
  return rows[0];
}
async function updateTask(id, task) {
  const { rows } = await pool.query(
    `UPDATE tasks SET title=$1, notes=$2, status=$3, due_date=$4, owner=$5, updated_at=now() WHERE id=$6 RETURNING ${columns}`,
    [task.title, task.notes, task.status, task.dueDate, task.owner, id],
  );
  return rows[0];
}
async function deleteTask(id) {
  const { rowCount } = await pool.query('DELETE FROM tasks WHERE id = $1', [id]);
  return rowCount > 0;
}
module.exports = { createTask, getAllTasks, getTaskById, updateTask, deleteTask };
