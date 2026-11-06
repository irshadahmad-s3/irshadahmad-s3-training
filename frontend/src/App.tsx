import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { TaskProvider } from './context/TaskContext';
import { NotFound } from './pages/NotFound';
import { TaskDetails } from './pages/TaskDetails';
import { TaskList } from './pages/TaskList';

export default function App() {
  return <BrowserRouter><TaskProvider><Navbar /><main className="page-shell"><Routes><Route path="/" element={<Navigate to="/tasks" replace />} /><Route path="/tasks" element={<TaskList />} /><Route path="/tasks/:id" element={<TaskDetails />} /><Route path="*" element={<NotFound />} /></Routes></main><footer className="footer">Made for focused work <span>✳</span></footer></TaskProvider></BrowserRouter>;
}
