# Feature Tracker

Last audited: 2026-06-25

Status legend:

| Status | Meaning |
| --- | --- |
| Complete | Backend and frontend path exist and appear usable from repo files. |
| Partial | Some route/UI/data support exists, but feature is incomplete, stubbed, provider-dependent, or missing polish/tests. |
| Planned | Route/page placeholder or tracker mention exists, but no complete implementation was found. |
| Unknown | Mentioned by docs or UI but not enough implementation found in audited files. |

## Core Infrastructure

| Feature | Status | Completed | In progress/planned | Files involved | Dependencies | Risk |
| --- | --- | --- | --- | --- | --- | --- |
| Express app bootstrap | Complete | Middleware, route mounts, migrations, static serving, sockets, campaign loop. | Better 404 API handling. | `server.js` | Express, PostgreSQL, Socket.IO | Medium |
| PostgreSQL migration runner | Complete | Applies sorted SQL migrations with `schema_migrations`. Realigned and synced `schema.sql` files with migrations. | Add new migrations as product schema evolves. | `database/migrate.js`, `database/migrations/*` | `pg` | Medium |
| Query adapter | Complete | Converts `?` placeholders to PostgreSQL params. | More SQL compatibility tests. | `database/dbpromise.js` | PostgreSQL | Medium |
| Docker deployment | Complete | App + PostgreSQL compose, production build, healthcheck. | Persist `meta-media` if needed. | `Dockerfile`, `docker-compose.yml` | Docker, Node 20, Postgres 16 | Low |
| Frontend app shell | Complete | React routes, portal layouts, public site. Fixed contrast issues and button collisions in Sprint 1. | Keep refining custom components as product evolves. | `client/src/routes/AppRoutes.jsx`, `client/src/layouts/PortalLayout.jsx` | React, Router | Medium |
| Frontend tests | Partial | Jest/RTL configured; app tests exist. | Keep coverage updated for new workflows. | `client/jest.config.cjs`, `client/src/App.test.jsx` | Jest, RTL | Medium |
| Backend tests | Planned | None found. | Add route/unit tests. | Root `package.json` | TBD | High |
| AI docs system | Complete | `/docs` plus `CLAUDE.md` created. | Maintain after every successful change. | `docs/*`, `CLAUDE.md` | AI workflow discipline | Medium |

## Auth And Tenancy

| Feature | Status | Completed | In progress/planned | Files involved | Dependencies | Risk |
| --- | --- | --- | --- | --- | --- | --- |
| Admin auth | Complete | Login, route validator, and explicit token expiry enforced (7d/1h). | Add structured HTTP errors. | `routes/admin.js`, `middlewares/admin.js` | JWT, bcrypt | High |
| User auth | Complete | Signup/login/social login, frontend login/signup, explicit token expiry, recovery expiration, and logic fixes. | Harden social login. | `routes/user.js`, `client/src/pages/auth/*` | JWT, bcrypt, Meta/Google/Facebook configs | High |
| Agent auth | Complete | Login, active check, owner context, frontend dashboard, and explicit token expiry. | Tighten ownership checks on every chat/task action. | `routes/agent.js`, `middlewares/agent.js` | JWT, PostgreSQL | High |
| Role-gated frontend | Partial | Role tokens gate route branches. | Decode/validate role and expiry client-side if tokens gain expiry. | `client/src/shared/auth.jsx` | localStorage | Medium |
| Tenant data isolation | Complete | Enforced ownership verification checks across CRM Leads, lead activities/reminders, Phonebooks, and contact import APIs. | Add DB foreign keys and constraints. | `routes/*.js`, `database/migrations/*` | PostgreSQL | High |
| Plan enforcement | Partial | `checkPlan`, contact/note/tag checks. | Centralize plan schema and edge cases. | `middlewares/plan.js` | `user.plan` JSON | Medium |

## Admin Portal

