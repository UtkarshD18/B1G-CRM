# Current Status

Last audited: 2026-06-25

## Implemented

| Area | Evidence |
| --- | --- |
| Express backend | `server.js` mounts all route modules, applies middleware, serves frontend, starts sockets and campaign loop. |
| PostgreSQL migrations | `database/migrate.js` and migrations `000` through `009`. |
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
| UI/UX Refinement (Sprint 1) | Solved white-on-beige text contrast issues and grid button collisions across all dashboards. |
| Runtime Functionality + Reference CRM Gap (Sprint 2) | Integrated real-time media rendering (images, videos, audio, documents) in user inbox, and resolved global color contrast overrides. |
| Reference CRM Parity Audit (Sprint 3) | Completed master parity audit reports, page reality classification, database/API audits, campaign blocker analysis, and top 50 parity improvements list. |
| Sprint 5 Execution | Added Campaign Local Simulation mode (bypassing Meta Graph API limits), Phonebook Rename API (`POST /update`), Contact Edit API (`POST /update_contact`), Webhook execution engine, target dispatches, and persistent webhook logs. |
| Admin Plan Edit config | Resolved endpoint routing collision under `/api/admin/edit_plan` and `client/src/pages/admin/Plans.jsx`. |
| Multi-Agent Reassignment | Implemented unique socket listener reassignments and resolved duplicate assignment row DB issues. |
| Sprint 11 Stabilization | Resolved nodemon reboot loops, populated seeder templates, added Contact & Phonebook edit forms, integrated Webhook Rules matcher engine, renamed Chat Widget to Click-to-Chat Launcher, and collapsed Visual Flow raw JSON textareas. |
| Sprint 12 Production Hardening | Removed password hashes from JWT payloads, enforced agent assignment check, and resolved presence updates IDOR vulnerabilities. |
| Sprint 13 QR & Widget Hardening | Activated real-time Baileys connection listeners ('messages.upsert', 'messages.update') and outbound sending routing via active session; hardened Chat Widget configuration input validations. |
| Sprint 13 Webhook Logs Execution | Implemented end-to-end Webhook Execution Logs. Added query endpoint and React log viewer dashboard view with filters and inspect drawers; fixed dev database seeder to upsert missing agent credentials on boot. |
| Sprint 13 JWT Security Hardening | Enforced explicit token expirations (7d via `env.JWT_EXPIRY`) across standard logins/auto-logins, enforced 1h expiry on password recovery tokens, and fixed password recovery token age validator comparison bounds. |
| Sprint 13 Campaign & Webhook optimizations | Replaced campaign sequential processing with batch updates (LIMIT 50) and parallel queue safety using FOR UPDATE SKIP LOCKED database locking; integrated map-based template cache in loops; wrapped loop runners in robust daemon restart try/catch blocks. Hardened webhook rules dispatcher with exponential retry backoff, timeouts, and auditing. |
| Sprint 13 Tenant Isolation Hardening | Hardened CRM Leads, reminders, activities, Phonebooks, and contact import routes against Insecure Direct Object References (IDORs). |
| Sprint 14 Unified Auth & Transactions | Consolidated role-specific authentication middlewares; implemented pool-bound transaction helper withTransaction in database/dbpromise.js; wrapped deletes and mutations across admin, broadcast, phonebook, chatFlow, agent, and crm_leads in transactions; created root-level automated backend tests. |
| Sprint 14 Kanban Drag-and-Drop Persistence | Implemented interactive HTML5 drag-and-drop persistence on the Chat Kanban board, synced directly to the change ticket status API endpoint. |
| Sprint 14 CRM Lead Pipeline Drag-and-Drop | Implemented interactive HTML5 drag-and-drop persistence on the CRM Lead Pipeline board, synced directly to the stage-shifting backend API endpoint. |
| Sprint 14 Release Hardening | Removed legacy duplicate helper tree helpers/ and dead websocket.js entrypoint; hardened client apiRequest JSON parsing to prevent fatal UI crashes. |
| Sprint 14 Payment Gateway Parity | Integrated MercadoPago credentials into database/APIs and customized form labels/input types dynamically per payment gateway provider (Stripe, PayPal, Razorpay, Paystack, MercadoPago, Offline). |
| Sprint 15 Audit & Parity Verification | Completed definitive Repository Reality Audit and Parity Verification against live reference CRM, verified all core CRM pages, role sessions, database persistence, and API schemas. |
| Sprint 16 Interactive Tag UI | Implemented high-fidelity label/tag management UI in User Inbox context sidebar, allowing managers to dynamically select predefined labels and type custom tags, integrated directly with `/api/user/push_tag` and `/api/user/del_tag` REST endpoints. |
| Sprint 17 Agent security hardening | Hardened Agent Portal backend endpoints and Socket.IO real-time channels against IDOR vulnerabilities, enforcing agent assignment checking on retrieval and mutating REST routes, task completion, and socket event emissions. |
| Sprint 18 Stripe Webhook Reconciliation & Page Verification Audit | Implemented `/api/user/stripe_webhook` to safely provision subscription plan entitlements, hardened Puppeteer page verification checks, and resolved dotenv database connection dependencies. |
| Sprint 19 Admin SMTP Settings & User Dashboard KPI Metrics | Added "Send Test Email" form to Admin SmtpSettings and expanded the User Dashboard with 2 additional KPI cards, 2 chart series, and a metrics Refresh button. |
| Sprint 20 Admin Completeness & Safeguards | Added warning confirmation dialogs to Admin plans, FAQs, testimonials, and contact submissions; implemented Add Custom Page creation form with featured image uploader, and custom logo uploader/preview in Site Settings. |
| Sprint 21 User Completeness & Safety | Added local Quick Text Templates CRUD management inside User Inbox sidebar. Enforced delete warning confirmation dialogs across all User Portal modules (Contacts, Meta Templates, QR instances, webhook rules, chat widgets, chatbots, campaigns, flows). Enhanced CSV import interface with pre-import validation details and expected formatting instructions. Integrated a real-time Webhook & API Analytics telemetry dashboard in the Developer API page. |


