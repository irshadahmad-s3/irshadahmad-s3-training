import { useEffect, useState, type FormEvent } from 'react';
import { Button } from './Button';
import { Input } from './Input';
import type { Task, TaskInput, TaskStatus } from '../types/Task';

interface TaskFormProps { task?: Task; onSubmit: (task: TaskInput) => Promise<void>; onCancel: () => void; submitLabel?: string }
const blank: TaskInput = { title: '', notes: '', status: 'pending', dueDate: '', owner: '' };

export function TaskForm({ task, onSubmit, onCancel, submitLabel = 'Create task' }: TaskFormProps) {
  const [form, setForm] = useState<TaskInput>(task ? { title: task.title, notes: task.notes, status: task.status, dueDate: task.dueDate.slice(0, 10), owner: task.owner } : blank);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  useEffect(() => { setForm(task ? { title: task.title, notes: task.notes, status: task.status, dueDate: task.dueDate.slice(0, 10), owner: task.owner } : blank); }, [task]);
  const update = (name: keyof TaskInput, value: string) => setForm((current) => ({ ...current, [name]: value }));
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(''); setSaving(true);
    try { await onSubmit(form); } catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to save this task.'); }
    finally { setSaving(false); }
  }
  return <form className="task-form" onSubmit={handleSubmit}>
    <Input label="Task title" name="title" placeholder="e.g. Prepare project update" value={form.title} onChange={(e) => update('title', e.target.value)} required maxLength={120} />
    <label className="field" htmlFor="notes"><span className="field__label">Description</span><textarea id="notes" className="input textarea" name="notes" placeholder="Add a few details about this task" value={form.notes} onChange={(e) => update('notes', e.target.value)} required rows={4} /></label>
    <div className="form-grid"><label className="field" htmlFor="status"><span className="field__label">Status</span><select id="status" className="input" value={form.status} onChange={(e) => update('status', e.target.value as TaskStatus)}><option value="pending">Pending</option><option value="in-progress">In progress</option><option value="completed">Completed</option></select></label>
      <Input label="Due date" name="dueDate" type="date" value={form.dueDate} onChange={(e) => update('dueDate', e.target.value)} required />
    </div>
    <Input label="Owner" name="owner" placeholder="Name of the assignee" value={form.owner} onChange={(e) => update('owner', e.target.value)} required maxLength={100} />
    {error && <p className="inline-error" role="alert">{error}</p>}
    <div className="form-actions"><Button type="button" onClick={onCancel}>Cancel</Button><Button type="submit" variant="primary" disabled={saving}>{saving ? 'Saving…' : submitLabel}</Button></div>
  </form>;
}
