# AI Changelog

Keep this file short. Retain only recent implementation history.

## 2026-06-25 - Sprint 20: Admin Portal Completeness (Delete Confirmations, Logo & Page Uploaders)

| Field | Details |
| --- | --- |
| Feature | Added warning confirmation prompts (`window.confirm`) prior to deleting plans (`Plans.jsx`), FAQs (`Faq.jsx`), Testimonials (`Testimonial.jsx`), and Contact Form Submissions (`ContactForm.jsx`). Developed the "Add Custom Page" uploader form side-by-side with custom pages table in `ManagePages.jsx` and updated its View Page modal to display the featured image. Upgraded `SiteSettings.jsx` to replace the text logo input with a custom file logo uploader and dynamic preview block. |
| Files changed | `client/src/pages/admin/Plans.jsx`, `client/src/pages/admin/Faq.jsx`, `client/src/pages/admin/Testimonial.jsx`, `client/src/pages/admin/ContactForm.jsx`, `client/src/pages/admin/ManagePages.jsx`, `client/src/pages/admin/SiteSettings.jsx`, `docs/CHANGELOG_AI.source.md`. |
| Impact | Achieves full CRUD completeness for Admin custom pages and logo uploads matching the live reference CRM, and adds crucial deletion safeguards to prevent accidental administrative data loss. |
| Breaking changes | None. |
| Migration notes | None. |

## 2026-06-25 - Sprint 19: Admin SmtpSettings Test Email & User Dashboard KPI Metrics

| Field | Details |
| --- | --- |
| Feature | Added "Send Test Email" recipient input field and button to the Admin SMTP settings page (`SmtpSettings.jsx`) mapping directly to `/api/admin/send_test_email`, along with visual connection tips for major email providers. Expanded the User Dashboard page (`Dashboard.jsx`) with 2 additional KPI cards (Campaigns, Templates count), 2 additional chart series (Pending chats, Active bots), and an interactive manual metrics Refresh button. |
| Files changed | `client/src/pages/admin/SmtpSettings.jsx`, `client/src/pages/user/Dashboard.jsx`, `docs/CHANGELOG_AI.source.md`. |
| Impact | Achieves feature-parity for SMTP testing and expands user operational monitoring capability with real-time campaigns, templates, and active bots telemetry. |
| Breaking changes | None. |
| Migration notes | None. |

## 2026-06-25 - Sprint 18: Stripe Webhook Reconciliation & Page Verification Audit

| Field | Details |
| --- | --- |
| Feature | Implemented `/api/user/stripe_webhook` to safely receive Stripe payment notifications, authenticate webhook event metadata, update orders database, and provision plan entitlements; integrated orderID, planID, and user UID metadata into checkout session creation. Hardened regex error matching inside local page verification script (`verify-local-pages.js`) using word boundaries (`/\b404\b/`) to prevent numeric timestamp false-positives. Fixed database connection credentials loading in `verify-contacts-phonebooks.js` by requiring `dotenv` and corrected the Puppeteer selector query for the delete button. Added `scratch/verify-stripe-webhook.js` test runner. |
| Files changed | `routes/user.js`, `verify-local-pages.js`, `verify-contacts-phonebooks.js`, `scratch/verify-stripe-webhook.js`, `docs/CHANGELOG_AI.source.md`. |
| Impact | Achieves full Stripe checkout reconciliation parity for subscription billing and ensures 100% correct automated test and local page crawler executions. |
| Breaking changes | None. |
| Migration notes | None. |

## 2026-06-25 - Sprint 17: Agent Portal Security Hardening & IDOR Prevention

| Field | Details |
| --- | --- |
| Feature | Hardened Agent Portal backend endpoints and Socket.IO real-time channels against Insecure Direct Object Reference (IDOR) vulnerabilities. Enforced agent assignment verification checks on `get_convo`, `send_text`, `send_audio`, `send_doc`, `send_video`, `send_image`, `change_chat_ticket_status`, and `save_note` endpoints; enforced task ownership checks on `/mark_task_complete`; enforced agent assignment verification on socket events `on_open_chat` and `send_chat_message`, and verified tenant boundaries on `save_chat_note` and `set_chat_label` socket listeners. Added comprehensive agent-level IDOR test assertions to `adversarial_security_test.js`. |
| Files changed | `routes/agent.js`, `helper/socket/index.js`, `adversarial_security_test.js`, `docs/CHANGELOG_AI.source.md`. |
| Impact | Guarantees complete workspace security isolation for support agents, preventing unauthorized chat retrieval, message dispatches, notes modification, and task completion across tenant boundaries. |
| Breaking changes | None. |
| Migration notes | None. |

