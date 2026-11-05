# Day 7: PostgreSQL and MongoDB

This extends the Day 6 Express API in place. Existing compiled Day 6 files remain under `dist/`; the Day 7 PostgreSQL-backed API source is under `src/` and keeps `/health`, `/hello`, and the `/tasks` response structure.

## Requirements and setup

- Node.js 18 or newer and npm
- Docker Engine with the Compose plugin, or separately running PostgreSQL 16 and MongoDB 7 services
- `mongosh` for the shell exercises

From this directory:

```sh
npm install
cp .env.example .env
docker compose up -d
npm run db:init
npm run db:seed
npm start
```

The Compose file starts PostgreSQL on port 5432 and MongoDB on port 27017 with persistent named volumes. The checked-in `.env.example` contains local training defaults only. `.env` is ignored by Git; change credentials and update `DATABASE_URL` if you expose services beyond your machine. `MONGODB_URI` and `MONGODB_DATABASE` configure MongoDB. The PostgreSQL pool size can be changed with `PGPOOL_MAX`.

`npm run db:init` applies `db/schema.sql` to create constrained `tasks` and `notes` tables. `npm run db:seed` inserts/refreshes two stable example tasks and notes, so running it again does not duplicate them. `npm start` starts the API on port 3000.

## API examples

Task routes preserve the Day 6 JSON envelopes and use parameterized PostgreSQL queries:

```sh
curl http://localhost:3000/health
curl http://localhost:3000/tasks
curl -X POST http://localhost:3000/tasks -H 'Content-Type: application/json' -d '{"title":"Review schema","notes":"Check constraints","status":"pending","dueDate":"2026-12-01","owner":"Irshad"}'
curl http://localhost:3000/notes/postgres
curl http://localhost:3000/notes/mongo
```

Notes routes provide equivalent CRUD at `/notes/postgres` and `/notes/mongo`; see [the comparison](../database-comparison/README.md).

## MongoDB exercises

With the Compose MongoDB service running:

```sh
mongosh 'mongodb://localhost:27017/s3_training' --file ../mongo/drills.js
mongosh 'mongodb://localhost:27017/s3_training' --file ../mongo/blog/seed.js
mongosh 'mongodb://localhost:27017/s3_training' --file ../mongo/aggregation/sales-report.js
mongosh 'mongodb://localhost:27017/s3_training' --file ../mongo/operators/answers.js
```

Blog collection design and rerunnable sample data are documented in [mongo/blog/README.md](../mongo/blog/README.md). The drills print a completion message; aggregation and operator scripts print result documents for their queries.

## Performance and tests

`npm run db:explain` generates 10,000 task rows, captures actual PostgreSQL `EXPLAIN (ANALYZE, BUFFERS)` output before and after creating an index, and writes it to `solutions/postgres/explain-results.md`. It needs the PostgreSQL service.

`npm test` runs API health/greeting tests and reports database CRUD integration tests as skipped by default. After starting both services and running `npm run db:init`, run `RUN_DB_TESTS=1 npm test` to exercise task CRUD over HTTP against PostgreSQL and Notes CRUD against both databases. Expected baseline: 2 API tests pass and 4 database integration tests skip unless enabled. With both databases running, all 6 tests should pass.

To stop services while retaining data: `docker compose down`. To remove the persistent training databases as well: `docker compose down -v`.
