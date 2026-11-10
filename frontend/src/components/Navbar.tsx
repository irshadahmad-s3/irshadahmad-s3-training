import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  async function signOut() { try { await logout(); navigate('/login', { replace: true }); } catch { /* Keep the current screen if the server is unreachable. */ } }
  return <header className="navbar"><div className="navbar__inner"><NavLink to="/tasks" className="brand"><span className="brand__mark">✓</span><span>task<span className="brand__light">flow</span></span></NavLink><nav aria-label="Main navigation"><NavLink to="/tasks" className={({ isActive }) => `nav-link${isActive ? ' nav-link--active' : ''}`}>My tasks</NavLink>{user?.role === 'admin' && <NavLink to="/admin" className={({ isActive }) => `nav-link${isActive ? ' nav-link--active' : ''}`}>Admin</NavLink>}</nav><div className="navbar__profile">{user ? <><span className="profile-avatar">{user.email[0].toUpperCase()}</span><span className="profile-name">{user.email} · {user.role}</span><button className="nav-logout" onClick={() => void signOut()}>Log out</button></> : <><NavLink to="/login">Sign in</NavLink><NavLink to="/register">Register</NavLink></>}</div></div></header>;
}