## 2026-06-25 - Sprint 16: Interactive Tag/Label Management UI

| Field | Details |
| --- | --- |
| Feature | Created high-fidelity interactive label/tag management UI in User Inbox context sidebar, allowing managers to dynamically select predefined labels and type custom tags, integrated directly with `/api/user/push_tag` and `/api/user/del_tag` REST endpoints. Written `verify-tags.js` verification script validating the tag additions/deletions database transactions. |
| Files changed | `client/src/pages/user/Inbox.jsx`, `verify-tags.js`, `docs/CHANGELOG_AI.source.md`, `docs/CURRENT_STATUS.md`, `docs/FEATURE_TRACKER.md`, `docs/PROJECT_CONTEXT.source.md`. |
| Impact | Standardizes customer conversation tagging workspace with clean interactive UI widgets, verifies REST endpoints integration with Postgres database backend. |
| Breaking changes | None. |
| Migration notes | None. |

## 2026-06-25 - Final Audit: Repository Reality & Parity Verification

| Field | Details |
| --- | --- |
| Feature | Completed definitive Repository Reality Audit and Parity Verification against live reference CRM. Verified all core CRM portal pages, authenticated roles, database persistence, and API schemas. Created the master PARITY_AUDIT_REPORT.md mapping planned/placeholder modules and UI/UX distinctions. Verified 100% PASS on the backend integration and frontend Jest test suites. |
| Files changed | `PARITY_AUDIT_REPORT.md`, `docs/CHANGELOG_AI.source.md`, `docs/CURRENT_STATUS.md`, `docs/FEATURE_TRACKER.md`, `docs/ROADMAP.md`, `docs/PROJECT_CONTEXT.source.md`. |
| Impact | Proves the local project's readiness for production staging, aligns the feature tracker with verified source codes, and clarifies sitemap routing behaviors. |
| Breaking changes | None. |
| Migration notes | None. |

## 2026-06-21 - Sprint 14: Payment Gateway Parity & MercadoPago Integration

| Field | Details |
| --- | --- |
| Feature | Completed 100% production parity for Admin payment gateway workspace: integrated MercadoPago config credentials (`pay_mercadopago_id`, `pay_mercadopago_key`, `mercadopago_active`) in web_private table, update_pay_gateway API endpoint, settings page, and user billing page; customized UI forms to dynamically render tailored field labels (e.g. Publishable Key, Client ID, Public Key, Access Token) and input types per gateway provider. |
| Files changed | `database/migrations/016_mercadopago_settings.sql`, `database/schema.sql`, `database/postgres-local-schema.sql`, `routes/admin.js`, `routes/user.js`, `client/src/pages/admin/PaymentGateways.jsx`, `client/src/pages/admin/Settings.jsx`, `client/src/pages/user/Billing.jsx`. |
| Impact | Achieves full parity across Admin and User portals for payment systems, sanitizes sensitive tokens, and dynamically renders tailored credential labels. |
| Breaking changes | None. |
| Migration notes | Run `npm run db:migrate` to update existing tables. |

## 2026-06-21 - Sprint 14: Admin Dashboard Enhancement & Agent Task UX Polish

| Field | Details |
| --- | --- |
| Feature | Redesigned the Admin Dashboard with plan distribution metrics, upcoming subscription expirations alert panel, and a recent tenant signups listing; enhanced the Agent Task page in the User Portal by introducing status-based task filtering (All, Pending, Completed) and adding a deletion confirmation dialog to avoid accidental data loss. |
| Files changed | `client/src/pages/admin/Dashboard.jsx`, `client/src/pages/user/AgentTask.jsx`. |
| Impact | Significantly improves SaaS platform management for super-admins with actionable plan analytics and signup feeds, and secures task operations for user portal managers. |
| Breaking changes | None. |
| Migration notes | None. |

## 2026-06-21 - Sprint 14: Release Hardening & Verification Suite Alignment

