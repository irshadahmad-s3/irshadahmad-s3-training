# v1.0.0 release checklist

This checklist prepares the repository for a release. It does not create a tag or publish a release.

## Code and verification

- [ ] Review the final branch diff and confirm the intended Part 1, Part 2, and Part 3 work is present.
- [ ] Run backend unit tests, backend HTTP tests, and integration tests against the isolated test databases.
- [ ] Run frontend component tests, type checking, and production build.
- [ ] Validate `docker compose config`, build the images, and verify the services with disposable data.
- [ ] Obtain a successful GitHub Actions run for the release commit. The workflow also has an explicit `simulate_failure` dispatch input for a separate red-run demonstration; it should remain false for the release run.
- [ ] Recheck the live API contract in Swagger at `/api-docs/` and ensure this documentation matches it.

## Security and data

- [ ] Confirm `.env` files and provider credentials are not tracked; inspect all example files and generated frontend assets for secrets.
- [ ] Set unique production `JWT_SECRET`, PostgreSQL, MongoDB, and admin credentials in the host's secret manager.
- [ ] Confirm `NODE_ENV=production`, `ENABLE_SQL_INJECTION_DEMO=false`, HTTPS, exact `FRONTEND_ORIGIN`, and same-site cookie topology.
- [ ] Use production databases distinct from CI/test databases. Verify database TLS, network allowlists, app permissions, backups, and a tested restore procedure.
- [ ] Review the idempotent schema/auth migration against a backup or disposable production-like database before deployment.

## Release operations

- [ ] Refresh dependency/security review. The existing QA report records moderate advisories in the current Swagger JSDoc and React Router dependency trees; confirm their current status and disposition before release.
- [ ] Confirm package versions (`1.0.0`) and update this changelog if release scope changes.
- [ ] Confirm the deployment target, quotas, cost limits, logs, health checks, and rollback procedure.
- [ ] After the owner approves the final release, create the GitHub release/tag and publish manually. No tag, commit, push, merge, or deployment has been made as part of this documentation task.

## Release status at documentation time

The source and local verification are prepared for review, but the project has not been remotely deployed or released. Release readiness still depends on the successful remote CI run, current dependency advisory review, production secret/database configuration, and the owner's hosting and release decisions.
