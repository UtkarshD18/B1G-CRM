# Roadmap

Last audited: 2026-06-20

## Priority 1 - Critical Parity Fixes (Sprint 4)

| Work | Why | Files |
| --- | --- | --- |
| Fix Admin Plan definitions update route. | Collision in `routes/admin.js` prevents updating plan cost/limits. | `routes/admin.js`, `client/src/pages/admin/Plans.jsx` |
| Add validation parameters to Chat Widget fields. | Prevents database casting crashes from styling strings. | `routes/user.js`, `client/src/pages/user/ChatWidget.jsx` |
| Integrate Webhook Rules Execution Engine. | Rules CRUD exists, but triggers are not evaluated on incoming messages. | `helper/inbox/inbox.js`, `routes/webhooks.js` |
| Activate QR WhatsApp Baileys connector. | QR page/table exists, but connection methods are stubbed/mocked. | `routes/qr.js`, `helper/addon/qr/*` |

## Priority 2 - User Workspace & Kanban Sync

| Work | Why | Files |
| --- | --- | --- |
| Implement drag-and-drop Kanban persistence. | Kanban UI is a mockup and does not sync columns to database. | `routes/inbox.js`, `client/src/pages/user/Kanban.jsx` |
| Inbox composer quick reply templates. | Allows templates to be chosen directly in chat composer. | `client/src/pages/user/Inbox.jsx` |
| Mock campaign delivery loop. | Enables full mock execution testing without live Meta API keys. | `loops/campaignLoop.js`, `functions/function.js` |

## Priority 3 - Stabilize Foundations & Security

| Work | Why | Files |
| --- | --- | --- |
| Add backend unit tests for auth and tenant isolation. | [RESOLVED] Configured root test suite running backend auth and integration checks in Sprint 14. | `routes/*`, `middlewares/*`, `scratch/verify-backend-auth.js` |
| Harden JWT payloads. | [RESOLVED] Enforced explicit token expirations (7d/1h) in Sprint 13. | `routes/user.js`, `routes/admin.js`, `routes/agent.js` |
| Audit user deletion effects. | [RESOLVED] Wrapped user cascade delete (/del_user) in a safe database transaction in Sprint 14. | `routes/admin.js` |

## Priority 4 - Planned Channels

| Work | Current state |
| --- | --- |
| Instagram link / DM automation | Placeholder UI/routes only. |
| Telegram sessions | Placeholder route only. |
| Web notifications / manual push | Placeholder route only. |
| WhatsApp forms | Placeholder route only. |
| WhatsApp warmer | Placeholder route only. |

## Ongoing Rule

After every successful roadmap item, update:

- [CURRENT_STATUS.md](CURRENT_STATUS.md)
- [CHANGELOG_AI.md](CHANGELOG_AI.md)
- [AI_CONTEXT.md](AI_CONTEXT.md)
- Any conditional docs listed in [AI_DOC_UPDATE_PROTOCOL.md](AI_DOC_UPDATE_PROTOCOL.md)
