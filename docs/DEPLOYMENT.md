# OmniCRMS deployment

Production branch: `main`. Frontend: Firebase project `omnicrms-app` at
https://omnicrms.app. Backend: https://omnicrms-api.onrender.com.

## Automatic releases

Push or merge into `main`. The `OmniCRMS build, test and deploy` GitHub Actions
workflow installs locked dependencies, lints the backend, applies migrations to
an isolated PostgreSQL 16 database with pgvector, runs backend integration tests,
runs frontend tests, and builds the frontend. Pull requests run these checks
without deploying.

After both jobs succeed, the pipeline deploys that exact commit to Render and
waits for Render to report it live and `/ready` to confirm database connectivity.
Only then does it publish the frontend build artifact to Firebase Hosting.
Failed checks or a failed backend deployment stop the release.

Render automatic deploys are off: GitHub Actions owns production code releases.
The Render Blueprint describes the infrastructure; changes to `render.yaml`
may require a manual Blueprint sync when using a public repository connection.
Review plans before syncing to avoid accidental paid resources.

## Configuration

GitHub repository variables:

- `RENDER_SERVICE_ID`: the Render service ID.
- `RENDER_BACKEND_URL`: the HTTPS origin, without `/api`.

GitHub repository secrets:

- `RENDER_API_KEY`: the approved Render deployment credential.
- `FIREBASE_SERVICE_ACCOUNT_OMNICRMS_APP`: Firebase Hosting deployment credential.

Runtime secrets belong in Render environment variables, never in commits or
frontend variables. `DATABASE_URL`, `JWT_SECRET`, `REFRESH_TOKEN_SECRET`, and
`CHANNEL_SECRET_KEY` are generated or linked by the Blueprint. Keep them stable
across deployments. Set provider-specific email, AI, payment, and Meta credentials
in Render when those integrations are needed.

`FRONTEND_URL` is `https://omnicrms.app`. `CORS_ORIGINS` includes that origin,
www, and both Firebase default origins. `BACKEND_URL` and `API_BASE_URL` point
to Render so generated media and callback links do not use localhost.

The frontend build injects `VITE_API_URL` into the HTML before the application
starts so both API clients and Socket.IO use the same backend.

## Free demo limitations

This setup uses the free Render web service and free Render PostgreSQL database.
The database expires after 30 days. Export needed data before it expires.
The web service sleeps when idle; startup can take around a minute.
Uploads, QR sessions, and other local files are lost on restart, redeploy, or sleep.
Background campaigns cannot run reliably while the free service is asleep.
Use durable storage and an always-running service before using real CRM data.
No demo accounts are seeded in production. Create application accounts through
the normal signup flow; administrator provisioning is a separate setup task.

## Verify and recover

- Check the latest GitHub Actions release for all four successful jobs.
- Open `/ready` on the backend; expect `READY` and database `UP`.
- Open the frontend login page and confirm requests target the Render origin.
- For failures, inspect the failing GitHub job and Render deployment logs.
- To roll back, revert the relevant commit on `main`; this runs the same checks
  and deploys both services again. Review database migrations before reverting.

Schema migrations run at backend startup and must remain backwards compatible.
The frontend publishes only after backend readiness, but the two services do not
switch atomically. Avoid releases that require both sides to change simultaneously.