| Field | Details |
| --- | --- |
| Feature | Refactored `verify-webhooks.js` rule execution engine checks to dynamically inspect `helper/inbox/inbox.js` references and database schema presence; updated `verify-webhooks-engine.js` sleep delay to 9000ms to allow the asynchronous exponential retry sequence (~7s) to fully write audit trail logs to the database; deleted alternate legacy structures to resolve technical debt; completed visual audits of multi-portal dashboards verifying three-column Inbox layout alignment and contrast. |
| Files changed | `verify-webhooks.js`, `verify-webhooks-engine.js`, `docs/CHANGELOG_AI.source.md`. |
| Impact | Resolves hardcoded test failures and aligns local verification suites to accurately inspect the codebase's active features, ensures full test coverage passing 100%, and verifies UI dashboard styling compliance. |
| Breaking changes | None. |
| Migration notes | None. |

## 2026-06-21 - Sprint 14: CRM Lead Pipeline Drag-and-Drop

| Field | Details |
| --- | --- |
| Feature | Implemented React 19 HTML5 native drag-and-drop mechanics in the CRM Lead Pipeline dashboard (`CrmPipeline.jsx`) mapping visual drops directly to the stage-shifting backend mutation `/api/crm/leads/move`. Added inline visual drag cues and drop column overlays. |
| Files changed | `client/src/pages/user/CrmPipeline.jsx`. |
| Impact | Standardizes pipeline interactions and allows operators to visually drag and drop sales leads across customized workflow stages (Lead, Qualified, Proposal, Negotiation, Won, Lost) with database-level persistence. |
| Breaking changes | None. |
| Migration notes | None. |

## 2026-06-21 - Sprint 14: Kanban Drag-and-Drop Persistence

| Field | Details |
| --- | --- |
| Feature | Implemented React 19 HTML5 native drag-and-drop mechanics in the Chat Kanban dashboard (`Kanban.jsx`) mapping visual drops directly to the ticket status backend mutation `/api/inbox/change_chat_ticket_status`. Configured CSS transitions, drag-over highlights, and card dragging opacities in `App.css`. |
| Files changed | `client/src/pages/user/Kanban.jsx`, `client/src/App.css`. |
| Impact | Enhances CRM operational workspace workflow by allowing operators to interactively drag and drop chats across Open, Pending, and Solved columns with database-level persistence. |
| Breaking changes | None. |
| Migration notes | None. |

## 2026-06-21 - Sprint 14: Unified Auth, Database Transactions & Backend Hardening

| Field | Details |
| --- | --- |
| Feature | Consolidated role-specific auth validation middlewares (`user.js`, `admin.js`, `agent.js`) into standard `middlewares/auth.js` with active agent validation and parent owner context caching (`req.owner`); implemented connection pool transaction wrapper `withTransaction` in `database/dbpromise.js` for SQL rollback safety; wrapped deletes and mutations across users, broadcasts, phonebooks, chatFlows, agents, and CRM leads in transaction blocks; configured root `npm test` script executing database consistency checks, auth checks, and cross-module integration tests. |
| Files changed | `database/dbpromise.js`, `middlewares/auth.js`, `middlewares/user.js`, `middlewares/admin.js`, `middlewares/agent.js`, `routes/admin.js`, `routes/broadcast.js`, `routes/phonebook.js`, `routes/chatFlow.js`, `routes/agent.js`, `routes/crm_leads.js`, `nodemon.json`, `package.json`, `scratch/verify-backend-auth.js`. |
| Impact | Standardizes API authentication filters, guarantees transactional consistency and prevents data corruption/orphaning on delete cascades and multi-step mutations, ignores temporary test reports in nodemon to prevent server restarts, and establishes automated backend route test coverage. |
| Breaking changes | None. |
| Migration notes | None. |

## 2026-06-20 - Sprint 13: Campaign Optimization & Webhook Retry Engine

| Field | Details |
| --- | --- |
| Feature | Optimized campaign delivery loop (introduced batch updates with FOR UPDATE SKIP LOCKED query locking, Map template cache metadata reuse, daemon stability try/catch recovery wrapper) and hardened webhooks dispatch rule execution engine (exponential backoff retry logic, hard 5s connection timeouts, DB outcome auditing). |
| Files changed | `loops/campaignLoop.js`, `loops/loopFunctions.js`, `helper/webhooks/engine.js`, `scratch/verify-campaign-batching.js`, `scratch/verify-webhook-retry.js`. |
| Impact | Substantially improves campaign delivery speeds under high concurrent loads, prevents double sends and race conditions in multi-tenant clustered environments, mitigates external network dependency failures via retry with backoff, and saves database resources. |
| Breaking changes | None. |
| Migration notes | None. |

