# TaskFlow deployment preparation

This guide records the app's current deployment requirements. No hosting account, database, or deployment has been created. Test with disposable data before connecting any production database.

## Recommended topology

For the fewest cookie and routing changes, deploy the existing root Compose stack on a Linux host with Docker Engine/Compose, a stable domain, TLS termination, persistent storage, and managed backups. The root Compose stack already has a single browser origin: Nginx serves the frontend and forwards API paths to the private backend network. PostgreSQL and MongoDB have dedicated named volumes and no public ports.

If using separate frontend and API services, the frontend must be built with `VITE_API_BASE_URL`, and the API must allow that exact origin through `FRONTEND_ORIGIN`. Use HTTPS and origins under the same site, such as `app.example.com` and `api.example.com` under a domain you control. The current session cookie uses `SameSite=Strict`; unrelated frontend and API sites will not provide a reliable cookie session. A same-origin reverse proxy is another option.

## Service configuration example

The following Render configuration values describe a possible free/demo deployment from this monorepo. The service setup is manual; there is no Render manifest in the repository.

### PostgreSQL service

Create a PostgreSQL database with TLS support. Store its provider-issued connection string as `DATABASE_URL` in the API service. Use a dedicated application database/user, verify that the application can apply the existing `db/schema.sql` and additive migration, and confirm the provider's connection limits and backup/restore options. Add the provider's TLS options to its connection string when required.

Neon is one possible managed PostgreSQL provider. Current plan quotas change; check its [official plans and limits](https://neon.com/docs/introduction/plans) before choosing it. Neon's official [October 2026 free-plan update](https://neon.com/blog/neon-free-plan-1-gb-per-project) lists 1 GB storage and 100 compute-hours per project per month, which are demo-scale limits.

### MongoDB service

Create a managed MongoDB database and application user with access to the TaskFlow database. Set `MONGODB_URI` to the provider-issued TLS connection string and `MONGODB_DATABASE` to the chosen database. Atlas enforces a project IP access list; configure the backend host's documented outbound address or private network. Do not make the cluster public to all addresses just to bypass an egress configuration issue. See [Atlas IP access lists](https://www.mongodb.com/docs/atlas/security/ip-access-list/).

Atlas Free clusters have fixed storage and operational limits, do not support backups, and can pause after extended inactivity; check the [current Free cluster limits](https://www.mongodb.com/docs/atlas/reference/free-shared-limitations/) before relying on one.

### API service (Render Web Service example)

Create a Node web service with root directory `solutions/day-6-node-express`:

| Setting | Value |
| --- | --- |
| Build command | `npm ci` |
| Start command | `npm run db:init && npm start` |
| Health check path | `/health` |
| Runtime | Node 22 |

Set these runtime variables in the provider dashboard or secret manager:

| Variable | Value |
| --- | --- |
| `NODE_ENV` | `production` |
| `PORT` | Platform-provided port. The API reads `process.env.PORT` (default `3000`). |
| `DATABASE_URL` | Hosted PostgreSQL connection string; do not use the local or CI URL. |
| `PGPOOL_MAX` | A pool limit compatible with the database plan and number of API instances. |
| `MONGODB_URI` | Hosted MongoDB TLS URI; percent-encode URI credentials as required by that provider. |
| `MONGODB_DATABASE` | Application database name. |
| `JWT_SECRET` | A unique cryptographically random value of at least 32 characters. |
| `FRONTEND_ORIGIN` | Exact HTTPS frontend origin, with no path. |
| `ENABLE_SQL_INJECTION_DEMO` | `false`. |

The API's current server uses `PORT` and Express's default all-interface bind. Render documents that web services must bind to `0.0.0.0` and the assigned `PORT`; verify the service health check after deployment. The `db:init` script is idempotent for the current schema and additive auth migration, but database backups and a restore plan should still precede production migration.

### Frontend static site (Render example)

Create a static site with root directory `frontend`:

| Setting | Value |
| --- | --- |
| Build command | `npm ci && npm run build` |
| Publish directory | `dist` |
| Build-time variable | `VITE_API_BASE_URL=https://api.example.com` |

Set the actual API URL before the build: Vite embeds `VITE_*` variables into public JavaScript. This variable must never contain a password, token, or database URI. Configure the frontend's SPA fallback to serve `index.html` for application routes, and configure the custom domain/TLS so its site matches the API's site for cookie requests.

Render's docs support a static publish directory and custom domains for static sites; see its [static-site guide](https://render.com/docs/static-sites) and [web-service guide](https://render.com/docs/web-services). The precise dashboard options can change.

## Deployment sequence

1. Decide on one-origin proxying or HTTPS frontend/API origins under a shared site. Configure DNS and TLS.
2. Create hosted PostgreSQL and MongoDB databases, application credentials, backups, and network access rules.
3. Deploy the API with production environment variables. Check `/health`, `/api-docs/`, schema initialization, and database connectivity in provider logs.
4. Deploy the frontend with its public `VITE_API_BASE_URL` build setting and SPA fallback.
5. Set `FRONTEND_ORIGIN` to the exact frontend origin and redeploy the API.
6. Verify registration, login, CSRF-protected mutations, task ownership, admin authorization, and both notes adapters using disposable accounts/data.
7. Test restore procedures, monitoring, cost limits, and secret rotation before using real data.

Keep CI variables and test databases separate from all hosted databases. Never use `TEST_DATABASE_URL`, the fixed test credentials, or `.env.test` in a deployment.

## Free-plan suitability and limits

Free plans are useful for a temporary demo, not a durable production release. Provider quotas and plan names change; re-check official terms immediately before deployment.

- Render says free web services spin down after 15 minutes idle, can take about a minute to wake, and have ephemeral filesystems. Its free PostgreSQL service is limited to 1 GB and expires 30 days after creation, with no backups. Those limits make a Render free database unsuitable for persistent TaskFlow data. See [Render's free-plan documentation](https://render.com/docs/free).
- Neon and MongoDB Atlas offer small free database tiers suitable for demos, with storage/compute or throughput limits and fewer backup/recovery features. Review the linked provider limits above before storing anything important.
- Atlas network allowlisting and the hosting provider's outbound-IP behavior must be made compatible. Do not broaden Atlas access to `0.0.0.0/0` as a deployment shortcut.
- Free compute may sleep, restart, have limited CPU/RAM, or enforce bandwidth/build quotas. Expect cold starts and reduced availability; do not promise production uptime from these plans.
- Hosting the current full Docker Compose stack requires a provider that supports multi-container Compose networking and persistent volumes, or a VM you administer. A static-site service alone cannot run the API or databases.
- The current production cookie policy requires same-site HTTPS. Default free subdomains from unrelated providers may not meet that requirement. A custom domain or same-origin reverse proxy may have additional setup or domain costs.

## Manual credentials and remaining work

Deployment requires the owner to create provider accounts, choose regions/plans, configure DNS, TLS, database credentials, Atlas IP access, and production secrets. The repository does not include those values. No deployment was attempted.
