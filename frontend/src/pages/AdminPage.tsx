import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface AdminUser { id: number; email: string; role: 'user' | 'admin'; created_at: string }
export function AdminPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [error, setError] = useState('');
  useEffect(() => { api.get<{ data: AdminUser[] }>('/admin/users').then((response) => setUsers(response.data.data)).catch(() => setError('Unable to load accounts. Check your admin permission and connection.')); }, []);
  if (user?.role !== 'admin') return <section className="state-panel"><h1>Permission required</h1><p>This page is for administrators.</p></section>;
  return <section className="tasks-section"><div className="section-heading"><div><h1>Accounts</h1><p>Administrator view of registered accounts.</p></div></div>{error ? <p className="inline-error" role="alert">{error}</p> : <ul className="admin-users">{users.map((account) => <li key={account.id}><span>{account.email}</span><strong>{account.role}</strong></li>)}</ul>}</section>;
}