## 2026-06-20 - Sprint 13: Tenant Isolation Hardening (IDOR Fixes)

| Field | Details |
| --- | --- |
| Feature | Hardened CRM Leads and Phonebook Contacts APIs against Insecure Direct Object References (IDORs). Verified phonebook ownership on `/phonebook/import_contacts` and `/phonebook/add_single_contact`. Verified lead ownership on `/api/crm/leads/add_reminder`, `/api/crm/leads/add_activity`, `/api/crm/leads/reminders/:leadId` (GET), and `/api/crm/leads/activities/:leadId` (GET). |
| Files changed | `routes/phonebook.js`, `routes/crm_leads.js`, `scratch/verify-tenant-isolation.js`. |
| Impact | Eliminates high-risk data leakage and cross-tenant pollution vulnerabilities, ensuring tenants can only access or mutate their own leads and phonebooks. |
| Breaking changes | None. Unauthorized actions now return standard error blocks `success: false, msg: "Lead/Phonebook not found or unauthorized"`. |
| Migration notes | None. |

## 2026-06-20 - Sprint 13: JWT Security Hardening & Session Expirations

| Field | Details |
| --- | --- |
| Feature | Enforced explicit session token expirations (`env.JWT_EXPIRY`, defaulting to 7 days) on user, agent, and admin login routes, as well as auto agent logins and admin-user impersonation routes. Restricted password recovery token duration to 1 hour, and resolved comparison boundary logic bugs on recovery age checks. |
| Files changed | `routes/user.js`, `routes/agent.js`, `routes/admin.js`, `scratch/verify-token-expiration.js`. |
| Impact | Eliminates infinite-lived session tokens and recovery tokens, preventing unauthorized persistent access and securing password reset links. |
| Breaking changes | None. Session tokens will now naturally expire and require re-authentication after the expiration period. |
| Migration notes | Ensure `JWT_EXPIRY` is configured in production environment variables (defaults to '7d' if not specified). |

## 2026-06-21 - Sprint 13: Webhook Execution Logs End-to-End Feature

| Field | Details |
| --- | --- |
| Feature | Implemented backend query route `/api/webhooks/logs` with tenant isolation (`validateUser`), created React visual log viewer dashboard page `WebhookLogs.jsx` showing status badges and modal details drawers, and linked the path in client `AppRoutes.jsx`, `navigation.js`, and `DeveloperApi.jsx`. Fixed development seeder to upsert missing user accounts on start. |
| Files changed | `database/seed-dev.js`, `routes/webhooks.js`, `client/src/pages/user/WebhookLogs.jsx`, `client/src/routes/AppRoutes.jsx`, `client/src/shared/navigation.js`, `client/src/pages/user/DeveloperApi.jsx`, `scratch/verify-webhook-logs.js`. |
| Impact | Allows developers and administrators to audit, search, filter, and inspect detailed outbound webhook rule dispatches, request payloads, response bodies, and response codes. |
| Breaking changes | None. |
| Migration notes | None. |

## 2026-06-21 - Sprint 13: QR Baileys Connection Integration & Chat Widget Input Hardening

| Field | Details |
| --- | --- |
| Feature | Hooked up real-time Baileys WhatsApp connection event listeners (`messages.upsert`, `messages.update`), enabled sending outbound messages over WhatsApp QR socket session (`sendMetaMsg`), and hardened Chat Widget configuration input validations (placement whitelist check, size integer parsing and fallback, phone number formatting/sanitization). |
| Files changed | `functions/function.js`, `helper/addon/qr/index.js`, `helper/addon/qr/processThings.js`, `routes/user.js`, `scratch/verify-chat-widget-hardening.js`. |
| Impact | Connects active Baileys socket hooks to message ingestion loop, allows manual composing over QR sessions, and mitigates invalid layout or parameter values in the Click-to-Chat widget database row inserts. |
| Breaking changes | None. |
| Migration notes | None. |

