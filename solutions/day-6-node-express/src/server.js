require('dotenv').config();
const { app } = require('./app');
const { pool } = require('./db');
const { closeMongo } = require('./mongo-db');

const port = Number(process.env.PORT || 3000);
const server = app.listen(port, () => console.log(`Server running on http://localhost:${port}`));
async function shutdown() {
  server.close(async () => { await Promise.all([pool.end(), closeMongo()]); process.exit(0); });
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
