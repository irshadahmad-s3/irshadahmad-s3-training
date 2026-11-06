import { createContext, useContext, useMemo, useState, type PropsWithChildren } from 'react';
import type { Task } from '../types/Task';

interface TaskContextValue { tasks: Task[]; setTasks: (tasks: Task[]) => void; notice: string; notify: (message: string) => void }
const TaskContext = createContext<TaskContextValue | null>(null);

export function TaskProvider({ children }: PropsWithChildren) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [notice, setNotice] = useState('');
  const value = useMemo(() => ({ tasks, setTasks, notice, notify: setNotice }), [tasks, notice]);
  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>;
}

export function useTaskContext() {
  const context = useContext(TaskContext);
  if (!context) throw new Error('useTaskContext must be used inside TaskProvider');
  return context;
}
