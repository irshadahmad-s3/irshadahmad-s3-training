const express = require('express');
const { Buffer } = require('node:buffer');
const { z } = require('zod');
const repository = require('./task.repository');
const notes = require('./notes');
const crypto = require('node:crypto');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const auth = require('./auth');
const authRepository = require('./auth.repository');
const { pool } = require('./db');
const { logError } = require('./logger');

const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('../dist/config/swagger').default;

const app = express();

// Middleware
const frontendOrigin = process.env.FRONTEND_ORIGIN || 'http://localhost:5173';
app.use(helmet());
app.use(cors({ origin: frontendOrigin, credentials: true, methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], allowedHeaders: ['Content-Type', 'X-CSRF-Token', 'Authorization'] }));
app.use(cookieParser());
app.use(express.json());
app.use(auth.requireCsrf);

const registerSchema = z.object({ email: z.string().trim().email().max(254), password: z.string().min(12).max(128).refine((password) => Buffer.byteLength(password, 'utf8') <= 72) });
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 5, standardHeaders: 'draft-8', legacyHeaders: false, skipSuccessfulRequests: true, message: { message: 'Too many login attempts. Try again later.' } });

app.get('/auth/csrf', (_req, res) => {
  const token = crypto.randomBytes(32).toString('hex');
  res.cookie('csrf_token', token, { httpOnly: false, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', path: '/', maxAge: 60 * 60 * 1000 });
  res.status(200).json({ csrfToken: token });
});

app.post('/auth/register', async (req, res, next) => {
  const input = registerSchema.safeParse(req.body);
  if (!input.success) return res.status(400).json({ message: 'Email must be valid and password must be at least 12 characters' });
  try {
    auth.assertConfigured();
    const email = input.data.email.toLowerCase();
    const user = await authRepository.createUser(email, await auth.hashPassword(input.data.password));
    auth.setSession(res, user);
    return res.status(201).json({ message: 'Account created', user });
  } catch (error) {
    if (error.code === '23505') return res.status(409).json({ message: 'An account with this email already exists' });
    return next(error);
  }
});

app.post('/auth/login', loginLimiter, async (req, res, next) => {
  const input = registerSchema.safeParse(req.body);
  if (!input.success) return res.status(400).json({ message: 'Invalid email or password' });
  try {
    auth.assertConfigured();
    const user = await authRepository.findUserByEmail(input.data.email.toLowerCase());
    const valid = user ? await auth.verifyPassword(input.data.password, user.password_hash) : false;
    if (!valid) return res.status(401).json({ message: 'Invalid email or password' });
    auth.setSession(res, user);
    return res.status(200).json({ message: 'Signed in', user: { id: user.id, email: user.email, role: user.role } });
  } catch (error) { return next(error); }
});

app.get('/auth/me', auth.authenticate, (req, res) => res.status(200).json({ user: req.user }));
app.post('/auth/logout', (_req, res) => res.clearCookie(auth.COOKIE_NAME, auth.cookieOptions()).status(200).json({ message: 'Signed out' }));
app.get('/admin/users', auth.authenticate, auth.requireRole('admin'), async (_req, res, next) => {
  try { return res.status(200).json({ data: await authRepository.listUsers() }); } catch (error) { return next(error); }
});

// Isolated, read-only SQL injection lesson using dummy rows only. Never enabled in production.
if (process.env.NODE_ENV !== 'production' && process.env.ENABLE_SQL_INJECTION_DEMO === 'true') {
  app.get('/dev/sql-injection-demo', async (req, res, next) => {
    const name = typeof req.query.name === 'string' ? req.query.name.slice(0, 100) : '';
    try {
      const unsafeSql = `WITH demo_users(username) AS (VALUES ('alice'), ('bob')) SELECT username FROM demo_users WHERE username = '${name}'`;
      const unsafe = (await pool.query(unsafeSql)).rows;
      const safe = (await pool.query("WITH demo_users(username) AS (VALUES ('alice'), ('bob')) SELECT username FROM demo_users WHERE username = $1", [name])).rows;
      return res.status(200).json({ warning: 'Development-only dummy data demonstration', unsafe, safe });
    } catch (error) { return next(error); }
  });
}

// Swagger API Documentation
app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec)
);

// Task Validation Schema
const taskSchema = z.object({
  title: z.string().min(1),
  notes: z.string(),
  status: z.enum(['pending', 'in-progress', 'completed']),
  dueDate: z.string().min(1),
  owner: z.string().min(1),
});

// General Routes
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'OK' });
});

app.get('/hello', (req, res) => {
  res.status(200).json({
    message: `Hello ${req.query.name || 'Guest'}`
  });
});

