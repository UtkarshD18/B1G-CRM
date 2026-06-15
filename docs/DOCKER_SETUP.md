# Docker Setup

Last audited: 2026-06-15

## Files

| File | Purpose |
| --- | --- |
| `Dockerfile` | Multi-stage app image: backend deps, frontend build, runtime. |
| `docker-compose.yml` | Runs PostgreSQL 16 and the app service. |
| `.dockerignore` | Keeps local/development files out of build context. |
| `.env.example` | Template for compose env values. |

## Dockerfile Flow

| Stage | Behavior |
| --- | --- |
| `server-deps` | Uses `node:20-bookworm-slim`, installs Python/make/g++, runs `npm ci --omit=dev`. |
| `client-build` | Installs `client` dependencies, sets `VITE_API_URL`, runs `npm run build`. |
| `runtime` | Copies repo, backend `node_modules`, and `client/dist`; removes `client/node_modules`; creates runtime dirs; exposes `3010`; runs `node server.js`. |

## Compose Services

| Service | Image/build | Ports | Notes |
| --- | --- | --- | --- |
| `postgres` | `postgres:16-alpine` | `${PGPORT:-5432}:5432` | Uses named volume `postgres-data`; healthchecked with `pg_isready`. |
| `app` | Local `Dockerfile` | `${PORT:-3010}:${PORT:-3010}` | Depends on healthy Postgres; uses `.env`; overrides DB host to `postgres`. |

## Compose Volumes

| Volume | Container path |
| --- | --- |
| `postgres-data` | `/var/lib/postgresql/data` |
| `app-logs` | `/app/logs` |
| `app-sessions` | `/app/sessions` |
| `app-contacts` | `/app/contacts` |
| `app-conversations` | `/app/conversations` |
| `app-flow-json` | `/app/flow-json` |
| `app-media` | `/app/client/public/media` |

## Startup

```bash
cp .env.example .env
# Fill PGPASSWORD, JWT_SECRET, and REFRESH_TOKEN_SECRET.
docker compose up --build
```

Default access:

| Endpoint | URL |
| --- | --- |
| App/API | `http://localhost:3010` |
| Health | `http://localhost:3010/api/health` |
| PostgreSQL from host | `localhost:5432` |

## Runtime Behavior

When the app container starts:

1. `node server.js` loads config.
2. `database/migrate.js` applies unapplied SQL migrations.
3. Express starts on `PORT`.
4. QR init runs, but QR session functions currently come from stubs.
5. Campaign loop starts.
6. Socket.IO attaches to the HTTP server.

## Important Env Values

| Variable | Docker behavior |
| --- | --- |
| `PGPASSWORD` | Required by compose for Postgres and app. |
| `PGUSER`, `PGDATABASE`, `PGPORT` | Used by Postgres and app. |
| `PGHOST` | Overridden to `postgres` for the app service. |
| `DATABASE_URL` | Explicitly set to empty string in app service so host/port variables are used. |
| `PORT` | Defaults to `3010`. |
| `FRONTEND_URL`, `BACKEND_URL` | Default to `http://localhost:3010` in compose. |
| `CORS_ORIGINS` | Defaults to `http://localhost:3010,http://localhost:5173`. |
| `VITE_API_URL` | Build arg defaults to `/api`. |

## Healthcheck

The image healthcheck runs a Node HTTP request against `http://127.0.0.1:$PORT/api/health` and expects HTTP 200.

## Caveats

| Caveat | Impact |
| --- | --- |
| `PGPASSWORD` must be set in `.env` | Compose uses plain `${PGPASSWORD}` interpolation to avoid secret-scanner false positives from required-variable syntax. |
| Compose volume persists `client/public/media` only | `client/public/meta-media` is not separately persisted in `docker-compose.yml`. |
| Runtime migrations always run | Bad migrations can prevent app startup. |
| QR is stubbed | Docker starts QR init, but current QR implementation does not create real sessions. |
| The frontend is built into `client/dist` | Vite dev server is not used in production compose. |
