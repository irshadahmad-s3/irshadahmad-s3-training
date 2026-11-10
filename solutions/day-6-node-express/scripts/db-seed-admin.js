require('dotenv').config();
const { pool } = require('../src/db');
const { hashPassword } = require('../src/auth');
const { Buffer } = require('node:buffer');

(async () => {
  try {
    const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    const password = process.env.ADMIN_PASSWORD;
    if (!email || !password || password.length < 12 || Buffer.byteLength(password, 'utf8') > 72) {
      throw new Error('Set ADMIN_EMAIL and ADMIN_PASSWORD (12+ characters and at most 72 UTF-8 bytes) in your local environment');
    }
    const hash = await hashPassword(password);
    await pool.query("INSERT INTO users(email, password_hash, role) VALUES($1, $2, 'admin') ON CONFLICT(email) DO UPDATE SET password_hash=EXCLUDED.password_hash, role='admin'", [email, hash]);
    console.log(`Development administrator ready for ${email}`);
  } catch (error) {
    console.error(`Admin seed failed: ${error.message}`);
    process.exitCode = 1;
  } finally { await pool.end(); }
})();
