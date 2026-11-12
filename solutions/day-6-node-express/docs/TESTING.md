# TaskFlow testing and QA

## Test layout

- Backend unit tests use Vitest to exercise the existing authentication helpers/repository, task repository, and PostgreSQL/MongoDB notes adapters. Database modules are mocked, so unit tests never connect to a database.
- Backend HTTP tests use Node's built-in test runner and exercise the Express app over loopback HTTP. The database integration suite uses the isolated test containers described below.
- Frontend component tests use Vitest, React Testing Library, and jsdom. They exercise authentication and task forms, task loading/error states, task search, and task create/edit/delete actions while mocking the API service.
- Backend unit coverage is the V8 line coverage for `auth.js`, `auth.repository.js`, `task.repository.js`, and `notes.js`. The project has no distinct service layer, so this is a measure of existing backend logic modules, not a service-layer percentage. API integration and frontend component tests are reported separately.

Coverage measures which source lines ran; it does not establish that assertions cover every behavior, database condition, security property, or browser rendering difference. The configured 80% backend threshold applies to the four unit-tested backend modules only. Frontend coverage is informative and has no threshold.

The application and Vite support Node 18. Vitest 4 test commands require Node 20.x, 22.x, or 24 and newer. Verification here used Node 22.23.4.

## Verification results

Verified on 2026-11-11:

- Backend unit suite: 25 passed. V8 line coverage is 100% across `auth.js`, `auth.repository.js`, `task.repository.js`, and `notes.js`; branch coverage is 92.3%. There are no uncovered lines in those modules. The remaining branch gaps are short-circuit paths in authentication and CSRF checks, such as the alternate missing/mismatched cookie and header combinations.
- Backend HTTP suite: 9 passed; 7 database integration cases were skipped because the regular `npm test` command is database-independent.
- Backend API integration suite: 16 passed against the dedicated PostgreSQL and MongoDB test containers, 0 failed, 0 skipped.
- Frontend component suite: 15 passed. Line coverage is 92% for the three included components/pages. Remaining TaskList gaps include edit-from-detail navigation state, dismissing notices, and pagination. The TaskForm status selection branch is also uncovered.
- Frontend TypeScript check and production build passed. Backend JavaScript syntax checks passed.
- Integration cleanup was verified: the test PostgreSQL `users`, `tasks`, and `notes` tables each had zero rows; the test MongoDB `notes` collection had zero documents.

Backend HTML coverage is generated at this app's `coverage/index.html`. Frontend HTML coverage is generated at the repository's `frontend/coverage/index.html`.

Lint scripts/configuration are not present in either app, so no lint command is available. Vite emits deprecation warnings because the existing React plugin uses its esbuild options; the frontend build and component tests still pass. `npm audit` reports remaining moderate advisories in the existing Swagger JSDoc dependency tree (backend) and the existing React Router 6 dependency (frontend). The proposed React Router fix is a major version upgrade, so it was not applied as part of this test setup.

## Isolated integration database

The test Compose project is separate from the training Compose project. It uses its own PostgreSQL and MongoDB containers, named volumes, loopback-only ports `55432` and `27018`, and test-only credentials/database names. It does not read `.env` to choose integration test targets. The integration-test guard accepts only the dedicated local database names, ports, and PostgreSQL test credentials; it refuses other URLs before importing database clients.

From this directory, prepare and run the integration suite:

```sh
cp .env.test.example .env.test
npm run db:test:up
npm run db:test:init
npm run test:integration
npm run db:test:down
```

`.env.test` is ignored by Git. To remove only the disposable test volumes after stopping the containers, run:

```sh
docker compose -p taskflow-test -f docker-compose.test.yml down -v
```

Do not point these variables at any other database. The checks intentionally reject non-local hosts, different ports, database names, credentials, and URI query options.

## Regular checks

Backend, from this directory:

```sh
npm test
npm run test:unit
npm run test:coverage
```

Frontend, from `frontend/`:

```sh
npm test
npm run test:coverage
npm run typecheck
npm run build
```

## Test case traceability

The feature descriptions below refer to behavior present in the TaskFlow implementation and its API documentation. The repository has no separate TaskFlow requirements specification.

| ID | Feature / requirement source | Scenario and steps | Expected result | Actual result | Status |
|---|---|---|---|---|---|
| API-01 | Public health endpoint in `src/app.js` | Request `GET /health` over HTTP. | `200` with `{ "status": "OK" }`. | Verified by backend API test. | Pass |
| AUTH-01 | Registration validation in `src/app.js` | Submit malformed email or too-short password with CSRF headers. | `400`; no account is created. | Covered by backend auth test. | Pass |
| AUTH-02 | Protected routes and session validation in `src/auth.js` | Call `/auth/me` and `/tasks` without a session; send malformed/expired tokens. | `401` authentication response. | Covered by backend auth test. | Pass |
| AUTH-03 | Role middleware in `src/auth.js` | Request `/admin/users` as a regular account, then as an admin. | User gets `403`; admin gets `200`. | Covered by database integration flow. | Pass |
| TASK-01 | Task CRUD and ownership in `src/app.js` / `src/task.repository.js` | Create a task, read/update/delete it, then try to read or mutate it as another account. | Owner succeeds; other account receives not found. | Covered by database integration flow. | Pass |
| NOTE-01 | PostgreSQL and MongoDB notes routes in `src/notes.js` | Create, list, read, update, and delete a note through each API adapter. | Each endpoint returns the expected saved data and removes test data. | Covered by database integration flow. | Pass |
| UI-AUTH-01 | Login and registration in `frontend/src/pages/AuthPage.tsx` | Submit empty/invalid credentials, then valid form values; verify route after success. | Browser validation blocks invalid input; valid action calls the matching auth action and navigates. | Covered by frontend component tests. | Pass |
| UI-TASK-01 | Task form in `frontend/src/components/TaskForm.tsx` | Submit missing required fields, then valid values; simulate a save failure. | Invalid form is blocked; valid values are submitted; failure appears as an alert. | Covered by frontend component tests. | Pass |
| UI-TASK-02 | Task list in `frontend/src/pages/TaskList.tsx` | Render loading/error/data states, retry, search, create, edit, and delete a task. | State is visible; retry runs; search filters cards; successful create/edit/delete actions update the visible page. | Covered by frontend component tests. | Pass |

## Bug report template

No reproducible application bug is recorded in this QA pass. Use [BUG_REPORT_TEMPLATE.md](BUG_REPORT_TEMPLATE.md) to report a reproduced issue.
