# Changelog

Notable changes to TaskFlow are recorded here.

## [1.0.0] - 2026-11-12

### Added

- Email/password registration and login, bcrypt password hashing, signed one-hour sessions in HTTP-only cookies, CSRF protection, login rate limiting, and role-based administrator access.
- Authenticated task create, list, read, update, and delete operations with account ownership checks.
- Notes CRUD adapters backed by PostgreSQL and MongoDB.
- React and TypeScript task dashboard with authentication, task search/filter/sort/pagination, task forms, and administrator account view.
- PostgreSQL schema and additive authentication/ownership migration; MongoDB notes persistence.
- Backend unit, HTTP/security, and isolated database integration tests; frontend component tests, type checking, and production build.
- Production Dockerfiles and an independent Docker Compose stack with Nginx proxying, health checks, private database networking, and persistent named volumes.
- GitHub Actions CI for backend/frontend checks and isolated PostgreSQL/MongoDB integration services, including an opt-in deliberate failure demonstration.
- Structured application and database error logging that omits request bodies, credentials, tokens, and cookies.
- Architecture, API, test, deployment, release, and setup documentation.
