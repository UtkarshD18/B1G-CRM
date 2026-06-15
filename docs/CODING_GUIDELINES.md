# Coding Guidelines

Last audited: 2026-06-15

## Local Patterns

| Area | Guideline |
| --- | --- |
| Backend modules | Follow CommonJS style used by existing backend files. |
| Database queries | Use `query()` from `database/dbpromise.js` unless introducing a deliberate lower-level `pg` use. |
| SQL placeholders | Existing code uses `?` placeholders through the adapter. |
| Route auth | Match existing route middleware for the module unless deliberately migrating auth with tests. |
| Tenant safety | Always filter tenant-owned data by `req.decode.uid` or agent owner context. |
| Agent safety | Agent routes must respect `req.owner.uid` and `agent_chats` assignment. |
| Plan gates | Use `checkPlan` for paid/limited actions and `checkContactLimit`, `checkNote`, `checkTags` where relevant. |
| Frontend API calls | Current pages use `client/src/shared/api.js` with role tokens from `useAuth()`. |
| Frontend routes | Add route entries in `client/src/routes/AppRoutes.jsx` and navigation in `client/src/shared/navigation.js` when needed. |
| Runtime files | Preserve `conversations/`, `flow-json/`, media folders, and Docker volumes. |

## API Changes

When adding or changing an API:

1. Update the route module under `routes/`.
2. Add/adjust middleware deliberately.
3. Update frontend caller(s).
4. Update [API_REFERENCE.md](API_REFERENCE.md).
5. Update [MODULES.md](MODULES.md) and [CURRENT_STATUS.md](CURRENT_STATUS.md) when behavior changes.
6. Add tests when risk is non-trivial.

## Database Changes

When changing schema:

1. Add a new numbered SQL migration in `database/migrations`.
2. Keep it idempotent where possible with `IF NOT EXISTS`.
3. Think through existing data and rollback safety.
4. Update [DATABASE.md](DATABASE.md), [CURRENT_STATUS.md](CURRENT_STATUS.md), and [CHANGELOG_AI.md](CHANGELOG_AI.md).
5. Do not rely on `database/schema.sql` until it is reconciled.

## Frontend Changes

| Concern | Guideline |
| --- | --- |
| Routing | Keep admin/user/agent route branches in `AppRoutes.jsx`. |
| Auth | Use `useAuth()` role tokens for current protected pages. |
| API helper | Prefer `apiRequest`/`apiFormRequest` from `shared/api.js` for consistency. |
| Tests | Add/adjust Jest/RTL coverage for new route surfaces and important UI states. |
| Styling | Match existing CSS and portal density. |

## Security Rules

| Rule | Reason |
| --- | --- |
| Do not add public mutating routes without a strong reason. | Existing public update routes are already risky. |
| Do not trust `uid` from request body when `req.decode.uid` is available. | Tenant isolation. |
| Do not expose provider tokens/secrets in frontend responses unless already required and safe. | Payment/Meta/SMTP secrets. |
| Validate uploaded file type/size and destination. | Public media write risk. |
| Keep cross-tenant joins explicit and scoped. | No DB foreign keys enforce this. |

## Documentation Rule

After every successful change, update the docs listed in [AI_DOC_UPDATE_PROTOCOL.md](AI_DOC_UPDATE_PROTOCOL.md). This is part of the definition of done.