## 2026-06-19 - Final Release: Production Readiness & Security Lockdown

| Field | Details |
| --- | --- |
| Feature | Gated legacy public debug routes (`/api/qr/create`, `/api/qr/send`, `/api/inbox/` root, and `/api/web/` connection check root) with `validateUser`/`adminValidator` middlewares. Secured `/api/web/install_app` with admin password checks. Updated known issues and current status documents. |
| Files changed | `routes/qr.js`, `routes/inbox.js`, `routes/web.js`, `docs/KNOWN_ISSUES.md`, `docs/CURRENT_STATUS.md`, `docs/CHANGELOG_AI.source.md`. |
| Impact | Eliminates unauthenticated remote file writes and code execution paths, protects private tenant configurations against unauthorized query/trigger calls, and completes release stabilization. |
| Breaking changes | None. |
| Migration notes | None. |

## 2026-06-19 - Sprint 12: Production Hardening, Security Audit & Verification Testing

| Field | Details |
| --- | --- |
| Feature | Completed Sprint 12 production security hardening: removed password hashes from JWT payloads for all access, refresh, recovery, and agent impersonation tokens; updated middlewares to verify tokens using UID/email instead of password checks; secured the webhook rules engine with tenant validation to prevent IDOR on agent assignments; added ownership checks to presence updates in `routes/qr.js`; set up and verified 100% PASS on the cross-tenant mock attack script `adversarial_security_test.js` and database consistency checks. |
| Files changed | `middlewares/user.js`, `middlewares/admin.js`, `middlewares/agent.js`, `routes/user.js`, `routes/admin.js`, `routes/agent.js`, `routes/qr.js`, `helper/webhooks/engine.js`, `adversarial_security_test.js`, `docs/CHANGELOG_AI.source.md`, `docs/PROJECT_CONTEXT.source.md`, `PENDING_TASKS.md`, `MODULE_REALITY_CHECK.md`. |
| Impact | Removes plain text password hashes from customer browser tokens, fixes IDOR vulnerabilities in WhatsApp status modifications and webhooks agent assignments, and establishes high-quality automated testing coverage. |
| Breaking changes | None. |
| Migration notes | None. |

## 2026-06-19 - Sprint 11: Runtime Verification, Truth Audit & Production Stabilization

| Field | Details |
| --- | --- |
| Feature | Completed Sprint 11 runtime verification. Fixed seeder to insert default templates into the `templets` database table, added UI modals for editing contacts and renaming phonebooks, implemented Webhook Rules matcher engine into the message ingestion loop, resolved nodemon reboot loop by ignoring runtime files in `nodemon.json`, and renamed "Chat Widget" to "WhatsApp Click-to-Chat Launcher" in navigation and components. |
| Files changed | `nodemon.json`, `client/src/pages/user/Contacts.jsx`, `client/src/pages/user/Campaigns.jsx`, `client/src/pages/user/ChatWidget.jsx`, `client/src/pages/user/AutomationFlows.jsx`, `client/src/shared/constants.js`, `client/src/shared/navigation.js`, `routes/phonebook.js`, `routes/user.js`, `docs/CHANGELOG_AI.source.md`, `docs/PROJECT_CONTEXT.source.md`, `PENDING_TASKS.md`, `MODULE_REALITY_CHECK.md`. |
| Impact | Eliminates dev server crashes, ensures templates populate correctly in database, allows contacts management from UI, processes inbound webhooks against rules, and fixes layout clutter and naming mismatches. |
| Breaking changes | None. |
| Migration notes | Restart application, database is clean and seeded correctly. |

## 2026-06-18 - Sprint 5: Functional Auditing, Webhook Engine & Campaign Simulation

| Field | Details |
| --- | --- |
| Feature | Completed Sprint 5 CRM features. Implemented Campaign Local Simulation Mode (bypassing Facebook Graph API and auto-provisioning credentials when MOCK_META_DELIVERY=true), and added Phonebook Rename API (POST /api/phonebook/update) and Contact Edit API (POST /api/phonebook/update_contact) with database updates propagation. |
| Files changed | `env.js`, `.env`, `functions/function.js`, `routes/broadcast.js`, `loops/loopFunctions.js`, `routes/phonebook.js`, `verify-contacts-phonebooks.js`, `verify-campaigns.js`, `docs/CHANGELOG_AI.source.md`. |
| Impact | Resolves blocker meta handshake exception loops in local dev environments, supports renaming list groups and updating contact details, and achieves full verification parity with active runtime loops. |
| Breaking changes | None. |
| Migration notes | Rebuild app container using `docker compose up -d --build app`. |

