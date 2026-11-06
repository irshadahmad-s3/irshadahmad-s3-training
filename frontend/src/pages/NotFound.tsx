import { Link } from 'react-router-dom';

export function NotFound() {
  return <section className="not-found"><span className="not-found__code">404</span><h1>This page wandered off.</h1><p>The page you’re looking for doesn’t exist or may have moved.</p><Link className="button button--primary" to="/tasks">Back to my tasks</Link></section>;
}
