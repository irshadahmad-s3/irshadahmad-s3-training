import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function AuthPage({ mode }: { mode: 'login' | 'register' }) {
  const { login, register, error } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const destination = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname || '/tasks';
  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true);
    try { await (mode === 'login' ? login(email, password) : register(email, password)); navigate(destination, { replace: true }); }
    catch { /* The authentication context displays the safe API message. */ }
    finally { setBusy(false); }
  }
  return <section className="auth-card"><div className="eyebrow">TASKFLOW ACCOUNT</div><h1>{mode === 'login' ? 'Welcome back' : 'Create your account'}</h1><p>{mode === 'login' ? 'Sign in to open your workspace.' : 'Use a valid email and a password of at least 12 characters (maximum 72 UTF-8 bytes).'}</p><form onSubmit={submit} className="auth-form"><label>Email<input type="email" autoComplete="email" required maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} /></label><label>Password<input type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} required minLength={mode === 'register' ? 12 : 1} maxLength={128} value={password} onChange={(event) => setPassword(event.target.value)} /></label>{error && <p className="inline-error" role="alert">{error}</p>}<button className="button button--primary" disabled={busy}>{busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}</button></form><p>{mode === 'login' ? 'New here?' : 'Already registered?'} <Link to={mode === 'login' ? '/register' : '/login'}>{mode === 'login' ? 'Create an account' : 'Sign in'}</Link></p></section>;
}
