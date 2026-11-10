import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { TaskProvider } from './context/TaskContext';
import { NotFound } from './pages/NotFound';
import { TaskDetails } from './pages/TaskDetails';
import { TaskList } from './pages/TaskList';
import { AuthPage } from './pages/AuthPage';
import { AdminPage } from './pages/AdminPage';
import type { ReactNode } from 'react';

function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <p className="auth-loading">Checking your session…</p>;
  return user ? <>{children}</> : <Navigate to="/login" replace state={{ from: location }} />;
}

export default function App() {
  return <BrowserRouter><AuthProvider><TaskProvider><Navbar /><main className="page-shell"><Routes><Route path="/" element={<Navigate to="/tasks" replace />} /><Route path="/login" element={<AuthPage mode="login" />} /><Route path="/register" element={<AuthPage mode="register" />} /><Route path="/tasks" element={<RequireAuth><TaskList /></RequireAuth>} /><Route path="/tasks/:id" element={<RequireAuth><TaskDetails /></RequireAuth>} /><Route path="/admin" element={<RequireAuth><AdminPage /></RequireAuth>} /><Route path="*" element={<NotFound />} /></Routes></main><footer className="footer">Made for focused work <span>✳</span></footer></TaskProvider></AuthProvider></BrowserRouter>;
}
