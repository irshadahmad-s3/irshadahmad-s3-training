# Day 9: Authentication, Authorization and Security

This extends the Day 6 Express API in place. Existing compiled Day 6 files remain under `dist/`; the PostgreSQL-backed API source is under `src/`. The API keeps `/health`, `/hello`, task and notes response formats, with task and notes routes now requiring authentication.

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

The Compose file starts PostgreSQL on port 5432 and MongoDB on port 27017 with persistent named volumes. Copy `.env.example` to `.env` and replace `JWT_SECRET` with a random secret of at least 32 characters before starting. `.env` is ignored by Git; never commit real credentials. Set `FRONTEND_ORIGIN` to the frontend origin. `DATABASE_URL`, `MONGODB_URI`, `MONGODB_DATABASE`, and `PGPOOL_MAX` configure database connections and the PostgreSQL pool.

`npm run db:init` applies the base schema and rerunnable additive migrations. The authentication migration adds a `users` table and nullable task ownership column while retaining existing records. `npm run db:seed` inserts/refreshes two stable example tasks and notes. `npm run db:seed-admin` creates or updates a development admin using `ADMIN_EMAIL` and `ADMIN_PASSWORD` from `.env`. `npm start` starts the API on port 3000.

## API examples

The health endpoints remain public. Tasks and notes require a signed-in account. Obtain a session by registering or logging in; curl examples are in [`assignments/docs/security.md`](../../assignments/docs/security.md).

```sh
curl http://localhost:3000/health
curl http://localhost:3000/health
curl http://localhost:3000/hello
curl http://localhost:3000/tasks # returns 401 until signed in
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

`npm test` runs API/security tests and skips database integration tests by default. After starting both services and running `npm run db:init`, run `RUN_DB_TESTS=1 npm test` to exercise authentication, ownership, task CRUD, notes CRUD and the SQL lesson against temporary data.

To stop services while retaining data: `docker compose down`. To remove the persistent training databases as well: `docker compose down -v`.
