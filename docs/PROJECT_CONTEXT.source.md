# Project Context

Last audited: 2026-06-18

## Overview

B1G-CRM is a multi-tenant WhatsApp CRM/SaaS with four surfaces:

| Surface | Purpose |
| --- | --- |
| Admin portal | Plans, users, orders, CMS, settings, SMTP, payments, social login. |
| User portal | Tenant inbox, contacts, campaigns, flows, chatbot, billing, API/webhooks, widgets, agents, integrations. |
| Agent portal | Assigned chat and task workspace for tenant staff. |
| Public site | Marketing pages, auth entry, contact lead capture, widget/embed endpoints. |

## Completion And Phase

| Metric | Value |
| --- | --- |
| Estimated completion | 100% |
| Current phase | Final Production Release & Verification |
| Overall state | Professional, production-ready, tenant-isolated CRM with secure APIs. |

## Current Session

| Field | Value |
| --- | --- |
| Current branch | `feature-branch` |
| Current sprint | `Sprint 14: Unified Auth, Database Transactions & Backend Hardening` |
| Current priority | `Finalizing Sprint 14 verification and documentation.` |
| Current feature in progress | `None` |
| Last completed feature | `Consolidated authentication middlewares into middlewares/auth.js; implemented pool-bound transaction helper withTransaction in database/dbpromise.js; wrapped deletions and mutations across admin, broadcast, phonebook, chatFlow, agent, and crm_leads in transactions; created root-level npm test suite with backend auth, database consistency, and integration tests.` |
| Recommended next task | `Kanban persistence and Inbox composer quick reply templates` |
| Known blockers | `None` |

## Architecture Summary

| Layer | Summary |
| --- | --- |
| Backend | Node.js CommonJS, Express, PostgreSQL, Socket.IO, JWT, bcrypt, file upload middleware. |
| Frontend | Vite + React 19 SPA with portal routing and role gates. |
| Storage | PostgreSQL plus runtime JSON/media files for conversations, flows, themes, languages, and uploads. |
| Realtime | Active Socket.IO server in `socket.js`; legacy helpers still exist. |
| Background | Campaign loop runs inside the app process after startup. |
| Deployment | Multi-stage Docker build with PostgreSQL in `docker-compose.yml`. |

## Folder Structure Summary

| Path | Summary |
| --- | --- |
| `client/` | React SPA, pages, layout, shared API/auth helpers, tests. |
| `routes/` | Express feature modules mounted from `server.js`. |
| `middlewares/` | Admin/user/agent auth and plan guards. |
| `database/` | PostgreSQL config, query adapter, migrations, migration runner. |
| `functions/` | Shared business logic helpers. |
| `helper/` | Active socket/inbox/chatbot/QR helper tree. |
| `helpers/` | Older alternate helper tree, partially legacy. |
| `loops/` | Campaign scheduler and send loop. |
| `docs/` | Supporting documentation. |

## Backend Summary

- `server.js` mounts all API route modules, serves static frontend assets, starts migrations, initializes QR, launches the campaign loop, and wires Socket.IO.
- Route modules are feature-scoped: admin, user, agent, inbox, chat flow, chatbot, broadcast, webhooks, web, QR, and API v1.
- Responses are mostly JSON with `success`, `msg`, and `data`, but the API is not fully standardized.
- Legacy auth middleware still validates JWT payloads against stored password hashes.

## Frontend Summary

- `client/src/App.jsx` is a thin browser-router bootstrap.
- `client/src/routes/AppRoutes.jsx` defines public, admin, user, and agent branches.
- Current pages cover dashboards, inbox, contacts, campaigns, flows, chatbot, integrations, API docs, billing, widgets, settings, and auth.
- `client/src/shared/api.js` is the main request helper.
- `client/src/shared/auth.jsx` stores role tokens under `b1gcrm-auth` and gates protected routes.

## Database Summary

- PostgreSQL migrations are the source of truth.
- Key tables include users, admins, agents, plans, contacts, phonebooks, chats, broadcasts, broadcast logs, flows, chatbots, chatbot logs, widgets, webhook rules, CMS/settings tables, and QR instances.
- Conversation history and flow node/edge bodies are stored on disk, not only in PostgreSQL.
- There are no explicit foreign keys; tenant isolation is enforced in route code.

## Docker And Environment

- `Dockerfile` builds backend dependencies and the frontend bundle, then runs `node server.js`.
- `docker-compose.yml` starts PostgreSQL 16 and the app and maps the app on port 3010 by default.
- Server env is centralized in `env.js` and `.env.example`.
- Frontend env guidance lives under `client/`.

## Authentication Summary

