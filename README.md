# irshadahmad-s3-training
S3 Datacom 2-week intern training assignments and project

## Day 7: PostgreSQL and MongoDB

The Day 7 implementation extends the Day 6 Express API in [`solutions/day-6-node-express`](solutions/day-6-node-express/README.md). Setup, environment configuration, database initialization and seeding, API routes, shell exercises, and test instructions are documented there.

Reference materials: [PostgreSQL indexing](solutions/postgres/README.md), [MongoDB blog model](solutions/mongo/blog/README.md), [database comparison](solutions/database-comparison/README.md).

## Day 10 Part 2: Docker and CI

TaskFlow runs as a separate Docker Compose stack with a production-built React frontend, Express API, PostgreSQL and MongoDB. Its databases are private to the Compose network and use dedicated named volumes. The stack does not bind PostgreSQL or MongoDB host ports, so it does not take over the existing training database ports or containers.

For a new checkout without a root `.env`, prepare the Compose environment once:

```sh
cp .env.production.example .env
```

Edit `.env` and replace every example value with unique secrets. Database passwords should use letters and digits so they can be embedded safely in the internal connection URLs. Keep `.env` private and out of version control. Do not replace an existing `.env` used by a persistent Compose database volume; those database credentials must stay in sync. Then start TaskFlow:

```sh
docker compose up --build -d
```

The frontend is available at `http://localhost:8080`; it proxies API requests to the backend on the private Compose network. The backend initializes its existing PostgreSQL schema and additive authentication migration before serving requests. To use another frontend host port, set `TASKFLOW_HTTP_PORT` in `.env` before starting and set `FRONTEND_ORIGIN` to that browser origin.

Check service and database health, then inspect application or database logs:

```sh
docker compose ps
docker compose logs --tail=100 frontend backend postgres mongodb
docker compose logs -f backend
```

The backend writes structured request and database error events to stdout/stderr. Log records include request method/path and safe error type/code fields; they omit request bodies, messages, credentials, tokens, and cookies. Compose collects these logs. Stop the stack while retaining its data with `docker compose down`. Do not use `docker compose down -v` unless you intend to delete the TaskFlow Compose database volumes.

### Environments and CI

- Existing local development keeps using `solutions/day-6-node-express/.env.example`, `npm start`, and `frontend/.env.example` with `npm run dev`.
- The existing isolated test environment uses `solutions/day-6-node-express/.env.test.example` and the test-only Compose project. CI uses ephemeral PostgreSQL/MongoDB services and only the guarded `taskflow_test` targets and test credentials.
- Compose production settings are documented in `.env.production.example`; when no root `.env` exists, copy it there and replace the placeholders before startup. The local verified stack in this checkout already has a randomly generated, ignored root `.env` with mode `0600`.

GitHub Actions runs backend unit and HTTP tests, isolated PostgreSQL/MongoDB integration tests, frontend component tests, frontend type checking, and a frontend production build on pushes and pull requests. Neither app currently defines a lint script, so the workflow reports that lint is not configured. For a successful run, push a branch or open a pull request. To demonstrate a deliberate red run after all checks pass, use **Actions → TaskFlow CI → Run workflow** and set `simulate_failure` to true; an ordinary run leaves it false.
