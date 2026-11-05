-- Run from psql after db:init. Replace the tagged 10,000-row practice dataset,
-- then capture a fresh before/after plan even if this script ran earlier.
DELETE FROM tasks WHERE owner ~ '^training-[0-9]+$';
INSERT INTO tasks (title, notes, status, due_date, owner)
SELECT 'Generated task ' || n, 'Index practice', 'pending', DATE '2026-12-01', 'training-' || n
FROM generate_series(1, 10000) AS n;
SELECT setval(pg_get_serial_sequence('tasks','id'), (SELECT MAX(id) FROM tasks));
DROP INDEX IF EXISTS idx_tasks_owner_status_due_date;
ANALYZE tasks;

-- Before index: capture the actual plan.
EXPLAIN (ANALYZE, BUFFERS)
SELECT id, title, status, due_date FROM tasks
WHERE owner = 'training-4242' AND status = 'pending' ORDER BY due_date;

CREATE INDEX IF NOT EXISTS idx_tasks_owner_status_due_date ON tasks (owner, status, due_date);
ANALYZE tasks;

-- After index: capture the actual plan using the same query.
EXPLAIN (ANALYZE, BUFFERS)
SELECT id, title, status, due_date FROM tasks
WHERE owner = 'training-4242' AND status = 'pending' ORDER BY due_date;
