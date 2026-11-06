import { useCallback, useEffect, useState } from 'react';
import { getErrorMessage, getTasks } from '../services/taskService';
import { useTaskContext } from '../context/TaskContext';

export function useTasks() {
  const { tasks, setTasks } = useTaskContext();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    setLoading(true);
    setError('');
    try { setTasks(await getTasks()); }
    catch (cause) { setError(getErrorMessage(cause)); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);
  return { tasks, setTasks, loading, error, refresh };
}
