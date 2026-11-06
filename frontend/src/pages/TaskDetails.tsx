import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Button } from '../components/Button';
import { Loading } from '../components/Loading';
import { Modal } from '../components/Modal';
import { getErrorMessage, getTask, deleteTask } from '../services/taskService';
import type { Task } from '../types/Task';

export function TaskDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const numericId = Number(id);
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    if (!Number.isInteger(numericId) || numericId < 1) { setError('This task ID is invalid.'); setLoading(false); return; }
    setLoading(true); setError('');
    try { setTask(await getTask(numericId)); }
    catch (cause) { setError(getErrorMessage(cause)); }
    finally { setLoading(false); }
  }, [numericId]);
  useEffect(() => { void load(); }, [load]);
  async function remove() {
    if (!task) return;
    setBusy(true);
    try { await deleteTask(task.id); navigate('/tasks', { replace: true }); }
    catch (cause) { setError(getErrorMessage(cause)); setConfirm(false); }
    finally { setBusy(false); }
  }
  return <section className="detail-page"><Link className="back-link" to="/tasks">← &nbsp;Back to tasks</Link>
    {loading ? <Loading label="Loading task…" /> : error ? <div className="state-panel"><div className="state-icon">!</div><h2>{error.includes('invalid') || error.toLowerCase().includes('not found') ? 'Task not found' : 'Unable to load task'}</h2><p>{error}</p><div className="form-actions"><Button onClick={() => void load()}>Try again</Button><Link className="button button--primary" to="/tasks">Go to tasks</Link></div></div> : task && <article className="detail-card"><div className="detail-card__top"><span className={`status status--${task.status}`}>{task.status === 'in-progress' ? 'In progress' : task.status[0].toUpperCase() + task.status.slice(1)}</span><span className="task-card__id">TASK-{String(task.id).padStart(3, '0')}</span></div><h1>{task.title}</h1><p className="detail-description">{task.notes}</p><div className="detail-meta"><div><span className="detail-label">ASSIGNEE</span><span><span className="avatar">{task.owner.slice(0, 1).toUpperCase()}</span>{task.owner}</span></div><div><span className="detail-label">DUE DATE</span><span>{new Date(`${task.dueDate.slice(0, 10)}T00:00:00`).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</span></div><div><span className="detail-label">STATUS</span><span>{task.status === 'in-progress' ? 'In progress' : task.status[0].toUpperCase() + task.status.slice(1)}</span></div></div><div className="detail-actions"><Button variant="primary" onClick={() => navigate('/tasks', { state: { editTask: task } })}>Edit task</Button><Button variant="ghost" className="delete-link" onClick={() => setConfirm(true)}>Delete task</Button></div></article>}
    <Modal open={confirm} title="Delete this task?" onClose={() => setConfirm(false)} onConfirm={() => void remove()} busy={busy}><p>This will permanently remove <strong>{task?.title}</strong>.</p></Modal>
  </section>;
}