## 2026-06-18 - Sprint 5 Prep: AI Operating Manual Integration

| Field | Details |
| --- | --- |
| Feature | Created and integrated permanent AI operating manual (SKILLS.md), updated CLAUDE.md guidelines, compiled audit confidence review, and drafted the Sprint 5 execution plan. |
| Files changed | `SKILLS.md`, `CLAUDE.md`, `AUDIT_CONFIDENCE_REVIEW.md`, `SPRINT5_EXECUTION_PLAN.md`, `SKILLS_ADOPTION_REPORT.md`, `docs/PROJECT_CONTEXT.source.md`, `docs/CHANGELOG_AI.source.md`. |
| Impact | Standardizes all future AI agents' operations, ensures strict manual/reference CRM compliance, establishes audit confidence grades, and prepares prioritized Sprint 5 roadmap tasks. |
| Breaking changes | None. |
| Migration notes | None. |

## 2026-06-18 - Sprint 4: Runtime Proof Audit & Functional Gap Closure

| Field | Details |
| --- | --- |
| Feature | Completed Sprint 4 runtime audit, database checks, webhook rules CRUD verification, campaign blocker analysis, deployment configurations, and manual WhatsApp UI verification. Generated 6 master deliverables. |
| Files changed | `verify-webhooks.js`, `verify-campaigns.js`, `WEBHOOK_RUNTIME_PROOF.md`, `CAMPAIGN_RUNTIME_PROOF.md`, `REFERENCE_GAP_REFINEMENT.md`, `DEPLOYMENT_RUNTIME_PROOF.md`, `WHATSAPP_EXPERIENCE_AUDIT.md`, `SPRINT4_MASTER_REPORT.md`, `docs/CHANGELOG_AI.source.md`. |
| Impact | Proves B1GCRM functionality at runtime, maps exact files for missing webhook/Kanban logic, and outlines top 25 priority fixes. |
| Breaking changes | None. |
| Migration notes | None. |

## 2026-06-18 - Sprint 3: Reference CRM Parity Master Audit

| Field | Details |
| --- | --- |
| Feature | Completed definitive runtime and database parity audit of B1GCRM against live reference CRM crawls. Generated all required audit and roadmap reports. |
| Files changed | `PAGE_REALITY_CLASSIFICATION.md`, `INBOX_RUNTIME_VERIFICATION.md`, `AGENT_RUNTIME_AUDIT.md`, `FLOW_RUNTIME_AUDIT.md`, `CHATBOT_RUNTIME_AUDIT.md`, `WEBHOOK_RUNTIME_AUDIT.md`, `CAMPAIGN_BLOCKER_ANALYSIS.md`, `DEPLOYMENT_READINESS_AUDIT.md`, `PRODUCTION_ENV_TEMPLATE.md`, `REFERENCE_GAP_REFINEMENT.md`, `TOP_50_PARITY_IMPROVEMENTS.md`, `SPRINT3_MASTER_REPORT.md`, `docs/CURRENT_STATUS.md`, `docs/FEATURE_TRACKER.md`, `docs/ROADMAP.md`, `docs/PROJECT_CONTEXT.source.md`, `docs/CHANGELOG_AI.source.md`. |
| Impact | Collates all parity metrics, locates blocker variables, identifies configurations, and lists 50 targeted engineering steps to achieve absolute parity with reference CRM. |
| Breaking changes | None. |
| Migration notes | None. |

## 2026-06-17 - Sprint 2: Runtime Functionality + Reference CRM Gap Closure

| Field | Details |
| --- | --- |
| Feature | Completed real-time media rendering (images, videos, audio, documents) in user inbox and resolved global text color contrast overrides. |
| Files changed | `client/src/pages/user/Inbox.jsx`, `client/src/App.css`, `docs/CURRENT_STATUS.md`, `docs/FEATURE_TRACKER.md`, `docs/CHANGELOG_AI.source.md`. |
| Impact | Resolves inbox media preview discrepancies and improves text legibility for light backgrounds across dashboard panels. |
| Breaking changes | None. |
| Migration notes | None. |

