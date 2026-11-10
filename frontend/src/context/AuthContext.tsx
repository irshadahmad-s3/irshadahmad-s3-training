import { createContext, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import { api, setCsrfToken } from '../services/api';

export interface User { id: number; email: string; role: 'user' | 'admin' }
interface AuthValue { user: User | null; loading: boolean; error: string; register: (email: string, password: string) => Promise<void>; login: (email: string, password: string) => Promise<void>; logout: () => Promise<void> }
const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const csrf = await api.get<{ csrfToken: string }>('/auth/csrf');
        setCsrfToken(csrf.data.csrfToken);
        const current = await api.get<{ user: User }>('/auth/me');
        if (active) setUser(current.data.user);
      } catch {
        if (active) setUser(null);
      } finally { if (active) setLoading(false); }
    })();
    return () => { active = false; };
  }, []);

  async function authenticate(path: '/auth/register' | '/auth/login', email: string, password: string) {
    setError('');
    try {
      const response = await api.post<{ user: User }>(path, { email, password });
      setUser(response.data.user);
    } catch (cause) {
      const message = cause instanceof Error && 'response' in cause
        ? (cause as { response?: { data?: { message?: string } } }).response?.data?.message
        : undefined;
      const safeMessage = message || 'Unable to sign in. Please try again.';
      setError(safeMessage);
      throw new Error(safeMessage);
    }
  }
  const value = useMemo<AuthValue>(() => ({
    user, loading, error,
    register: (email, password) => authenticate('/auth/register', email, password),
    login: (email, password) => authenticate('/auth/login', email, password),
    async logout() { await api.post('/auth/logout'); setUser(null); },
  }), [user, loading, error]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}
