'use strict';

const errorSchema = {
  type: 'object',
  properties: {
    message: { type: 'string' },
    success: { type: 'boolean' },
  },
};

const response = (description, schema) => ({
  description,
  content: { 'application/json': { schema } },
});

const messageResponse = (description, message) => ({
  description,
  content: {
    'application/json': {
      schema: errorSchema,
      example: { message },
    },
  },
});

const requestBody = (schema, example) => ({
  required: true,
  content: { 'application/json': { schema, example } },
});

const csrfParameters = [
  { in: 'cookie', name: 'csrf_token', required: true, schema: { type: 'string' } },
  { in: 'header', name: 'X-CSRF-Token', required: true, schema: { type: 'string' } },
];

const userSchema = {
  type: 'object',
  properties: {
    id: { type: 'integer' },
    email: { type: 'string', format: 'email' },
    role: { type: 'string', enum: ['user', 'admin'] },
  },
};

const taskSchema = {
  type: 'object',
  required: ['title', 'notes', 'status', 'dueDate', 'owner'],
  properties: {
    id: { type: 'integer', readOnly: true },
    title: { type: 'string', minLength: 1 },
    notes: { type: 'string' },
    status: { type: 'string', enum: ['pending', 'in-progress', 'completed'] },
    dueDate: { type: 'string', minLength: 1 },
    owner: { type: 'string', minLength: 1, description: 'Required in input; the server assigns the authenticated user.' },
  },
};

const noteSchema = {
  type: 'object',
  required: ['title', 'description', 'status'],
  properties: {
    id: { oneOf: [{ type: 'integer' }, { type: 'string' }], readOnly: true },
    title: { type: 'string', minLength: 1 },
    description: { type: 'string' },
    status: { type: 'string', enum: ['open', 'in-progress', 'done'] },
    created_at: { type: 'string', format: 'date-time', readOnly: true },
    updated_at: { type: 'string', format: 'date-time', readOnly: true },
  },
};

const dataEnvelope = (description, itemSchema) => ({
  type: 'object',
  properties: {
    message: { type: 'string', example: description },
    data: itemSchema,
  },
});

const protectedOperation = (tags, summary, responses, options = {}) => ({
  tags: [tags],
  summary,
  security: [{ sessionCookie: [] }, { bearerAuth: [] }],
  responses,
  ...options,
});

function notePaths(database) {
  const base = `/notes/${database}`;
  const label = `${database === 'mongo' ? 'MongoDB' : 'PostgreSQL'} note`;
  return {
    [base]: {
      get: protectedOperation('Notes', `List ${label}s`, {
        200: response('Notes fetched successfully', {
          type: 'object',
          properties: {
            message: { type: 'string' },
            data: { type: 'array', items: noteSchema },
          },
        }),
        401: messageResponse('Authentication required', 'Authentication required'),
      }),
      post: protectedOperation('Notes', `Create ${label}`, {
        201: response('Note created successfully', dataEnvelope('Note created successfully', noteSchema)),
        400: response('Validation failed', errorSchema),
        401: messageResponse('Authentication required', 'Authentication required'),
        403: messageResponse('CSRF check failed', 'CSRF token missing or invalid'),
        500: messageResponse('Database or server error', 'Internal Server Error'),
      }, {
        parameters: csrfParameters,
        requestBody: requestBody(noteSchema, { title: 'Planning', description: 'Sprint notes', status: 'open' }),
      }),
    },
    [`${base}/{id}`]: {
      parameters: [{ in: 'path', name: 'id', required: true, schema: { type: database === 'mongo' ? 'string' : 'integer' } }],
      get: protectedOperation('Notes', `Get ${label} by ID`, {
        200: response('Note fetched successfully', dataEnvelope('Note fetched successfully', noteSchema)),
        401: messageResponse('Authentication required', 'Authentication required'),
        404: messageResponse('Note not found', 'Note not found'),
      }),
      put: protectedOperation('Notes', `Replace ${label}`, {
        200: response('Note updated successfully', dataEnvelope('Note updated successfully', noteSchema)),
        400: response('Validation failed', errorSchema),
        401: messageResponse('Authentication required', 'Authentication required'),
        403: messageResponse('CSRF check failed', 'CSRF token missing or invalid'),
        404: messageResponse('Note not found', 'Note not found'),
        500: messageResponse('Database or server error', 'Internal Server Error'),
      }, {
        parameters: csrfParameters,
        requestBody: requestBody(noteSchema, { title: 'Planning', description: 'Updated sprint notes', status: 'in-progress' }),
      }),
      delete: protectedOperation('Notes', `Delete ${label}`, {
        200: messageResponse('Note deleted successfully', 'Note deleted successfully'),
        401: messageResponse('Authentication required', 'Authentication required'),
        403: messageResponse('CSRF check failed', 'CSRF token missing or invalid'),
        404: messageResponse('Note not found', 'Note not found'),
        500: messageResponse('Database or server error', 'Internal Server Error'),
      }, { parameters: csrfParameters }),
    },
  };
}

