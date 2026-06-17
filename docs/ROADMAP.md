# Roadmap

Last audited: 2026-06-17

## Priority 1 - Stabilize Foundations

| Work | Why | Files |
| --- | --- | --- |
| Add backend tests for auth, tenant isolation, and core routes. | Current backend has no test suite. | `routes/*`, `middlewares/*`, new test setup |
| [Completed] Reconcile database schema docs/files. | Done (synced schema files with migrations 000-009). | `database/schema.sql`, `database/migrations/*`, `docs/DATABASE.md` |
| Harden auth tokens. | Active login routes omit expiry and include password hashes. | `routes/user.js`, `routes/admin.js`, `routes/agent.js`, `middlewares/*` |
| Audit public mutating routes. | Install/update/theme/language writes can be dangerous in production. | `routes/web.js` |
| Decide QR product path. | QR API/UI exists, implementation is stubbed. | `routes/qr.js`, `helper/addon/qr/*`, `client/src/pages/user/Integrations.jsx` |

## Priority 2 - Complete User Workspace

| Work | Why | Files |
| --- | --- | --- |
| Inbox polish and pagination. | Inbox is central and JSON-file backed. | `routes/inbox.js`, `socket.js`, `helper/socket/*`, `client/src/pages/user/Inbox.jsx` |
| Campaign pacing/retry/preview. | Broadcasts need production controls. | `routes/broadcast.js`, `loops/*`, `client/src/pages/user/Campaigns.jsx` |
| Flow/chatbot validation. | Runtime depends on saved JSON and node compatibility. | `routes/chatFlow.js`, `routes/chatbot.js`, `functions/chatbot.js`, `helper/chatbot/*` |
| Webhook execution engine. | Rule CRUD exists but no execution/log pipeline was found. | `routes/webhooks.js`, `helper/inbox/*`, new logs/migration |
| API usage analytics. | Developer API dashboard mentions readiness but not usage analytics. | `routes/apiv2.js`, `client/src/pages/user/DeveloperApi.jsx` |

## Priority 3 - Admin And Billing Readiness

| Work | Why | Files |
| --- | --- | --- |
| Payment provider reconciliation. | Routes exist, but production success/failure paths need hardening. | `routes/user.js`, `routes/admin.js`, `client/src/pages/user/Billing.jsx` |
| Admin CMS polish. | Many CMS/settings APIs exist; UI consolidation may be needed. | `client/src/pages/admin/Settings.jsx`, `routes/admin.js`, `routes/web.js` |
| Audit user deletion effects. | No foreign keys means deletes can leave orphaned data. | `routes/admin.js`, migrations |
| Secret management plan. | Meta/payment/SMTP tokens are sensitive. | `env.js`, `routes/admin.js`, deployment docs |

## Priority 4 - Planned Channels And Modules

| Work | Current state |
| --- | --- |
| Instagram link/DM/comment automation | Placeholder UI/routes only. |
| Telegram sessions | Placeholder route only. |
| Web notifications/manual push | Placeholder route only. |
| WhatsApp forms | Placeholder route only. |
| WhatsApp warmer | Placeholder route only. |
| AI/WA calls | Placeholder routes only. |

## Ongoing Rule

After every successful roadmap item, update:

- [CURRENT_STATUS.md](CURRENT_STATUS.md)
- [FEATURE_TRACKER.md](FEATURE_TRACKER.md)
- [CHANGELOG_AI.md](CHANGELOG_AI.md)
- [AI_CONTEXT.md](AI_CONTEXT.md)
- Any conditional docs listed in [AI_DOC_UPDATE_PROTOCOL.md](AI_DOC_UPDATE_PROTOCOL.md)