| Feature | Status | Completed | In progress/planned | Files involved | Dependencies | Risk |
| --- | --- | --- | --- | --- | --- | --- |
| Dashboard | Complete | Metrics API and page with user plan distribution and alerts. | None. | `routes/admin.js`, `client/src/pages/admin/Dashboard.jsx` | PostgreSQL | Medium |
| Manage plans | Complete | CRUD API, pricing card grids, edit/create forms, and deletion warnings. | None. | `routes/admin.js`, `client/src/pages/admin/Plans.jsx` | PostgreSQL | Medium |
| Manage users | Complete | List/update/delete/plan/auto-login, and safer user deletion transaction. | None. | `routes/admin.js`, `client/src/pages/admin/Users.jsx` | PostgreSQL, JWT | High |
| Orders | Complete | Orders API and search/filter transaction log view. | None. | `routes/admin.js`, `client/src/pages/admin/Orders.jsx` | Billing providers | Medium |
| CMS settings | Complete | Edit forms for Terms and Privacy, custom pages table list, page creator form with file uploader, and deletion warnings. | None. | `routes/admin.js`, `routes/web.js`, `client/src/pages/admin/ManagePages.jsx` | File uploads, PostgreSQL | Medium |
| Payment gateways | Complete | Credential storage, provider flags, MercadoPago integration, and customized input labels dynamically per provider. | None. | `routes/admin.js`, `routes/user.js`, `client/src/pages/admin/PaymentGateways.jsx`, `client/src/pages/admin/Settings.jsx`, `client/src/pages/user/Billing.jsx` | Stripe, PayPal, Razorpay, Paystack, MercadoPago | High |
| SMTP | Complete | Get/update/test email recipient dispatch, troubleshooting instructions panel, and credentials form. | None. | `routes/admin.js`, `client/src/pages/admin/SmtpSettings.jsx` | SMTP provider | Medium |
| Translation/theme | Complete | Dynamic color pickers for branding theme, translation dictionary search grid with pagination, and add/delete actions. | None. | `routes/web.js`, `client/src/pages/admin/Settings.jsx` | File system | High |
| Front partners | Complete | Upload uploader block for partner brand logos, delete buttons with warnings, and display grid. | None. | `routes/admin.js`, `client/src/pages/admin/FrontPartner.jsx` | File uploads | Low |
| WA links data | Partial | Generated link table/routes exist. | Admin UI route is planned placeholder. | `routes/admin.js`, `routes/web.js`, `client/src/routes/AppRoutes.jsx` | PostgreSQL | Medium |
| Instagram config | Planned | Placeholder route exists. | Implement backend/provider logic. | `client/src/routes/AppRoutes.jsx` | Meta/Instagram API | Medium |
| Web notification/manual push | Planned | Placeholder routes exist. | Implement notification subsystem. | `client/src/routes/AppRoutes.jsx` | Push service TBD | Medium |
| WA embed login | Planned | Placeholder route exists. | Implement. | `client/src/routes/AppRoutes.jsx` | TBD | Medium |
| Telegram config | Planned | Placeholder route exists. | Implement. | `client/src/routes/AppRoutes.jsx` | Telegram API | Medium |

## User Portal

