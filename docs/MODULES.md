# Modules

Last audited: 2026-06-15

## Module Map

| Module | Purpose | Entry points | Dependencies | Connected modules | Future improvements |
| --- | --- | --- | --- | --- | --- |
| App bootstrap | Start server, routes, migrations, sockets, loops. | `server.js` | Express, env, migrations, QR, campaign loop, socket | All backend modules | Add explicit API 404 before SPA fallback. |
| Configuration | Normalize env and feature flags. | `env.js` | `dotenv`, `crypto` | Server, DB, logger, integrations | Keep `.env.example` synced. |
| Database | Connect/query/migrate PostgreSQL. | `database/config.js`, `database/dbpromise.js`, `database/migrate.js` | `pg`, SQL migrations | All route modules | Add migration tests and schema reconciliation. |
| Auth | Validate admin/user/agent tokens. | `middlewares/user.js`, `admin.js`, `agent.js`, `plan.js` | JWT, DB, plan JSON | Routes, frontend auth | Migrate to unified middleware with tests. |
| Admin | SaaS control plane and CMS/settings. | `routes/admin.js`, `routes/web.js`, `client/src/pages/admin/*` | DB, file uploads, SMTP, payments | Public site, billing, users | Harden public mutating routes. |
| Public site | Landing, pricing, contact, portal links. | `client/src/pages/PublicSite.jsx`, `routes/web.js` | Plans, CMS, contact_form | Admin CMS | Complete dynamic CMS parity. |
| User workspace | Tenant dashboards/settings/billing/profile. | `routes/user.js`, `client/src/pages/user/*` | DB, providers, file upload | Admin plans, auth, integrations | Split large route file by domain. |
| Agent workspace | Agent accounts, assignments, chats, tasks. | `routes/agent.js`, `client/src/pages/agent/Dashboard.jsx` | DB, Meta send helpers | User workspace, inbox | Enforce assignment in every action. |
| Inbox | Chat list, conversation history, sends, webhooks. | `routes/inbox.js`, `helper/inbox/*`, `helper/socket/*`, `socket.js` | Meta API, files, DB, Socket.IO | Chatbot, agents, campaigns | Paginate and centralize message store. |
| Sockets | Realtime chat list/conversation updates. | `socket.js`, `helper/socket/index.js` | Socket.IO, JWT, DB | Inbox, frontend | Use rooms/adapters for scale. |
| Flow builder | Save/load visual automation flows. | `routes/chatFlow.js`, `client/src/pages/user/AutomationFlows.jsx` | DB, `flow-json`, React Flow | Chatbot | Add schema validation for nodes/edges. |
| Chatbot | Run flows for incoming messages. | `routes/chatbot.js`, `functions/chatbot.js`, `helper/chatbot/meta/*` | DB, flow JSON, Meta/QR send helpers | Inbox, flows, agents | Unify old/new chatbot paths. |
| Campaigns | Scheduled template broadcasts and analytics. | `routes/broadcast.js`, `loops/campaignLoop.js`, `loops/loopFunctions.js` | DB, Meta API, plan checks | Contacts, templates, webhooks | Queue/worker and retry strategy. |
| Contacts | Phonebooks, CSV import, contact CRUD. | `routes/phonebook.js`, `client/src/pages/user/Contacts.jsx` | DB, csv-parser | Campaigns, inbox | Dedupe and import validation. |
| Meta integrations | Store Cloud API keys and manage templates/profile. | `routes/user.js`, `functions/function.js`, `client/src/pages/user/Integrations.jsx`, `MetaTemplates.jsx` | Meta Graph API | Inbox, campaigns, chatbot | Embedded signup/OAuth. |
| QR integrations | WhatsApp Web/QR instance management. | `routes/qr.js`, `helper/addon/qr/*` | Baileys | Inbox, chatbot | Replace stubs with real implementation or remove feature. |
| Billing | Plan payment and subscription activation. | `routes/user.js`, `routes/admin.js`, `client/src/pages/user/Billing.jsx` | Stripe, Razorpay, PayPal, Paystack | Plans, orders, users | Provider webhooks/reconciliation. |
| API/webhooks | Tenant API keys and webhook automation rules. | `routes/apiv2.js`, `routes/webhooks.js`, `client/src/pages/user/DeveloperApi.jsx` | JWT, DB, Meta API | User workspace, inbox | Rule execution and logs. |
| Email | Password recovery and test SMTP. | `emails/returnEmails.js`, `routes/admin.js`, `routes/user.js` | nodemailer, SMTP table | Auth/admin/user | Token expiry cleanup. |
| Logging | Structured-ish logs and error files. | `utils/logger.js`, `middlewares/errorHandler.js` | File system | Server/routes | Request IDs and centralized logging. |
| Frontend shell | Portal routing/layout/auth. | `client/src/App.jsx`, `AppRoutes.jsx`, `PortalLayout.jsx`, `shared/auth.jsx` | React, Router | All pages | More robust token decoding/expiry. |

## Active Vs Legacy Notes

| Area | Active | Legacy/alternate |
| --- | --- | --- |
| Socket server | `socket.js` | `websocket.js` |
| Socket handlers | `helper/socket/*` | `helpers/ws/*` |
| Inbox helpers | `helper/inbox/*` | `helpers/inbox/*` |
| Auth middleware | `middlewares/user.js`, `admin.js`, `agent.js` | `middlewares/auth.js` |
| API helper frontend | `client/src/shared/api.js` | `client/src/utils/api.js` plus Zustand store |

Before deleting or refactoring any "legacy" file, verify imports with `rg`.