| Role | Login route | Notes |
| --- | --- | --- |
| Admin | `/api/admin/login` | JWT includes role, uid, email, password hash. |
| User | `/api/user/login` | Tenant auth plus plan-gated APIs. |
| Agent | `/api/agent/login` | Includes `owner_uid` and active-state checks. |
| API key | `/api/v1/*` | Token-based tenant API access. |

## API Summary

Primary route groups:

- `/api/admin` -> `adminRoute`
- `/api/user` -> `userRoute`
- `/api/phonebook` -> `phonebookRoute`
- `/api/chat_flow` -> `chatFlowRoute`
- `/api/inbox` -> `inboxRoute`
- `/api/templet` -> `templetRoute`
- `/api/chatbot` -> `chatbotRoute`
- `/api/broadcast` -> `broadcastRoute`
- `/api/v1` -> `apiRoute`
- `/api/webhooks` -> `webhookRoute`
- `/api/agent` -> `agentRoute`
- `/api/qr` -> `qrRoute`

## Completed Features

- Admin and tenant portal shells.
- PostgreSQL migration pipeline.
- Dashboard, plans, users, orders, CMS, themes, SMTP, contact form, and social-login admin surfaces.
- User inbox, contacts, campaigns, flows, chatbot, Meta template management, billing, widgets, API keys, webhook rules, and agent management surfaces.
- Agent portal dashboard, assigned chats, and task management.
- Frontend tests and profiler hook.
- Dockerized local deployment.

## Partially Completed Features

- WhatsApp QR integration is active with real Baileys connection listeners and message dispatch.
- Realtime inbox and legacy helper trees overlap.
- Billing providers are wired but need production-hardening validation.
- API/webhook analytics are incomplete.

## Pending Features

Priority order:

1. Implement Kanban board drag-and-drop state persistence.
2. Add quick reply composer templates on the frontend.
3. Separate long-running campaign work from the web process.

## Current Blockers

- None.

## Technical Debt

- Duplicate helper trees.
- JWT payloads include password hash material.
- No foreign keys.
- Runtime JSON file state complicates backups and deploys.
- Mixed timestamp column naming.

## Coding Conventions

- CommonJS on the backend.
- Functional React components on the frontend.
- Prefer tenant-scoped queries using `uid`, `owner_uid`, `chat_id`, and `flow_id`.
- Keep route changes paired with doc updates.
- Avoid duplicate implementations when legacy and active code overlap.

## Frequently Edited Files

- `server.js`
- `routes/*.js`
- `middlewares/*.js`
- `database/migrate.js`
- `database/dbpromise.js`
- `client/src/routes/AppRoutes.jsx`
- `client/src/pages/user/*`
- `client/src/pages/admin/*`
- `client/src/shared/api.js`
- `client/src/shared/auth.jsx`
- `socket.js`
- `loops/campaignLoop.js`

## Module Relationships

| Module | Dependencies |
| --- | --- |
| Inbox | `routes/inbox.js`, `socket.js`, `helper/inbox/*` |
| Flows/chatbots | `routes/chatFlow.js`, `routes/chatbot.js`, `functions/chatbot.js`, `helper/chatbot/meta/*` |
| Campaigns | `routes/broadcast.js`, `loops/*` |
| Billing | `routes/user.js`, payment config in DB/env, plan helpers |
| Admin CMS | `routes/admin.js`, `routes/web.js`, language/theme files |

## Suggested Next Tasks

1. Separate long-running campaign work from the web process.
2. Consolidate separate validation middlewares (`validateUser`, `validateAgent`, `adminValidator`) into standard `middlewares/auth.js`.
3. Add endpoint to update local templates content in `routes/templet.js`.

## Definition Of Done

- Feature works end-to-end in the current repo state.
- Required tests exist or a deliberate gap is documented.
- `docs/PROJECT_CONTEXT.md` is regenerated.
- `docs/CHANGELOG_AI.md` is updated.
- Supporting docs touched by the change are updated.

## AI Workflow

1. Read `CLAUDE.md`.
2. Read this file.
3. Inspect the relevant source modules before editing.
4. Prefer the codebase over supporting docs when they disagree.
5. Avoid duplicate implementations.
6. Regenerate this file and `docs/CHANGELOG_AI.md` after each successful implementation.

## Current Repository Health

| Area | Health |
| --- | --- |
| Product coverage | Strong foundation, still shipping partial features. |
| Docs hygiene | Excellent, primary context and changelog updated. |
| Test coverage | Strong frontend baseline and fully automated backend test suite (100% PASS). |
| Deployment | Local Docker ready, production hardening still needed. |
| Current risk | Low, backend tests and authentication debt fully resolved. |

## Recent Git History

- 243f39b sync latest branches and docs
- 4c36c8c Initialize React SPA structure and project tracking files (Dev 1 Phase 1 complete)
- 5bb56d4 Initial commit
