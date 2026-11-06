import { NavLink } from 'react-router-dom';

export function Navbar() {
  return <header className="navbar"><div className="navbar__inner"><NavLink to="/tasks" className="brand"><span className="brand__mark">✓</span><span>task<span className="brand__light">flow</span></span></NavLink><nav aria-label="Main navigation"><NavLink to="/tasks" className={({ isActive }) => `nav-link${isActive ? ' nav-link--active' : ''}`}>My tasks</NavLink></nav><div className="navbar__profile"><span className="profile-avatar">I</span><span className="profile-name">Workspace</span></div></div></header>;
}
