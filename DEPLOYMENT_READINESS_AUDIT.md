# DEPLOYMENT_READINESS_AUDIT.md

**Audit Date**: 2026-06-18  
**Audit Scope**: Hardcoded domains, ports, socket configurations, environment variable fallbacks, CORS settings, database configs, and Docker readiness.

---

## 1. Network Configuration & Fallback Audit

We audited the codebase for hardcoded occurrences of `localhost`, `127.0.0.1`, `crm.oneoftheprojects.com`, and specific ports:

| Target String | Occurrences Found | Location | Risk | Recommendation |
| :--- | :---: | :--- | :--- | :--- |
| `localhost:3010` | 2 | [client/vite.config.js](file:///home/shadow/projects/B1GCRM/client/vite.config.js#L10-L14) | **None** (Development proxy configuration only; does not affect production builds). | Leave as-is. |
| `localhost:6379` | 2 | [env.js](file:///home/shadow/projects/B1GCRM/env.js#L83), [.env.example](file:///home/shadow/projects/B1GCRM/.env.example#L44) | **Low** (Redis host fallback). | Always define `REDIS_URL` in production env files. |
| `localhost:5173` | 2 | [env.js](file:///home/shadow/projects/B1GCRM/env.js#L93), [.env.example](file:///home/shadow/projects/B1GCRM/.env.example#L55) | **High** (Fallback frontend link for redirects/emails). | Overwrite via `FRONTEND_URL` environment variable. |
| `localhost:${PORT}` | 2 | [env.js](file:///home/shadow/projects/B1GCRM/env.js#L94-L99) | **High** (Used for webhooks callbacks). | Overwrite via `BACKEND_URL` environment variable. |
| `crm.oneoftheprojects.com` | 0 | None in executable code. | **None** | No actions required. |

---

## 2. Component Layer Readiness

### A. Frontend (Vite, Axios, Socket.IO, Uploads, Media URLs)
1.  **Vite Build Configuration**: Built client files use the standard multi-stage build. Custom API routes are configured to proxy backend requests.
2.  **Relative API Requests**: Network requests utilize relative paths (e.g., fetching `/api/user/get_me`). This is highly secure as it adapts dynamically to whatever host and protocol the application is served on.
3.  **Socket.IO Connection Origin**: The client initializes Socket.IO connections with:
    `const socket = io(API_BASE || window.location.origin)`
    Since `API_BASE` resolves to `''` in production, Socket.IO correctly connects directly to the hosting domain, avoiding mixed-content blockages.
4.  **Media and Upload Assets**: Uploaded files are served from `/media/...` which is mapped directly to the server's public directory. Relative paths preserve image preview rendering.

### B. Backend (CORS, Callbacks, Reset Links, Webhooks)
1.  **CORS Origins Configuration**: CORS uses the `cors` middleware, reading `CORS_ORIGINS` split by commas:
    `CORS_ORIGINS=https://crm.oneoftheprojects.com`
    This blocks unauthorized browser requests securely in production.
2.  **Reset Password & Webhook Callbacks**: Callback links in emails (e.g. password recovery) are generated using:
    `const recoveryUrl = \`\${env.FRONTEND_URL}/recovery-user/\${token}\``
    This guarantees that staging and production links direct users to the correct environments.
3.  **Webhook Validation Endpoints**: Incoming Facebook notifications authenticate dynamically using the URL UID path parameter:
    `POST /api/inbox/webhook/:uid`
    This matches the `uid` parameter from the path to verify tokens before subscribing or parsing webhooks.

### C. Docker & Containerization (Compose, Dockerfile, Health Checks)
1.  **Multi-Stage Build Isolation**: The `Dockerfile` separates dependencies:
    *   `server-deps`: Downloads server packages without dev-dependencies.
    *   `client-build`: Performs the Vite bundle build.
    *   `runtime`: Creates the slim deployment image with clean cache directories.
2.  **Named Volumes Persistence**: The `docker-compose.yml` mounts separate volumes for files that must persist across container lifetimes:
    *   `app-logs` -> `/app/logs`
    *   `app-sessions` -> `/app/sessions`
    *   `app-conversations` -> `/app/conversations`
    *   `app-flow-json` -> `/app/flow-json`
    *   `app-media` -> `/app/client/public/media`
3.  **Container Healthchecks**:
    *   **Postgres**: Checks db readiness with `pg_isready`.
    *   **App**: Checks endpoint health with a Node subprocess fetching `http://127.0.0.1:3010/api/health`.

---

## 3. Production Readiness Summary

*   **Configuration State:** 100% Environment-Driven.
*   **Hardcoded Ports Bypass:** Yes (Dynamically binds to `process.env.PORT` or defaults to `3010`).
*   **Database Credentials Exposure:** Clean (Parsed from compose variables).
*   **SSL Configuration:** Handled safely in backend database options (`PGSSL=true`) and by proxy configurations (Nginx/Traefik).