| Feature | Status | Completed | In progress/planned | Files involved | Dependencies | Risk |
| --- | --- | --- | --- | --- | --- | --- |
| Dashboard | Partial | Tenant metrics route/page. | Better charts and loading/error states. | `routes/user.js`, `client/src/pages/user/Dashboard.jsx` | PostgreSQL | Medium |
| Inbox | Complete | Chat list/conversation/send APIs, socket handlers, inline media rendering, and interactive tag/label management. | None. | `routes/inbox.js`, `socket.js`, `helper/socket/*`, `client/src/pages/user/Inbox.jsx` | Meta API, filesystem | High |
| Kanban | Complete | Chat status grouped view, ticket status change API, and interactive drag-and-drop. | Keep refining transitions/animations. | `routes/inbox.js`, `client/src/pages/user/Kanban.jsx` | PostgreSQL | Low |
| CRM Pipeline | Complete | Stage-grouped leads view, reminders & activity feeds, stage-shifting API, and interactive drag-and-drop. | None. | `routes/crm_leads.js`, `client/src/pages/user/CrmPipeline.jsx` | PostgreSQL | Low |
| Contacts/phonebook | Complete | Phonebook CRUD, Phonebook Rename API (POST /update), Contact CRUD, Contact Edit API (POST /update_contact), CSV import, delete warning confirmations, and pre-import CSV validation details. | None. | `routes/phonebook.js`, `client/src/pages/user/Contacts.jsx` | csv-parser | Medium |
| Meta WhatsApp link | Partial | Credential form, validation, key storage. | Embedded signup/OAuth not complete. | `routes/user.js`, `client/src/pages/user/Integrations.jsx` | Meta Graph API | High |
| WhatsApp QR | Complete | UI/routes/table exist. Added connection event listeners (`messages.upsert`/`update`) and message dispatch routing via active session. | None. | `routes/qr.js`, `helper/addon/qr/*`, `client/src/pages/user/Integrations.jsx` | Baileys | Low |
| Instagram link | Planned | Placeholder route/tab exists. | Implement provider auth and message ingest. | `client/src/pages/user/Integrations.jsx` | Instagram API | High |
| Automation flows | Partial | React Flow page, save/load/delete/activity APIs. | Advanced branching templates and runtime validation. | `routes/chatFlow.js`, `client/src/pages/user/AutomationFlows.jsx` | `@xyflow/react`, filesystem | High |
| WA chatbot | Partial | CRUD, selected/all chats, active status, diagnostics. | Full visual runtime parity and analytics. | `routes/chatbot.js`, `functions/chatbot.js`, `helper/chatbot/*`, `client/src/pages/user/ChatBot.jsx` | Meta API, flow JSON | High |
| Meta templates | Partial | Create/list/delete/upload media APIs and page. | Approval diagnostics and more validation. | `routes/user.js`, `client/src/pages/user/MetaTemplates.jsx` | Meta Graph API | High |
| Campaigns | Complete/partial | Create/list/status/delete/logs/dashboard, batch updates with queue locking (FOR UPDATE SKIP LOCKED), template cache Map, and Campaign Local Simulation mode (MOCK_META_DELIVERY). | Throttle pacing delay validation, and live keys production scaling. | `routes/broadcast.js`, `loops/*`, `client/src/pages/user/Campaigns.jsx` | Meta API, PostgreSQL | High |
| Billing | Partial | Plans/free trial/Stripe UI flow. | Complete provider SDK UX and reconciliation. | `routes/user.js`, `client/src/pages/user/Billing.jsx` | Stripe, PayPal, Razorpay, Paystack | High |
| API dashboard | Complete | API key generation, samples, and integrated real-time Webhook & API Analytics telemetry dashboard from database logs. | None. | `routes/apiv2.js`, `routes/user.js`, `client/src/pages/user/DeveloperApi.jsx` | JWT, Meta API | Medium |
| Webhook rules | Complete | Rule CRUD API, UI, rules execution engine, exponential backoff retry target POST dispatches with timeouts, persistent webhook logs query endpoint, and log viewer dashboard with interactive metrics. | None. | `routes/webhooks.js`, `client/src/pages/user/DeveloperApi.jsx`, `client/src/pages/user/WebhookLogs.jsx`, `helper/webhooks/engine.js` | PostgreSQL | Medium |
| Agent login management | Complete/partial | Agent creation/list and auto-login token. | Edit/delete polish and audits. | `routes/agent.js`, `routes/user.js`, `client/src/pages/user/AgentLogin.jsx` | JWT, bcrypt | Medium |
| Agent tasks | Complete/partial | Create/list/delete tenant tasks; agent can complete. | Better task states. | `routes/user.js`, `routes/agent.js`, `client/src/pages/user/AgentTask.jsx` | PostgreSQL | Medium |
| Chat widget | Partial | Create/list/delete, public widget render route, and input validation hardening. | Analytics/logo UX. | `routes/user.js`, `client/src/pages/user/ChatWidget.jsx` | File uploads | Medium |
| WhatsApp forms | Planned | Placeholder route exists. | Implement forms/iframe flow. | `client/src/routes/AppRoutes.jsx` | TBD | Medium |
| WhatsApp warmer | Planned | Placeholder route exists. | Implement. | `client/src/routes/AppRoutes.jsx` | WhatsApp provider risk | High |
| AI calls/call logs/setup | Planned | Placeholder routes exist. | Implement call provider logic. | `client/src/routes/AppRoutes.jsx` | Twilio or provider TBD | High |
| Web notifications | Planned | Placeholder route exists. | Implement push notifications. | `client/src/routes/AppRoutes.jsx` | Push service TBD | Medium |
| Telegram sessions | Planned | Placeholder route exists. | Implement Telegram sessions. | `client/src/routes/AppRoutes.jsx` | Telegram API | Medium |

## Agent Portal

| Feature | Status | Completed | In progress/planned | Files involved | Dependencies | Risk |
| --- | --- | --- | --- | --- | --- | --- |
| Agent dashboard | Complete | Loads identity, assigned chats, tasks, with status filters, formatting, and open chat link. | None. | `routes/agent.js`, `client/src/pages/agent/Dashboard.jsx` | PostgreSQL | Medium |
| Restricted inbox | Complete | Enforces owner/agent assignment, WebSocket updates, and query parameter chat auto-open. | None. | `routes/agent.js`, `middlewares/agent.js`, `helper/socket/index.js`, `client/src/pages/agent/Inbox.jsx` | Meta API | Low |
| Agent tasks | Complete | Agent tasks execution with client-side comment validation and read-only comment history. | None. | `routes/agent.js`, `client/src/pages/agent/Dashboard.jsx` | PostgreSQL | Medium |
