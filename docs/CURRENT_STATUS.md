# Current Status

Last audited: 2026-06-15

## Implemented

| Area | Evidence |
| --- | --- |
| Express backend | `server.js` mounts all route modules, applies middleware, serves frontend, starts sockets and campaign loop. |
| PostgreSQL migrations | `database/migrate.js` and migrations `000` through `007`. |
| Docker app stack | `Dockerfile` and `docker-compose.yml`. |
| React SPA shell | `client/src/routes/AppRoutes.jsx`, `PortalLayout`, role gates. |
| Admin core pages | Dashboard, plans, users, orders, settings pages exist and call APIs. |
| User workspace pages | Dashboard, inbox, contacts, campaigns, automation flows, chatbot, integrations, billing, API/webhooks, widgets, settings. |
| Agent page | Agent dashboard loads profile, assigned chats, and tasks. |
| Meta WhatsApp Cloud support | Credential storage, template operations, outbound message APIs, webhook ingest. |
| Campaign scheduling | Campaign rows/logs plus recursive loop processor. |
| Chatbot diagnostics | `chatbot_log` table and `/api/chatbot/get_logs`. |
| Webhook rule CRUD | `webhook_rules` migration and `routes/webhooks.js`. |
| AI documentation system | `/docs` and `CLAUDE.md`. |

## Partially Implemented

| Area | Gap |
| --- | --- |
| Auth/session model | Works, but tokens include password hashes and active login routes do not set explicit expiry. |
| Tenant isolation | Mostly query-based by `uid`; no database foreign keys. |
| Inbox realtime | Active socket handlers exist; duplicate legacy websocket/helper paths remain. |
| QR WhatsApp | API/UI scaffolding exists, but QR helper exports stubs/no-ops. |
| Billing | Multiple provider routes exist, but production readiness depends on provider credentials and callback hardening. |
| CMS/translation/theme | APIs write runtime files; this can be fragile in immutable/container deployments. |
| API/webhooks | API key send routes and webhook rule CRUD exist; usage analytics and rule execution/logging are incomplete. |
| Testing | Frontend tests exist; backend tests do not. |

## Missing Or Planned

| Area | Current signal |
| --- | --- |
| Instagram connection and DM/comment bots | Placeholder routes/UI labels only. |
| Telegram sessions/config | Placeholder route only. |
| Web notification/manual push | Placeholder routes only. |
| WhatsApp forms | Placeholder route only. |
| WhatsApp warmer | Placeholder route only. |
| AI calls and WA calls | Placeholder routes only. |
| Backend test suite | Root `npm test` intentionally exits with error. |

## Technical Debt

| Debt | Impact |
| --- | --- |
| `database/schema.sql` incomplete vs migrations | Future agents may use the wrong schema file. |
| Mixed `created_at` and `createdAt` columns | Easy to write invalid queries. |
| No explicit foreign keys | Data integrity relies on route code. |
| Duplicate helper/socket/auth implementations | Risk of editing inactive code. |
| Broad `functions/function.js` utility file | Hard to reason about responsibilities and side effects. |
| Runtime JSON files for core state | Backups/deployments must include filesystem state. |
| Public mutating install/update routes | Production security concern. |

## Architecture Debt

| Debt | Suggested direction |
| --- | --- |
| Active validators duplicate logic | Move routes to unified `middlewares/auth.js` only after compatibility review. |
| Plan data copied as JSON into users | Consider normalized plan assignment/history model. |
| QR add-on stubbed | Decide whether QR is product-supported, then implement or hide routes/UI. |
| Socket state in memory | Horizontal scaling needs adapter/shared state. |
| Campaign loop recursive in app process | Consider worker/queue with locks for multi-instance deploys. |

## Performance Concerns

| Concern | Why |
| --- | --- |
| Chat lists and campaign logs use broad selects | Larger tenants may need pagination/index review. |
| Conversation JSON files are read/written whole | Large chats may become slow and conflict-prone. |
| Campaign loop processes one pending log per campaign per pass | High-volume campaigns need pacing and concurrency design. |
| Socket connection scans iterate over all sockets | Multi-tenant scale may need rooms/adapters. |

## Security Concerns

| Concern | Why |
| --- | --- |
| JWT payload includes password hash | Avoid exposing stored hash material in client-held token. |
| Login tokens have no explicit expiry in active routes | Long-lived tokens increase risk. |
| Some routes mutate files without auth or only body password | `/api/web/install_app` and `/api/web/update_app` are high risk. |
| No foreign keys | Orphaned or cross-tenant data errors are easier. |
| File uploads write under public dirs | Validate file type/size/path carefully. |
| Secrets stored in DB/plain env | Payment, SMTP, Meta tokens require operational protection. |

## Deployment Readiness

| Area | Status |
| --- | --- |
| Local Docker | Ready with `.env` secrets. |
| Production Docker | Mostly ready, but review secret management, QR support, public update routes, media persistence, and scaling. |
| DB migrations | Ready but should be tested against fresh and existing DBs. |
| Frontend build | Docker builds `client/dist`. |
| Observability | Basic logger and healthcheck only. |

## Testing Status

| Command | Status |
| --- | --- |
| `npm test` | Placeholder that exits 1. |
| `cd client; npm test` | Jest configured; app tests exist. |
| Backend route tests | Not found. |
| Migration tests | Not found. |