// Notes Validation Schema
const noteSchema = z.object({
  title: z.string().min(1),
  description: z.string(),
  status: z.enum(['open', 'in-progress', 'done'])
});

// Common Notes Routes
function notesRoutes(prefix, adapter) {

  // Create Note
  app.post(prefix, auth.authenticate, async (req, res, next) => {
    const result = noteSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: result.error.issues
      });
    }

    try {
      const note = await adapter.create(result.data);

      return res.status(201).json({
        message: 'Note created successfully',
        data: note
      });
    } catch (error) {
      return next(error);
    }
  });

  // Get All Notes
  app.get(prefix, auth.authenticate, async (_req, res, next) => {
    try {
      const data = await adapter.all();

      return res.status(200).json({
        message: 'Notes fetched successfully',
        data
      });
    } catch (error) {
      return next(error);
    }
  });

  // Get Note By ID
  app.get(`${prefix}/:id`, auth.authenticate, async (req, res, next) => {
    try {
      const note = await adapter.byId(req.params.id);

      return note
        ? res.status(200).json({
            message: 'Note fetched successfully',
            data: note
          })
        : res.status(404).json({
            message: 'Note not found'
          });

    } catch (error) {
      return next(error);
    }
  });

  // Update Note
  app.put(`${prefix}/:id`, auth.authenticate, async (req, res, next) => {
    const result = noteSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: result.error.issues
      });
    }

    try {
      const note = await adapter.update(
        req.params.id,
        result.data
      );

      return note
        ? res.status(200).json({
            message: 'Note updated successfully',
            data: note
          })
        : res.status(404).json({
            message: 'Note not found'
          });

    } catch (error) {
      return next(error);
    }
  });

  // Delete Note
  app.delete(`${prefix}/:id`, auth.authenticate, async (req, res, next) => {
    try {
      const deleted = await adapter.delete(req.params.id);

      return deleted
        ? res.status(200).json({
            message: 'Note deleted successfully'
          })
        : res.status(404).json({
            message: 'Note not found'
          });

    } catch (error) {
      return next(error);
    }
  });
}

// PostgreSQL Notes Routes
notesRoutes('/notes/postgres', notes.pg);

// MongoDB Notes Routes
notesRoutes('/notes/mongo', notes.mongo);


// TASK CRUD APIs

// Create Task
app.post('/tasks', auth.authenticate, async (req, res, next) => {
  const result = taskSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: result.error.issues
    });
  }

  try {
    const task = await repository.createTask({ ...result.data, owner: req.user.email, userId: req.user.id });

    return res.status(201).json({
      message: 'Task created successfully',
      data: task
    });

  } catch (error) {
    return next(error);
  }
});

// Get All Tasks
app.get('/tasks', auth.authenticate, async (req, res, next) => {
  try {
    const tasks = await repository.getAllTasks(req.user);

    return res.status(200).json({
      message: 'Tasks fetched successfully',
      data: tasks
    });

  } catch (error) {
    return next(error);
  }
});

// Get Task By ID
app.get('/tasks/:id', auth.authenticate, async (req, res, next) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({
      message: 'Invalid task ID'
    });
  }

  try {
    const task = await repository.getTaskById(id, req.user);

    return task
      ? res.status(200).json({
          message: 'Task fetched successfully',
          data: task
        })
      : res.status(404).json({
          message: 'Task not found'
        });

  } catch (error) {
    return next(error);
  }
});

// Update Task
app.put('/tasks/:id', auth.authenticate, async (req, res, next) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({
      message: 'Invalid task ID'
    });
  }

  const result = taskSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: result.error.issues
    });
  }

  try {
    const task = await repository.updateTask(id, { ...result.data, owner: req.user.email }, req.user);

    return task
      ? res.status(200).json({
          message: 'Task updated successfully',
          data: task
        })
      : res.status(404).json({
          message: 'Task not found'
        });

  } catch (error) {
    return next(error);
  }
});

// Delete Task
app.delete('/tasks/:id', auth.authenticate, async (req, res, next) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({
      message: 'Invalid task ID'
    });
  }

  try {
    const deleted = await repository.deleteTask(id, req.user);

    return deleted
      ? res.status(200).json({
          message: 'Task deleted successfully'
        })
      : res.status(404).json({
          message: 'Task not found'
        });

  } catch (error) {
    return next(error);
  }
});


// Centralized Error Handling
app.use((error, _req, res, _next) => {
  logError('http_request_failed', error, { method: _req.method, path: _req.path });

  res.status(500).json({
    success: false,
    message: 'Internal Server Error'
  });
});

module.exports = { app };