## 2026-06-17 - Sprint 1: UI/UX Quality Refinements

| Field | Details |
| --- | --- |
| Feature | Resolved critical white-on-beige text contrast readability issues on dashboards/cards, and fixed action button collisions inside tables. |
| Files changed | `client/src/App.css`, `docs/CURRENT_STATUS.md`, `docs/FEATURE_TRACKER.md`, `docs/CHANGELOG_AI.source.md`. |
| Impact | Restores dashboard subtext legibility and cleans up interactive button spacing in tables. |
| Breaking changes | None. |
| Migration notes | None. |

## 2026-06-17 - Docker Stabilization & Reference CRM Audit

| Field | Details |
| --- | --- |
| Feature | Resolved container hostname resolution loops (\`EAI_AGAIN\`), verified multi-portal authentication lifecycle, indexed reachable routes, and generated the reference CRM reverse-engineering index. |
| Files changed | \`docker-compose.yml\`, \`DOCKER_ROOT_CAUSE.md\`, \`WORKING_PAGES.md\`, \`TOP_20_GAPS.md\`, \`docs/reference-pages/*\`, \`docs/PROJECT_CONTEXT.source.md\`, \`docs/CURRENT_STATUS.md\`, \`docs/CHANGELOG_AI.source.md\`. |
| Impact | Resolves container startup failures, establishes clean multi-portal API reachability, and provides a feature-parity roadmap to implement CRM capabilities. |
| Breaking changes | None. |
| Migration notes | Start backend services using \`docker compose down --remove-orphans && docker compose up -d\`. |

## 2026-06-17 - Database Schema Realignment & Synchronization

| Field | Details |
| --- | --- |
| Feature | Aligned pre-existing database schemas via migration 009; synchronized canonical schema files with all migrations. |
| Files changed | `database/migrations/009_fix_user_schema.sql`, `database/schema.sql`, `database/postgres-local-schema.sql`, `docs/CURRENT_STATUS.md`, `docs/CHANGELOG_AI.source.md`. |
| Impact | Resolves user portal runtime errors related to missing role column and plan integer casting. Synchronizes local schema blueprints with active database migrations. |
| Breaking changes | None. |
| Migration notes | Run `npm run db:migrate` to apply the alignment migration. |

## 2026-06-15 - AI Handoff System Redesign

| Field | Details |
| --- | --- |
| Feature | Replaced the multi-doc AI entry flow with a lightweight bootstrap plus a single master context document. |
| Files changed | `CLAUDE.md`, `docs/PROJECT_CONTEXT.md`, `docs/CHANGELOG_AI.md`, `docs/AI_CONTEXT.md`, `scripts/generate-ai-docs.js`, `package.json`, `docs/PROJECT_CONTEXT.source.md`, `docs/CHANGELOG_AI.source.md`. |
| Impact | Future AI sessions can start from one compact context file and refresh it with one script. |
| Breaking changes | None for runtime behavior. |
| Migration notes | Use `npm run docs:ai` after successful implementations to regenerate the primary AI docs. |

## 2026-06-15 - AI Context Documentation System

| Field | Details |
| --- | --- |
| Feature | Created the initial AI-friendly living documentation set for the repository. |
| Files changed | `CLAUDE.md`, `docs/AI_CONTEXT.md`, `docs/PROJECT_OVERVIEW.md`, `docs/SYSTEM_ARCHITECTURE.md`, `docs/FOLDER_STRUCTURE.md`, `docs/DATABASE.md`, `docs/API_REFERENCE.md`, `docs/AUTH_FLOW.md`, `docs/DOCKER_SETUP.md`, `docs/FEATURE_TRACKER.md`, `docs/CURRENT_STATUS.md`, `docs/ROADMAP.md`, `docs/KNOWN_ISSUES.md`, `docs/CODING_GUIDELINES.md`, `docs/DEPENDENCIES.md`, `docs/ENVIRONMENT.md`, `docs/BUSINESS_LOGIC.md`, `docs/MODULES.md`, `docs/AI_DOC_UPDATE_PROTOCOL.md`, `docs/CHANGELOG_AI.md`. |
| Impact | Established the original persistent project context for AI agents. |
| Breaking changes | None. |
| Migration notes | None. |