## Partially Implemented

| Area | Gap |
| --- | --- |
| Auth/session model | Works; password hashes removed in Sprint 12. Enforced explicit JWT expiry on active login routes and recovery links in Sprint 13. |
| Tenant isolation | Works; query-based by `uid`. Enforced explicit ownership validations on CRM Leads and Phonebook Contacts in Sprint 13. |
| Inbox realtime | [RESOLVED] Removed legacy websocket/helper paths; active socket.js logic handles live stream updates. |
| QR WhatsApp | Active; socket listeners wired to message ingress loop and sending functional, though connection state dashboard could be further polished. |
| Billing | Multiple provider routes exist, but production readiness depends on provider credentials and callback hardening. |
| CMS/translation/theme | APIs write runtime files; this can be fragile in immutable/container deployments. |
| API/webhooks | API key send routes, webhook rule CRUD, execution engine rules evaluation, target post dispatches, and logs are implemented; usage analytics dashboard is incomplete. |
| Testing | Automated frontend Jest tests and comprehensive backend integration + auth verification test suite exist. |

## Missing Or Planned

| Area | Current signal |
| --- | --- |
| Instagram connection and DM/comment bots | Placeholder routes/UI labels only. |
| Telegram sessions/config | Placeholder route only. |
| Web notification/manual push | Placeholder routes only. |
| WhatsApp forms | Placeholder route only. |
| WhatsApp warmer | Placeholder route only. |
| AI calls and WA calls | Placeholder routes only. |

## Technical Debt

| Debt | Impact |
| --- | --- |
| `database/schema.sql` synchronized with migrations | Completed (synced chatbot_log and webhook_rules; verified migrations 000-009). |
| Mixed `created_at` and `createdAt` columns | Easy to write invalid queries. |
| No explicit foreign keys | Data integrity relies on route code. |
| Duplicate helper/socket/auth implementations | [RESOLVED] Removed legacy helper/ vs helpers/ duplicate directory trees and consolidated auth middlewares in Sprint 14. |
| Broad `functions/function.js` utility file | Hard to reason about responsibilities and side effects. |
| Runtime JSON files for core state | Backups/deployments must include filesystem state. |
| Public mutating install/update routes | Production security concern. |

## Architecture Debt

| Debt | Suggested direction |
| --- | --- |
| Active validators duplicate logic | Move routes to unified `middlewares/auth.js` only after compatibility review. |
| Plan data copied as JSON into users | Consider normalized plan assignment/history model. |
| QR add-on stubbed | [RESOLVED] Real QR session helper implemented and integrated into the message/inbox routing flows. |
| Socket state in memory | Horizontal scaling needs adapter/shared state. |
| Campaign loop recursive in app process | [RESOLVED] Refactored campaign loop to run as a robust while(true) daemon that catches errors, preventing recursive stack overflow and thread crashes. |

## Performance Concerns

| Concern | Why |
| --- | --- |
| Chat lists and campaign logs use broad selects | Larger tenants may need pagination/index review. |
| Conversation JSON files are read/written whole | Large chats may become slow and conflict-prone. |
| Campaign loop processes one pending log per campaign per pass | [RESOLVED] Campaign loop processes messages in batches of 50 using database row-level locking (FOR UPDATE SKIP LOCKED) to allow parallel safely scaled campaign loops. |
| Socket connection scans iterate over all sockets | Multi-tenant scale may need rooms/adapters. |

## Security Concerns

| Concern | Why |
| --- | --- |
| JWT payload includes password hash | [RESOLVED] Removed bcrypt password hashes from token payloads. |
| Login tokens have no explicit expiry in active routes | [RESOLVED] Enforced explicit token expiry options (7d / 1h) in Sprint 13. |
| Some routes mutate files without auth or only body password | [RESOLVED] `/api/web/install_app` and `/api/web/update_app` are gated by admin password verification. |
| No foreign keys | Orphaned or cross-tenant data errors are easier. |
| File uploads write under public dirs | Validate file type/size/path carefully. |
| Secrets stored in DB/plain env | Payment, SMTP, Meta tokens require operational protection. |

## Deployment Readiness

| Area | Status |
| --- | --- |
| Local Docker | **Healthy & Verified** (resolved container network desync and EAI_AGAIN resolution loops). |
| Production Docker | Mostly ready, but review secret management, QR support, public update routes, media persistence, and scaling. |
| DB migrations | **Verified & Completed** (migrations 000-009 tested and run cleanly against fresh and existing volumes). |
| Frontend build | Docker builds `client/dist`. |
| Observability | Basic logger and healthcheck only. |

## Testing Status

| Command | Status |
| --- | --- |
| `npm test` | Fully functional automated suite (passes 100%). Runs database consistency, backend auth/transactions, and cross-module integration tests. |
| `cd client; npm test` | Jest configured; app tests exist. |
| Backend route tests | Implemented in `scratch/verify-backend-auth.js` and `cross_module_integration_audit.js`. |
| Migration tests | Database consistency and migration audits pass. |