const paths = {
  '/health': {
    get: {
      tags: ['General'],
      summary: 'Check API health',
      responses: { 200: response('API is available', { type: 'object', properties: { status: { type: 'string', example: 'OK' } } }) },
    },
  },
  '/hello': {
    get: {
      tags: ['General'],
      summary: 'Get a greeting',
      parameters: [{ in: 'query', name: 'name', required: false, schema: { type: 'string' } }],
      responses: { 200: response('Greeting', { type: 'object', properties: { message: { type: 'string', example: 'Hello Guest' } } }) },
    },
  },
  '/auth/csrf': {
    get: {
      tags: ['Authentication'],
      summary: 'Issue a CSRF token cookie and token value',
      responses: { 200: response('CSRF token issued', { type: 'object', properties: { csrfToken: { type: 'string' } } }) },
    },
  },
  '/auth/register': {
    post: {
      tags: ['Authentication'],
      summary: 'Register an account and start a session',
      parameters: csrfParameters,
      requestBody: requestBody({
        type: 'object', required: ['email', 'password'],
        properties: { email: { type: 'string', format: 'email', maxLength: 254 }, password: { type: 'string', minLength: 12, maxLength: 128 } },
      }, { email: 'user@example.com', password: 'replace-with-a-long-password' }),
      responses: {
        201: response('Account created', { type: 'object', properties: { message: { type: 'string' }, user: userSchema } }),
        400: messageResponse('Invalid email or password format', 'Email must be valid and password must be at least 12 characters'),
        403: messageResponse('CSRF check failed', 'CSRF token missing or invalid'),
        409: messageResponse('Email already exists', 'An account with this email already exists'),
        500: messageResponse('Server or database error', 'Internal Server Error'),
      },
    },
  },
  '/auth/login': {
    post: {
      tags: ['Authentication'],
      summary: 'Sign in and start a session',
      parameters: csrfParameters,
      requestBody: requestBody({
        type: 'object', required: ['email', 'password'],
        properties: { email: { type: 'string', format: 'email', maxLength: 254 }, password: { type: 'string', minLength: 12, maxLength: 128 } },
      }, { email: 'user@example.com', password: 'replace-with-a-long-password' }),
      responses: {
        200: response('Signed in', { type: 'object', properties: { message: { type: 'string' }, user: userSchema } }),
        400: messageResponse('Invalid request', 'Invalid email or password'),
        401: messageResponse('Invalid credentials', 'Invalid email or password'),
        403: messageResponse('CSRF check failed', 'CSRF token missing or invalid'),
        429: messageResponse('Login rate limit exceeded', 'Too many login attempts. Try again later.'),
        500: messageResponse('Server or database error', 'Internal Server Error'),
      },
    },
  },
  '/auth/me': {
    get: protectedOperation('Authentication', 'Get the current account', {
      200: response('Current account', { type: 'object', properties: { user: userSchema } }),
      401: messageResponse('Authentication required', 'Authentication required'),
    }),
  },
  '/auth/logout': {
    post: {
      tags: ['Authentication'],
      summary: 'Clear the current session cookie',
      parameters: csrfParameters,
      responses: {
        200: messageResponse('Signed out', 'Signed out'),
        403: messageResponse('CSRF check failed', 'CSRF token missing or invalid'),
      },
    },
  },
  '/admin/users': {
    get: protectedOperation('Administration', 'List registered users (admin only)', {
      200: response('Users', { type: 'object', properties: { data: { type: 'array', items: userSchema } } }),
      401: messageResponse('Authentication required', 'Authentication required'),
      403: messageResponse('Admin role required', 'You do not have permission to perform this action'),
      500: messageResponse('Database or server error', 'Internal Server Error'),
    }),
  },
  '/tasks': {
    get: protectedOperation('Tasks', 'List tasks visible to the current account', {
      200: response('Tasks fetched successfully', { type: 'object', properties: { message: { type: 'string' }, data: { type: 'array', items: taskSchema } } }),
      401: messageResponse('Authentication required', 'Authentication required'),
      500: messageResponse('Database or server error', 'Internal Server Error'),
    }),
    post: protectedOperation('Tasks', 'Create a task', {
      201: response('Task created successfully', dataEnvelope('Task created successfully', taskSchema)),
      400: response('Validation failed', errorSchema),
      401: messageResponse('Authentication required', 'Authentication required'),
      403: messageResponse('CSRF check failed', 'CSRF token missing or invalid'),
      500: messageResponse('Database or server error', 'Internal Server Error'),
    }, {
      parameters: csrfParameters,
      requestBody: requestBody(taskSchema, { title: 'Prepare release', notes: 'Review release checklist', status: 'pending', dueDate: '2026-12-01', owner: 'user@example.com' }),
    }),
  },
  '/tasks/{id}': {
    parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer', minimum: 1 } }],
    get: protectedOperation('Tasks', 'Get a task by ID', {
      200: response('Task', dataEnvelope('Task fetched successfully', taskSchema)),
      400: messageResponse('Invalid task ID', 'Invalid task ID'),
      401: messageResponse('Authentication required', 'Authentication required'),
      404: messageResponse('Task not found', 'Task not found'),
    }),
    put: protectedOperation('Tasks', 'Replace a task', {
      200: response('Task updated successfully', dataEnvelope('Task updated successfully', taskSchema)),
      400: response('Invalid ID or validation failed', errorSchema),
      401: messageResponse('Authentication required', 'Authentication required'),
      403: messageResponse('CSRF check failed', 'CSRF token missing or invalid'),
      404: messageResponse('Task not found or not visible to account', 'Task not found'),
      500: messageResponse('Database or server error', 'Internal Server Error'),
    }, {
      parameters: csrfParameters,
      requestBody: requestBody(taskSchema, { title: 'Prepare release', notes: 'Checklist reviewed', status: 'in-progress', dueDate: '2026-12-01', owner: 'user@example.com' }),
    }),
    delete: protectedOperation('Tasks', 'Delete a task', {
      200: messageResponse('Task deleted successfully', 'Task deleted successfully'),
      400: messageResponse('Invalid task ID', 'Invalid task ID'),
      401: messageResponse('Authentication required', 'Authentication required'),
      403: messageResponse('CSRF check failed', 'CSRF token missing or invalid'),
      404: messageResponse('Task not found or not visible to account', 'Task not found'),
      500: messageResponse('Database or server error', 'Internal Server Error'),
    }, { parameters: csrfParameters }),
  },
  '/dev/sql-injection-demo': {
    get: {
      tags: ['Development only'],
      summary: 'Compare unsafe and parameterized SQL with dummy rows',
      description: 'Only registered when NODE_ENV is not production and ENABLE_SQL_INJECTION_DEMO=true.',
      parameters: [{ in: 'query', name: 'name', required: false, schema: { type: 'string', maxLength: 100 } }],
      responses: { 200: response('Dummy demonstration results', { type: 'object', properties: { warning: { type: 'string' }, unsafe: { type: 'array', items: { type: 'object' } }, safe: { type: 'array', items: { type: 'object' } } } }) },
    },
  },
  ...notePaths('postgres'),
  ...notePaths('mongo'),
};

module.exports = {
  openapi: '3.0.3',
  info: {
    title: 'TaskFlow API',
    version: '1.0.0',
    description: 'TaskFlow authentication, task, and notes API. Mutating requests require the CSRF cookie and matching X-CSRF-Token header.',
  },
  servers: [{ url: '/', description: 'Current host' }],
  tags: [
    { name: 'General' }, { name: 'Authentication' }, { name: 'Administration' },
    { name: 'Tasks' }, { name: 'Notes' }, { name: 'Development only' },
  ],
  components: {
    securitySchemes: {
      sessionCookie: { type: 'apiKey', in: 'cookie', name: 's3_training_session', description: 'HTTP-only, one-hour session cookie.' },
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
  },
  paths,
};
