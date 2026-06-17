# Local Runtime Role Audit

Verification of B1GCRM authentication, authorization, and API endpoint health across all three roles.

> [!IMPORTANT]
> All tests were executed against the live local Docker deployment at `http://127.0.0.1:3010` on 2026-06-17.

---

## Authentication Verification

| Role | Email | Password | Login Endpoint | Result |
| --- | --- | --- | --- | --- |
| **User** | `user@example.com` | `User@123` | `POST /api/user/login` | ✅ Success (JWT issued) |
| **Admin** | `admin@example.com` | `Admin@123` | `POST /api/admin/login` | ✅ Success (JWT issued) |
| **Agent** | `agent@example.com` | `User@123` | `POST /api/agent/login` | ✅ Success (JWT issued) |
| **Signup** | `parity-test@example.com` | `parity123` | `POST /api/user/signup` | ✅ Success (account created) |

> [!NOTE]
> Seed credentials are defined in `database/seed-dev.js` and applied by `npm run db:seed`. The bcrypt hashes are pre-computed in `database/migrations/000_create_base_schema.sql`.

---

## API Endpoint Health Matrix (User Role)

All endpoints tested with `Bearer <token>` authorization header.

| Endpoint | Method | Response | Status |
| --- | --- | --- | --- |
| `/api/user/get_dashboard` | GET | `success: true`, returns `totalChats`, `totalContacts`, `totalFlows`, `totalChatbots` | ✅ Healthy |
| `/api/user/get_me` | GET | `success: true`, returns user profile | ✅ Healthy |
| `/api/user/get_meta_keys` | GET | `success: true` | ✅ Healthy |
| `/api/user/get_my_meta_templets` | GET | `success: true`, returns template array | ✅ Healthy |
| `/api/user/get_my_widget` | GET | `success: true`, returns widget array | ✅ Healthy |
| `/api/user/get_my_agent_tasks` | GET | `success: true` | ✅ Healthy |
| `/api/user/fetch_profile` | GET | `success: true` | ✅ Healthy |
| `/api/user/generate_api_keys` | GET | `success: true` | ✅ Healthy |
| `/api/phonebook/get_by_uid` | GET | `success: true`, returns phonebook array | ✅ Healthy |
| `/api/phonebook/get_uid_contacts` | GET | `success: true`, returns contact array | ✅ Healthy |
| `/api/chat_flow/get_mine` | GET | `success: true`, returns flow array | ✅ Healthy |
| `/api/chatbot/get_chatbot` | GET | `success: true`, returns chatbot array | ✅ Healthy |
| `/api/chatbot/get_logs` | GET | `success: true`, returns log array | ✅ Healthy |
| `/api/broadcast/get_broadcast` | GET | `success: true`, returns broadcast array | ✅ Healthy |
| `/api/broadcast/dashboard_summary` | GET | `success: true` | ✅ Healthy |
| `/api/webhooks/rules` | GET | `success: true`, returns rules array | ✅ Healthy |
| `/api/inbox/get_chats` | GET | `success: true`, returns chat array | ✅ Healthy |
| `/api/qr/get_all` | GET | `success: true`, returns QR instances | ✅ Healthy |

## API Endpoint Health Matrix (Admin Role)

| Endpoint | Method | Response | Status |
| --- | --- | --- | --- |
| `/api/admin/get_plans` | GET | `success: true`, returns plans array | ✅ Healthy |
| `/api/admin/get_users` | GET | `success: true` | ✅ Healthy |
| `/api/admin/get_orders` | GET | `success: true` | ✅ Healthy |
| `/api/admin/get_web_public` | GET | `success: true` | ✅ Healthy |
| `/api/admin/get_payment_gateway_admin` | GET | `success: true` | ✅ Healthy |
| `/api/admin/get_brands` | GET | `success: true` | ✅ Healthy |
| `/api/admin/get_faq` | GET | `success: true` | ✅ Healthy |
| `/api/admin/get_pages` | GET | `success: true` | ✅ Healthy |
| `/api/admin/get_testi` | GET | `success: true` | ✅ Healthy |
| `/api/admin/get_smtp` | GET | `success: true` | ✅ Healthy |

---

## Role-Based Access Control

| Feature | User | Admin | Agent | Implementation |
| --- | --- | --- | --- | --- |
| Dashboard access | ✅ Own tenant | ✅ Global | ✅ Assigned only | Middleware: `validateUser`, `adminValidator`, `agentValidator` |
| Inbox access | ✅ Full | ❌ | ✅ Assigned chats | Socket.IO scope filtering by `uid` |
| Plan management | ❌ | ✅ Full CRUD | ❌ | `adminValidator` on all plan routes |
| User management | ❌ | ✅ List/edit/delete | ❌ | `adminValidator` on user routes |
| Agent creation | ✅ Own tenant | ❌ | ❌ | `validateUser` checks tenant ownership |
| Settings | ✅ Profile only | ✅ Full CMS | ❌ | Separate route handlers per role |
| Auto-login (impersonation) | ✅ To agents | ✅ To any user | ❌ | JWT bypass token generation |

---

## Security Findings

| # | Finding | Severity | Evidence |
| --- | --- | --- | --- |
| 1 | **JWT tokens include bcrypt password hash** | 🔴 Critical | Login response payload contains `password` field in JWT claims |
| 2 | **No JWT expiry set** | 🟡 High | `jwt.sign()` called without `expiresIn` option |
| 3 | **Public routes allow unauthenticated writes** | 🟡 High | `POST /api/web/install_app` and `POST /api/web/update_app` lack auth middleware |
| 4 | **No CORS origin restriction** | 🟢 Medium | `cors()` called without origin whitelist |
| 5 | **No rate limiting on auth endpoints** | 🟢 Medium | No `express-rate-limit` or similar on login/signup |

---

## Docker Container Status

| Container | Image | Status | Ports |
| --- | --- | --- | --- |
| `b1gcrm-app-1` | `b1gcrm-app` | ✅ Up (healthy) | `0.0.0.0:3010→3010/tcp` |
| `b1gcrm-postgres-1` | `postgres:16-alpine` | ✅ Up (healthy) | `0.0.0.0:5432→5432/tcp` |

---

## Database Account Summary

| Table | Count | Seed Accounts |
| --- | --- | --- |
| `"user"` | 3 | `user@example.com` (User@123), `test-signup@example.com`, `parity-test@example.com` |
| `admin` | 1 | `admin@example.com` (Admin@123) |
| `agents` | 1 | `agent@example.com` (User@123) |
