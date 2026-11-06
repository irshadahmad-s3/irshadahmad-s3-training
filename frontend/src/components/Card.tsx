import { Link } from 'react-router-dom';
import type { Task } from '../types/Task';
import { Button } from './Button';

interface CardProps { task: Task; onEdit: (task: Task) => void; onDelete: (task: Task) => void }
const statusLabels = { pending: 'Pending', 'in-progress': 'In progress', completed: 'Completed' };

export function Card({ task, onEdit, onDelete }: CardProps) {
  const due = task.dueDate ? new Date(`${task.dueDate.slice(0, 10)}T00:00:00`) : null;
  const overdue = due && task.status !== 'completed' && due.getTime() < new Date(new Date().toDateString()).getTime();
  return <article className="task-card">
    <div className="task-card__top"><span className={`status status--${task.status}`}>{statusLabels[task.status]}</span><span className="task-card__id">TASK-{String(task.id).padStart(3, '0')}</span></div>
    <Link className="task-card__title" to={`/tasks/${task.id}`}>{task.title}</Link>
    <p className="task-card__description">{task.notes}</p>
    <div className="task-card__meta"><span><span className="meta-icon">◷</span><span className={overdue ? 'overdue' : ''}>{due ? due.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'No due date'}</span></span><span><span className="avatar">{task.owner.slice(0, 1).toUpperCase()}</span>{task.owner}</span></div>
    <div className="task-card__actions"><Button variant="ghost" onClick={() => onEdit(task)}>Edit</Button><Button variant="ghost" className="delete-link" onClick={() => onDelete(task)}>Delete</Button></div>
  </article>;
}
