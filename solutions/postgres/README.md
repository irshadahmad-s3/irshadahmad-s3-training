# PostgreSQL query plan exercise

Run `npm run db:explain` from `solutions/day-6-node-express` after PostgreSQL is initialized. The command inserts 10,000 sample rows, runs `EXPLAIN (ANALYZE, BUFFERS)` for a selective owner/status lookup before and after creating a composite index, and writes the **actual server output** to this directory as `explain-results.md`. You can also execute `indexing.sql` using `psql`.

In the captured run ([actual plan output](explain-results.md)), PostgreSQL examined 10,002 task rows. Before the index it used a sequential scan, removed 10,001 rows by filter, and reported 5.042 ms execution time. After creating the index it used `idx_tasks_owner_status_due_date`, read the one matching row through an index scan, and reported 0.145 ms. This is one local run, not a guaranteed speedup: timing varies by PostgreSQL version, data, cache, statistics, and hardware.

A sequential scan examines table rows and can be cheaper when a query needs much of the table. An index scan uses the B-tree to find matching keys and visit fewer rows. The composite index `(owner, status, due_date)` matches two equality filters and the sort key. The full `EXPLAIN (ANALYZE, BUFFERS)` output is saved alongside this explanation.
