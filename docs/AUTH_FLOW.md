# Auth Flow

Last audited: 2026-06-20

## Active Auth Middleware

Active route modules import these files:

| Role | Middleware | Used by |
| --- | --- | --- |
| Admin | `middlewares/admin.js` | `routes/admin.js`, `routes/web.js` admin-only endpoints |
| User | `middlewares/user.js` | Most tenant route modules |
| Agent | `middlewares/agent.js` | `routes/agent.js` agent-only endpoints |
| Plan | `middlewares/plan.js` | Plan-limited routes after user/agent validation |

`middlewares/auth.js` exists and has cleaner HTTP status handling, but active route files do not import it.

## Login Routes

| Route | Auth source | Token payload |
| --- | --- | --- |
| `POST /api/admin/login` | `admin.email` + bcrypt password | `uid`, `role: "admin"`, `password`, `email` |
| `POST /api/user/login` | `"user".email` + bcrypt password | `uid`, `role: "user"`, `password`, `email` |
| `POST /api/agent/login` | `agents.email` + bcrypt password | `uid`, `role: "agent"`, `password`, `email`, `owner_uid` |

Tokens are signed with `env.JWT_SECRET`. The route code passes option `{ expiresIn: env.JWT_EXPIRY }` (defaulting to 7 days) to enforce explicit expirations, and `{ expiresIn: '1h' }` for password recovery tokens.

## Frontend Storage

| File | Behavior |
| --- | --- |
| `client/src/shared/auth.jsx` | Stores role tokens in localStorage key `b1gcrm-auth` as `{ admin, user, agent }`. |
| `client/src/shared/api.js` | Adds `Authorization: Bearer <token>` when a token is passed to `apiRequest`. |
| `client/src/utils/api.js` | Axios helper reads `accessToken` or `b1gcrm-active-token`; this is used by `client/src/store/index.js`, not by most current pages. |

## Backend Validation

```mermaid
flowchart TD
  Req[Request with Authorization header] --> Split[Split Bearer token]
  Split --> Verify[jwt.verify with JWT_SECRET]
  Verify --> DB[Lookup by email + password hash]
  DB --> Role[Check role field]
  Role --> Attach[Attach req.decode]
  Attach --> Next[next()]
```

Agent validation adds:

1. `agents.is_active` must be truthy.
2. Owner user is loaded with `SELECT * FROM user WHERE uid = owner_uid`.
3. Owner user is attached as `req.owner`.

## Plan Middleware

| Middleware | Behavior |
| --- | --- |
| `checkPlan` | Loads tenant user by `req.decode.uid`, or agent owner via `req.owner`; requires `user.plan` and non-expired `user.plan_expire`; parses plan JSON into `req.plan`. |
| `checkContactLimit` | Counts contacts by `uid` and compares against `req.plan.contact_limit`. |
| `checkNote` | Requires `req.plan.allow_note > 0`. |
| `checkTags` | Requires `req.plan.allow_tag > 0`. |

## API Key Flow

| Step | File/route |
| --- | --- |
| Generate key | `GET /api/user/generate_api_keys` signs `{ uid, role: "user" }` and stores token in `user.api_key`. |
| Use key | `/api/v1/send-message?token=...` uses query token. |
| Template API | `POST /api/v1/send_templet` expects `token` in body. |
| Validation | `routes/apiv2.js` verifies JWT, loads user, checks `user.api_key === token`, plan expiry, and `plan.allow_api`. |

## Auto Login

| Route | Purpose |
| --- | --- |
| `POST /api/admin/auto_login` | Admin creates a user token for a selected tenant. |
| `POST /api/user/auto_agent_login` | Tenant creates an agent token for an owned agent. |

## Security Notes

| Issue | Impact |
| --- | --- |
| Tokens include password hash | Password changes invalidate tokens, but sensitive hash material is inside JWT payload. |
| Login tokens omit explicit expiry | Enforced explicit expiry `{ expiresIn: env.JWT_EXPIRY }` (7d) in Sprint 13. [RESOLVED] |
| Frontend role gates only check token presence | Backend middleware remains the true authorization boundary. |
| No CSRF layer | APIs rely on Bearer tokens and CORS config. |
| API keys are JWTs stored directly on user rows | Regeneration invalidates old keys by mismatch with `user.api_key`. |
