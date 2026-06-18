# DEPLOYMENT_RUNTIME_PROOF.md

**Audit Date**: 2026-06-18  
**Scope**: Dynamic URL resolution, environment dependencies, CORS limits, Docker Compose volumes, and deployment validation.

---

## 1. Environment Variable Audit & URL Bindings

The application uses [env.js](env.js) to resolve all configuration settings dynamically. No hardcoded production URLs exist in the codebase.

| Component / Parameter | Resolution Logic | Production Behavior |
| :--- | :--- | :--- |
| **API Base URL** | `API_BASE = window.__B1GCRM_API_URL__ \|\| ''` | Uses the current window origin. If hosted on `https://crm.oneoftheprojects.com`, all API requests correctly target `https://crm.oneoftheprojects.com/api/...` relatively. |
| **Socket.IO Host** | `io(API_BASE \|\| window.location.origin, ...)` | Connects to the host serving the index page, preventing mixed content issues. |
| **Media URLs** | Dynamic relative routing (`/media/...`) | Served directly by the backend public asset directory. Pathing automatically adapts to the staging domain. |
| **CORS Origins** | Reads `CORS_ORIGINS` env var split by comma. | Blocks cross-origin browser queries. Defaults safely to `FRONTEND_URL` fallback. |
| **Upload Directory** | Reads `UPLOAD_DIR` env (defaults to `./client/public/media`). | Can be remapped to external block storage or persistent mount locations. |
| **Database Connections** | Reads `DATABASE_URL` or individual `PGHOST`, `PGPORT`, etc. | Easily routes to external AWS RDS or secure cluster PostgreSQL databases. |

---

## 2. Docker Compose & Multi-Stage Deployment

The [docker-compose.yml](docker-compose.yml) and [Dockerfile](Dockerfile) are production-ready:
1.  **Multi-Stage Build**: Isolates production dependencies and compiles the React app using Vite without pulling in developer tools.
2.  **Mount Isolation**: Shared folder assets are cleanly persisted using named Docker volumes:
    - `app-logs` -> `/app/logs`
    - `app-sessions` -> `/app/sessions`
    - `app-conversations` -> `/app/conversations`
    - `app-flow-json` -> `/app/flow-json`
    - `app-media` -> `/app/client/public/media` (ensuring uploads persist during image redeployments).

---

## 3. Production Readiness Confirmation

> [!IMPORTANT]
> **No Code Rewrites Required**  
> We confirm B1GCRM can move from `localhost` to staging or production without any code changes. All configuration is strictly managed through standard UNIX environment variables.

### Verification Matrix
- **Relative Requests**: Verified that Axios/fetch requests use relative paths (`/api/...`).
- **Relative Sockets**: Verified that client Socket connections dynamically bind to `window.location.origin`.
- **CORS Isolation**: Verified CORS origin controls read dynamically from environmental properties.
- **Volume Binding**: Verified container uploads write to Docker volume locations.
- **Port Mapping**: Verified server listens on `process.env.PORT` or binds to compose properties.
