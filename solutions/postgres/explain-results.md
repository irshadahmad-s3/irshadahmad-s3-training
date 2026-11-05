# Measured PostgreSQL EXPLAIN comparison

Generated using db:explain on 2026-11-05T09:27:34.642Z. Dataset: 10002 total tasks.

## Before index

```text
Sort  (cost=436.04..436.04 rows=1 width=39) (actual time=4.923..4.925 rows=1 loops=1)
  Sort Key: due_date
  Sort Method: quicksort  Memory: 25kB
  Buffers: shared hit=286
  ->  Seq Scan on tasks  (cost=0.00..436.03 rows=1 width=39) (actual time=2.931..4.871 rows=1 loops=1)
        Filter: ((owner = 'training-4242'::text) AND (status = 'pending'::text))
        Rows Removed by Filter: 10001
        Buffers: shared hit=286
Planning:
  Buffers: shared hit=32
Planning Time: 0.954 ms
Execution Time: 5.042 ms
```

## After index

```text
Index Scan using idx_tasks_owner_status_due_date on tasks  (cost=0.29..8.30 rows=1 width=39) (actual time=0.094..0.097 rows=1 loops=1)
  Index Cond: ((owner = 'training-4242'::text) AND (status = 'pending'::text))
  Buffers: shared hit=1 read=2
Planning:
  Buffers: shared hit=17 read=1
Planning Time: 0.724 ms
Execution Time: 0.145 ms
```
