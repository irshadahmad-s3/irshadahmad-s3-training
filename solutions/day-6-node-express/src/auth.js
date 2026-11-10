const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('./db');

const COOKIE_NAME = 's3_training_session';
const TOKEN_TTL_SECONDS = 60 * 60;
const cookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  path: '/',
  maxAge: TOKEN_TTL_SECONDS * 1000,
});

function getJwtSecret() {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must be set to a random value of at least 32 characters');
  }
  return process.env.JWT_SECRET;
}
function assertConfigured() { getJwtSecret(); }

function issueToken(user) {
  return jwt.sign({ sub: String(user.id) }, getJwtSecret(), { expiresIn: TOKEN_TTL_SECONDS, issuer: 's3-training-api', audience: 's3-training-client' });
}

function setSession(res, user) {
  res.cookie(COOKIE_NAME, issueToken(user), cookieOptions());
}

async function authenticate(req, res, next) {
  const header = req.get('authorization');
  const token = req.cookies?.[COOKIE_NAME] || (header?.startsWith('Bearer ') ? header.slice(7) : null);
  if (!token) return res.status(401).json({ message: 'Authentication required' });
  try {
    const claims = jwt.verify(token, getJwtSecret(), { issuer: 's3-training-api', audience: 's3-training-client' });
    const { rows } = await pool.query('SELECT id, email, role FROM users WHERE id = $1', [claims.sub]);
    if (!rows[0]) return res.status(401).json({ message: 'Authentication required' });
    req.user = rows[0];
    return next();
  } catch (error) {
    if (error.name !== 'JsonWebTokenError' && error.name !== 'TokenExpiredError') return next(error);
    return res.status(401).json({ message: 'Authentication required' });
  }
}

function requireRole(...roles) {
  return (req, res, next) => req.user && roles.includes(req.user.role)
    ? next()
    : res.status(403).json({ message: 'You do not have permission to perform this action' });
}

function requireCsrf(req, res, next) {
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) return next();
  const cookieToken = req.cookies.csrf_token;
  const headerToken = req.get('x-csrf-token');
  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    return res.status(403).json({ message: 'CSRF token missing or invalid' });
  }
  return next();
}

module.exports = { COOKIE_NAME, authenticate, requireRole, requireCsrf, setSession, cookieOptions, issueToken, assertConfigured, hashPassword: (password) => bcrypt.hash(password, 12), verifyPassword: (password, hash) => bcrypt.compare(password, hash) };
