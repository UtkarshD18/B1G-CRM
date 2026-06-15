# Folder Structure

Last audited: 2026-06-15

## Tree

```text
.
|-- client/                  React + Vite SPA
|   |-- public/              Static assets served by Vite/app
|   `-- src/
|       |-- components/      Shared page components
|       |-- layouts/         Portal layout
|       |-- pages/           Public, auth, admin, user, agent screens
|       |-- routes/          React route registry
|       |-- shared/          API/auth/navigation/constants helpers
|       |-- store/           Zustand stores
|       |-- test/            Jest test helpers
|       `-- utils/           Axios API helper
|-- contacts/                Runtime/import folder placeholder
|-- conversations/           Conversation JSON history
|-- database/                PostgreSQL config, schema, migrations
|-- emails/                  Recovery email HTML helpers
|-- flow-json/               Runtime flow node/edge JSON
|-- functions/               Backend utility/business logic
|-- helper/                  Active helper tree
|-- helpers/                 Legacy/alternate helper tree
|-- languages/               Translation JSON files
|-- logs/                    Runtime log output
|-- loops/                   Campaign/background loop logic
|-- middlewares/             Auth, plan, error middleware
|-- routes/                  Express API modules
|-- sessions/                Runtime session placeholder
|-- socket/                  Placeholder folder
|-- utils/                   Logger and auth utilities
|-- server.js                Express bootstrap
|-- socket.js                Active Socket.IO server
|-- websocket.js             Older/alternate Socket.IO server
|-- env.js                   Backend env config
|-- Dockerfile               Production image
|-- docker-compose.yml       App + PostgreSQL stack
`-- docs/                    AI living documentation
```

## Root Files

| File | Purpose |
| --- | --- |
| `.env.example` | Server env template. |
| `.dockerignore` | Excludes local/development files from Docker build context. |
| `.gitignore` | Git ignore rules. |
| `package.json` | Backend scripts/dependencies. |
| `package-lock.json` | Backend lockfile. |
| `server.js` | Backend application entrypoint. |
| `socket.js` | Active realtime server. |
| `websocket.js` | Alternate legacy realtime server; not initialized by `server.js`. |
| `env.js` | Central config. |
| `README.md` | Human setup overview. |
| `PROJECT_PLAN.md`, `FEATURE_TRACKER.md`, `ENGINEERING_TRACKER.md`, `REFERENCE_APP_AUDIT.md`, `PENDING_TASKS.md` | Existing planning/tracking docs. |
| `CLAUDE.md` | AI entrypoint/update instructions. |

## Important Directories

| Directory | Why it exists |
| --- | --- |
| `client/src/routes` | Owns the SPA route tree and reference route arrays. |
| `client/src/pages/admin` | Admin portal pages for dashboard, plans, users, orders, settings. |
| `client/src/pages/user` | Tenant workspace pages. |
| `client/src/pages/agent` | Agent workspace page. |
| `client/src/shared` | Current fetch/auth/navigation helpers used by pages. |
| `routes` | Backend API modules mounted by `server.js`. |
| `middlewares` | Active route auth and plan checks. |
| `database/migrations` | Runtime source of truth for database creation. |
| `functions` | Broad helper functions, including Meta API, payment helpers, email, JSON/file helpers, chatbot dispatch. |
| `helper/socket` | Active Socket.IO event handlers. |
| `helper/inbox` | Active incoming Meta/QR message normalization and socket fanout. |
| `helper/chatbot` | Active chatbot execution helpers. |
| `helper/addon/qr` | QR/Baileys add-on area; currently stubbed in `index.js`. |
| `helpers` | Older helper namespace. Verify imports before editing because some files may still be referenced indirectly, but active routes mostly use `helper`. |
| `loops` | Campaign queue processor and template send helpers. |
| `conversations/inbox` | Runtime JSON files per tenant/chat. Do not treat this as source code. |
| `flow-json/nodes`, `flow-json/edges` | Runtime flow definitions per tenant/flow. |

## Generated/Runtime Data

| Path | Data |
| --- | --- |
| `logs/*.log` | Logger output, especially production/error logs. |
| `client/public/media` | Uploaded media and widget assets. |
| `client/public/meta-media` | Meta/QR downloaded media when present. |
| `conversations/inbox/<uid>/<chatId>.json` | Message history. |
| `flow-json/nodes/<uid>/<flowId>.json` | Flow nodes. |
| `flow-json/edges/<uid>/<flowId>.json` | Flow edges. |
| `sessions/` | QR/session runtime data placeholder. |

## Duplicate Or Similar Areas

| Pair | Current reading |
| --- | --- |
| `helper/` vs `helpers/` | `helper/` is active for socket/inbox/chatbot/QR imports used by `server.js` and `routes/inbox.js`. `helpers/` includes older code that imports `websocket.js`. |
| `socket.js` vs `websocket.js` | `server.js` initializes `socket.js`. `websocket.js` is alternate/legacy and is not called by `server.js`. |
| `middlewares/user.js` etc. vs `middlewares/auth.js` | Routes import `user.js`, `admin.js`, `agent.js`. `auth.js` is newer structured middleware but not active in route imports. |
| `client/src/shared/api.js` vs `client/src/utils/api.js` | Pages mainly use `shared/api.js`; Zustand store uses `utils/api.js`. |
