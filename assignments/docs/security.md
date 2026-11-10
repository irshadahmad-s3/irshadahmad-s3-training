# Day 9: Authentication, Authorization and Security

This training app uses email/password accounts, PostgreSQL, JWTs in HttpOnly cookies, and role checks. GitHub sign-in is described below but is **not implemented**.

## Authentication and authorization

Authentication answers “Who signed in?” A successful login establishes a session for a user. Authorization answers “What may this user do?” The API checks the role and the owner of each task on every request. A button hidden in React is only a convenience; the server is the security boundary.

## Sessions, JWTs and passwords

A traditional server session stores session data on the server and sends the browser a random session ID. A JWT stores signed claims in a token. This app uses a short-lived (one hour) signed JWT in an `HttpOnly` cookie. The API verifies its signature, issuer, audience and expiry, then reloads the user and role from PostgreSQL. The cookie is not readable by page JavaScript and is never stored in localStorage. A database-backed session is another good choice when immediate revocation or server-side session management is more important.

Passwords are hashed with bcryptjs (12 work rounds). Hashing is one-way and deliberately costly, unlike encryption, which can be reversed. Registration accepts passwords of at least 12 characters and at most 72 UTF-8 bytes (bcrypt's input limit); plaintext passwords and hashes are never returned by the API. Login uses the same error for an unknown email and an incorrect password.

## OAuth 2.0 and GitHub sign-in

OAuth 2.0 lets a user authorize an application without giving it their provider password. A typical GitHub sign-in sends the browser to GitHub with a registered callback URL and a random `state`; GitHub returns a short-lived authorization code; the backend checks `state`, exchanges the code using its client secret, and fetches the GitHub profile. The backend then finds or creates a local account and starts its own session. Keep the client secret on the backend, validate `state`, request only needed scopes, and use HTTPS in production.

This project does not currently implement GitHub OAuth and has no GitHub OAuth configuration variables. To add it later, register a GitHub OAuth App with a callback such as `https://your-domain.example/auth/github/callback`, configure server-only client ID/secret and callback URL variables, and implement state validation plus the code exchange. Do not treat a GitHub profile response as a local session by itself.

## Roles and task ownership

New accounts always receive the `user` role in SQL; request fields cannot assign a role. The `admin` role is granted only through the local admin seed script. `/admin/users` is checked by server middleware and returns 401 without a valid login or 403 to a normal user. Task reads, updates and deletes include the authenticated user ID in parameterized SQL. Admins can review all tasks, including legacy rows that predate ownership. Existing task rows are not deleted; their new `user_id` is `NULL` until an administrator chooses to migrate/assign them.

## OWASP Top 10 overview

OWASP's Top 10 is a common awareness list of web application risks: broken access control, cryptographic failures, injection, insecure design, security misconfiguration, vulnerable components, authentication failures, software/data integrity failures, logging and monitoring failures, and server-side request forgery. It is a guide for reviewing risks, not a guarantee that an app is secure. This project addresses several examples with role/ownership checks, bcrypt, parameterized SQL, validation, Helmet, safe cookies, CSRF checks, rate limiting and generic error responses.

## SQL injection: demonstration and fix

SQL injection happens when user input is joined into SQL text. For example, this is unsafe:

```js
const sql = `SELECT username FROM users WHERE username = '${input}'`;
await pool.query(sql);
```

The development-only `GET /dev/sql-injection-demo?name=...` route runs this lesson against two inline dummy names (`alice` and `bob`) only. Explicitly enable it in a local shell with `ENABLE_SQL_INJECTION_DEMO=true` (it is disabled by default and is never registered when `NODE_ENV=production`). Try the harmless payload `'%20OR%20'1'%3D'1'--%20` (URL-decoded: `' OR '1'='1'-- `). The unsafe query returns both demo rows because the injected condition is always true. Its companion safe query treats the whole value as a name and returns no rows. It does not read or write application records.

The fix is a parameterized query:

```js
await pool.query('SELECT username FROM users WHERE username = $1', [input]);
```

PostgreSQL receives the SQL structure and value separately. All application PostgreSQL queries use parameters for values. Never use this demo pattern for real tables.

## XSS, CSRF, CORS and cookies

Cross-site scripting (XSS) is untrusted content being interpreted as executable browser code. React escapes text by default; keep that behavior, validate input, and avoid inserting user content with `dangerouslySetInnerHTML`. Content Security Policy headers from Helmet provide another layer, not a replacement for safe rendering.

Cross-site request forgery (CSRF) tricks a browser into sending a cookie-authenticated action. The app uses `SameSite=Strict` cookies and a synchronizer token: fetch `/auth/csrf`, then echo its token in the `X-CSRF-Token` header for every POST/PUT/DELETE request, including login and registration. The server compares the header with a separate cookie. State-changing requests without a matching token receive 403.

CORS tells browsers which web origins may read a response. The API allows one configured frontend origin (`FRONTEND_ORIGIN`, default `http://localhost:5173`) and credentials; it never combines credentials with `*`. CORS is not authentication and does not block command-line clients.

The session cookie is `HttpOnly`, `SameSite=Strict`, path `/`, and expires after one hour. It is `Secure` when `NODE_ENV=production`. Use HTTPS in production. The CSRF token cookie is readable by frontend code so the request header can echo it; the authentication token is not.

## Rate limiting and API security

Login permits five failed attempts per client IP in a 15-minute window, then returns 429 with a generic message. Successful login attempts do not count toward the limit. For multiple production servers, use a shared rate-limit store rather than the in-memory default.

`POST /auth/register`, `POST /auth/login`, `GET /auth/me`, and `POST /auth/logout` are the authentication endpoints. Task and notes APIs require a logged-in user. The task API determines the owner from the verified account; it ignores the submitted `owner` value. `/admin/users` requires the admin role. A missing/invalid/expired JWT returns 401, and a signed-in user without permission receives 403.

## Test pyramid

- **Unit tests** check small functions and rules, such as token rejection and validation.
- **Integration tests** exercise HTTP routes together with PostgreSQL and MongoDB. These tests use dedicated temporary records and clean them up.
- **End-to-end tests** drive the browser UI as a user would. This repository does not currently have an E2E browser test suite.

## Setup and API walkthrough

From `solutions/day-6-node-express`, copy `.env.example` to `.env`, keep your own local credentials, and set `JWT_SECRET` to a random secret of at least 32 characters. Set `FRONTEND_ORIGIN` to the actual frontend origin. Do not commit `.env`.

```sh
npm install
npm run db:init
npm start
```

Start the frontend from `frontend` with `npm run dev`. The Vite proxy sends `/auth`, `/tasks`, `/notes`, and `/admin` calls to port 3000. In a separate shell, the following curl sequence obtains CSRF and cookie values and uses them for registration:

```sh
CSRF=$(curl -s -c cookies.txt http://localhost:3000/auth/csrf | node -e 'let body="";process.stdin.on("data", chunk => body += chunk).on("end", () => process.stdout.write(JSON.parse(body).csrfToken))')
curl -i -b cookies.txt -c cookies.txt -H "X-CSRF-Token: $CSRF" -H 'Content-Type: application/json' \
  -d '{"email":"learner@example.test","password":"a-unique-password-123"}' \
  http://localhost:3000/auth/register
curl -b cookies.txt http://localhost:3000/auth/me
curl -i -b cookies.txt -H "X-CSRF-Token: $CSRF" -X POST http://localhost:3000/auth/logout
```

Use a cookie jar and CSRF token for login too. A wrong email/password produces the same 401 message. To inspect the development SQL lesson, start the backend with `ENABLE_SQL_INJECTION_DEMO=true` (and `NODE_ENV=development`) and visit `http://localhost:3000/dev/sql-injection-demo?name=%27%20OR%20%271%27%3D%271%27--%20`. Compare the `unsafe` and `safe` arrays. Never enable this route in production.

## Demonstrate user and admin permissions

Register a regular account in the UI; its role is `user`, even if a registration JSON body includes a `role` field. Sign in and create a task. A second normal account cannot read or change that task by guessing its ID. A normal user opening `/admin/users` gets 403.

For a local training admin, set `ADMIN_EMAIL` and a unique `ADMIN_PASSWORD` (12 or more characters and at most 72 UTF-8 bytes) only in the backend `.env`, then run:

```sh
npm run db:seed-admin
```

Sign in as that account and open `/admin`; the admin can list accounts and review tasks. The seed script stores a bcrypt hash and never embeds a password in source.

## Tests and commands

```sh
cd solutions/day-6-node-express
npm test
RUN_DB_TESTS=1 npm test # requires initialized isolated training databases
node --check src/app.js
```

The existing database integration tests use the configured training databases and clean up their own records. Do not point them at production data. Frontend checks:

```sh
cd frontend
npm run typecheck
npm run build
```
