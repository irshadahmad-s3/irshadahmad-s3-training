import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTasks } from '../hooks/useTasks';
import { useTaskContext } from '../context/TaskContext';
import { createTask, deleteTask, getErrorMessage, updateTask } from '../services/taskService';
import type { Task, TaskInput, TaskStatus } from '../types/Task';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Loading } from '../components/Loading';
import { Modal } from '../components/Modal';
import { TaskForm } from '../components/TaskForm';

type StatusFilter = 'all' | TaskStatus;
const pageSize = 6;

export function TaskList() {
  const { tasks, setTasks, loading, error, refresh } = useTasks();
  const location = useLocation();
  const navigate = useNavigate();
  const { notice, notify } = useTaskContext();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [sort, setSort] = useState<'newest' | 'oldest'>('newest');
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<Task | undefined>();
  const [formOpen, setFormOpen] = useState(false);
  const [deleting, setDeleting] = useState<Task | undefined>();
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState('');

  const visibleTasks = useMemo(() => tasks.filter((task) => task.title.toLowerCase().includes(query.trim().toLowerCase()) && (status === 'all' || task.status === status)).sort((a, b) => {
    const dateA = new Date(`${a.dueDate.slice(0, 10)}T00:00:00`).getTime();
    const dateB = new Date(`${b.dueDate.slice(0, 10)}T00:00:00`).getTime();
    return sort === 'newest' ? dateB - dateA : dateA - dateB;
  }), [tasks, query, status, sort]);
  const totalPages = Math.max(1, Math.ceil(visibleTasks.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageTasks = visibleTasks.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const completed = tasks.filter((task) => task.status === 'completed').length;

  useEffect(() => {
    const selected = location.state?.editTask as Task | undefined;
    if (selected) {
      setEditing(selected);
      setFormOpen(true);
      navigate('/tasks', { replace: true, state: null });
    }
  }, [location.state, navigate]);

  async function saveTask(input: TaskInput) {
    try {
      if (editing) { const saved = await updateTask(editing.id, input); setTasks(tasks.map((task) => task.id === saved.id ? saved : task)); notify('Task updated successfully.'); }
      else { const saved = await createTask(input); setTasks([saved, ...tasks]); notify('Task created successfully.'); setPage(1); }
      setFormOpen(false); setEditing(undefined); setActionError('');
    } catch (cause) { throw new Error(getErrorMessage(cause)); }
  }
  async function confirmDelete() {
    if (!deleting) return;
    setBusy(true); setActionError('');
    try { await deleteTask(deleting.id); setTasks(tasks.filter((task) => task.id !== deleting.id)); notify('Task deleted successfully.'); setDeleting(undefined); }
    catch (cause) { setActionError(getErrorMessage(cause)); }
    finally { setBusy(false); }
  }
  function openEdit(task: Task) { setEditing(task); setFormOpen(true); }
  function closeForm() { setFormOpen(false); setEditing(undefined); }

  return <>
    <section className="welcome"><div><div className="eyebrow"><span className="eyebrow__dot" /> YOUR WORKSPACE</div><h1>Good work starts <span>here.</span></h1><p>Keep the important things moving forward.</p></div><Button variant="primary" className="add-button" onClick={() => { setEditing(undefined); setFormOpen(true); }}><span className="plus">＋</span> Add task</Button></section>
    {notice && <div className="toast" role="status">✓ &nbsp;{notice}<button onClick={() => notify('')} aria-label="Dismiss">×</button></div>}
    <section className="summary-row" aria-label="Task summary"><div className="summary-card"><span className="summary-card__icon summary-card__icon--total">▤</span><span className="summary-card__label">Total tasks</span><strong>{tasks.length}</strong><span className="summary-card__hint">In your workspace</span></div><div className="summary-card"><span className="summary-card__icon summary-card__icon--active">◷</span><span className="summary-card__label">In progress</span><strong>{tasks.filter((task) => task.status === 'in-progress').length}</strong><span className="summary-card__hint">Moving forward</span></div><div className="summary-card"><span className="summary-card__icon summary-card__icon--done">✓</span><span className="summary-card__label">Completed</span><strong>{completed}</strong><span className="summary-card__hint">Nicely done</span></div></section>
    <section className="tasks-section"><div className="section-heading"><div><h2>Your tasks</h2><p>A little progress adds up.</p></div><span className="task-count">{visibleTasks.length} {visibleTasks.length === 1 ? 'task' : 'tasks'}</span></div>
      <div className="toolbar"><label className="search-box"><span aria-hidden="true">⌕</span><input aria-label="Search tasks by title" placeholder="Search tasks..." value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} /><kbd>⌘ K</kbd></label><label className="filter-control"><span>◉</span><select aria-label="Filter tasks by status" value={status} onChange={(event) => { setStatus(event.target.value as StatusFilter); setPage(1); }}><option value="all">All statuses</option><option value="pending">Pending</option><option value="in-progress">In progress</option><option value="completed">Completed</option></select></label><label className="filter-control"><span>↕</span><select aria-label="Sort tasks by due date" value={sort} onChange={(event) => setSort(event.target.value as 'newest' | 'oldest')}><option value="newest">Due date: latest</option><option value="oldest">Due date: earliest</option></select></label></div>
      {error ? <div className="state-panel"><div className="state-icon">!</div><h3>We couldn't load your tasks</h3><p>{error}</p><Button variant="primary" onClick={() => void refresh()}>Try again</Button></div> : loading ? <Loading /> : pageTasks.length === 0 ? <div className="state-panel"><div className="state-icon">✓</div><h3>{tasks.length === 0 ? 'No tasks found. Create your first task!' : 'No tasks match your search'}</h3><p>{tasks.length === 0 ? 'Your next great idea can start right here.' : 'Try changing your search or filters.'}</p>{tasks.length === 0 && <Button variant="primary" onClick={() => setFormOpen(true)}>Create a task</Button>}</div> : <div className="task-grid">{pageTasks.map((task) => <Card key={task.id} task={task} onEdit={openEdit} onDelete={setDeleting} />)}</div>}
      {!loading && !error && visibleTasks.length > 0 && <div className="pagination"><span>Showing <strong>{(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, visibleTasks.length)}</strong> of <strong>{visibleTasks.length}</strong></span><div><Button disabled={currentPage <= 1} onClick={() => setPage(currentPage - 1)}>← &nbsp;Previous</Button><span className="page-number">{currentPage} / {totalPages}</span><Button disabled={currentPage >= totalPages} onClick={() => setPage(currentPage + 1)}>Next &nbsp;→</Button></div></div>}
    </section>
    {formOpen && <div className="form-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) closeForm(); }}><section className="form-panel" aria-labelledby="form-title"><div className="form-panel__heading"><div><div className="eyebrow">TASK DETAILS</div><h2 id="form-title">{editing ? 'Edit task' : 'Create a task'}</h2></div><button className="close-button" aria-label="Close form" onClick={closeForm}>×</button></div><TaskForm key={editing?.id ?? 'new'} task={editing} onSubmit={saveTask} onCancel={closeForm} submitLabel={editing ? 'Save changes' : 'Create task'} /></section></div>}
    <Modal open={Boolean(deleting)} title="Delete this task?" onClose={() => { setDeleting(undefined); setActionError(''); }} onConfirm={() => void confirmDelete()} busy={busy}><p>This will permanently remove <strong>{deleting?.title}</strong> from your workspace.</p>{actionError && <p className="inline-error" role="alert">{actionError}</p>}</Modal>
  </>;
}
