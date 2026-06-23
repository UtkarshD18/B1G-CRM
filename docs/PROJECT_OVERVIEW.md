# Project Overview

Last audited: 2026-06-15

## Summary

B1G-CRM is a multi-tenant WhatsApp/omnichannel CRM SaaS. The repo contains one Express backend, one Vite React frontend, PostgreSQL migrations, Socket.IO realtime handling, and Docker deployment files.

## Product Model

| Portal | Route prefix | Primary user | Responsibilities |
| --- | --- | --- | --- |
| Public site | `/`, `/pricing`, `/signin`, `/login`, `/register` | Visitors | Marketing page, pricing, contact lead capture, portal selection. |
| Admin portal | `/admin/*` | SaaS operator | Plans, tenants, orders, CMS, payments, SMTP, site settings, social login, theme/translation settings. |
| User portal | `/user/*` | Tenant/customer | Inbox, contacts, campaigns, WhatsApp/Meta setup, automation flows, chatbot, agents, billing, API/webhooks, widgets. |
| Agent portal | `/agent/*` | Tenant staff | Assigned chats, tasks, ticket status updates. |

## Repository Shape

| Layer | Main files |
| --- | --- |
| Backend app | `server.js`, `env.js`, `routes/*.js`, `middlewares/*.js` |
| Database | `database/config.js`, `database/dbpromise.js`, `database/migrate.js`, `database/migrations/*.sql` |
| Realtime | `socket.js`, `helper/socket/*`, `helper/inbox/*` |
| Frontend | `client/src/App.jsx`, `client/src/routes/AppRoutes.jsx`, `client/src/pages/**/*`, `client/src/shared/*` |
| Deployment | `Dockerfile`, `docker-compose.yml`, `.env.example` |

## Existing Documentation

| File | Meaning |
| --- | --- |
| `README.md` | Project summary, setup, and high-level repo structure. |

## What Exists Today

| Capability | Current state |
| --- | --- |
| Multi-role auth | Admin, user, and agent login endpoints exist. Frontend role gates exist. |
| Tenant isolation | Most tenant data is keyed by `uid`; agents are keyed by `owner_uid` plus agent `uid`. |
| Plans | Stored as JSON on `user.plan`; enforced by `middlewares/plan.js`. |
| Inbox | Chat records are in PostgreSQL; message bodies are JSON files. Socket and REST paths exist. |
| Meta WhatsApp | Credential storage, template CRUD/list/delete, outbound sends, webhook ingest, campaign sends. |
| Flow builder | Saved flow metadata in `flow`; node/edge JSON on disk. |
| Chatbot | CRUD, selected/all chat targeting, flow handoff, diagnostic logs. |
| Campaigns | Scheduled campaign creation, logs, dashboard summary, recursive loop processor. |
| Contacts/phonebooks | Phonebook CRUD, CSV import, contact CRUD. |
| CMS/settings | Public web config, pages, FAQ, partners, testimonials, SMTP, social login. |
| Billing | Stripe, Razorpay, PayPal, Paystack route logic exists; real readiness depends on credentials and provider flows. |
| Docker | Production image and compose stack exist. |

## What Is Not Fully Ready

| Area | Reason |
| --- | --- |
| QR WhatsApp | Session functions are currently no-op stubs in `helper/addon/qr/index.js`. |
| Instagram/Telegram | Feature flags and placeholder routes/UI labels exist, but no complete implementation was found. |
| Webhook automation execution | Rule CRUD exists; execution engine/logs are not implemented in the inspected files. |
| Testing | Frontend tests exist. Backend tests are not configured; root `npm test` fails by design. |
| Database schema docs | Migrations are reliable; `database/schema.sql` is incomplete compared with migrations. |
| Auth consistency | `middlewares/auth.js` is a newer unified middleware but route modules still use legacy validators. |

## Source Of Truth

Use these for current facts:

1. Runtime route mounts: `server.js`
2. Active route contracts: `routes/*.js`
3. Active database schema: `database/migrations/*.sql`
4. Frontend routes: `client/src/routes/AppRoutes.jsx`
5. Active role auth: `middlewares/user.js`, `middlewares/admin.js`, `middlewares/agent.js`
6. Active socket server: `socket.js`
