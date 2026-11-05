const express = require('express');
const { z } = require('zod');
const repository = require('./task.repository');
const notes = require('./notes');

const app = express();
app.use(express.json());
const taskSchema = z.object({
  title: z.string().min(1), notes: z.string(),
  status: z.enum(['pending', 'in-progress', 'completed']),
  dueDate: z.string().min(1), owner: z.string().min(1),
});
app.get('/health', (_req, res) => res.status(200).json({ status: 'OK' }));
app.get('/hello', (req, res) => res.status(200).json({ message: `Hello ${req.query.name || 'Guest'}` }));
const noteSchema = z.object({ title: z.string().min(1), description: z.string(), status: z.enum(['open', 'in-progress', 'done']) });
function notesRoutes(prefix, adapter) {
  app.post(prefix, async (req, res, next) => {
    const result = noteSchema.safeParse(req.body);
    if (!result.success) return res.status(400).json({ message: 'Validation failed', errors: result.error.issues });
    try { return res.status(201).json({ message: 'Note created successfully', data: await adapter.create(result.data) }); } catch (error) { return next(error); }
  });
  app.get(prefix, async (_req, res, next) => {
    try { return res.status(200).json({ message: 'Notes fetched successfully', data: await adapter.all() }); } catch (error) { return next(error); }
  });
  app.get(`${prefix}/:id`, async (req, res, next) => {
    try {
      const note = await adapter.byId(req.params.id);
      return note ? res.status(200).json({ message: 'Note fetched successfully', data: note }) : res.status(404).json({ message: 'Note not found' });
    } catch (error) { return next(error); }
  });
  app.put(`${prefix}/:id`, async (req, res, next) => {
    const result = noteSchema.safeParse(req.body);
    if (!result.success) return res.status(400).json({ message: 'Validation failed', errors: result.error.issues });
    try {
      const note = await adapter.update(req.params.id, result.data);
      return note ? res.status(200).json({ message: 'Note updated successfully', data: note }) : res.status(404).json({ message: 'Note not found' });
    } catch (error) { return next(error); }
  });
  app.delete(`${prefix}/:id`, async (req, res, next) => {
    try { return await adapter.delete(req.params.id) ? res.status(200).json({ message: 'Note deleted successfully' }) : res.status(404).json({ message: 'Note not found' }); } catch (error) { return next(error); }
  });
}
notesRoutes('/notes/postgres', notes.pg);
notesRoutes('/notes/mongo', notes.mongo);
app.post('/tasks', async (req, res, next) => {
  const result = taskSchema.safeParse(req.body);
  if (!result.success) return res.status(400).json({ message: 'Validation failed', errors: result.error.issues });
  try { return res.status(201).json({ message: 'Task created successfully', data: await repository.createTask(result.data) }); } catch (error) { return next(error); }
});
app.get('/tasks', async (_req, res, next) => {
  try { return res.status(200).json({ message: 'Tasks fetched successfully', data: await repository.getAllTasks() }); } catch (error) { return next(error); }
});
app.get('/tasks/:id', async (req, res, next) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) return res.status(400).json({ message: 'Invalid task ID' });
  try {
    const task = await repository.getTaskById(id);
    return task ? res.status(200).json({ message: 'Task fetched successfully', data: task }) : res.status(404).json({ message: 'Task not found' });
  } catch (error) { return next(error); }
});
app.put('/tasks/:id', async (req, res, next) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) return res.status(400).json({ message: 'Invalid task ID' });
  const result = taskSchema.safeParse(req.body);
  if (!result.success) return res.status(400).json({ message: 'Validation failed', errors: result.error.issues });
  try {
    const task = await repository.updateTask(id, result.data);
    return task ? res.status(200).json({ message: 'Task updated successfully', data: task }) : res.status(404).json({ message: 'Task not found' });
  } catch (error) { return next(error); }
});
app.delete('/tasks/:id', async (req, res, next) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) return res.status(400).json({ message: 'Invalid task ID' });
  try {
    return await repository.deleteTask(id) ? res.status(200).json({ message: 'Task deleted successfully' }) : res.status(404).json({ message: 'Task not found' });
  } catch (error) { return next(error); }
});
app.use((error, _req, res, _next) => {
  console.error(error.message);
  res.status(500).json({ success: false, message: 'Internal Server Error' });
});
module.exports = { app };
