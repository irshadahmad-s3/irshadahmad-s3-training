const { pool } = require('./db');

async function createUser(email, passwordHash) {
  const { rows } = await pool.query(
    "INSERT INTO users (email, password_hash, role) VALUES ($1, $2, 'user') RETURNING id, email, role",
    [email, passwordHash],
  );
  return rows[0];
}
async function findUserByEmail(email) {
  return (await pool.query('SELECT id, email, role, password_hash FROM users WHERE email = $1', [email])).rows[0];
}
async function listUsers() {
  return (await pool.query('SELECT id, email, role, created_at FROM users ORDER BY id')).rows;
}
module.exports = { createUser, findUserByEmail, listUsers };
