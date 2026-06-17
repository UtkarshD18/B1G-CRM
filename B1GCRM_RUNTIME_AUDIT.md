# B1GCRM Local Runtime Audit (B1GCRM_RUNTIME_AUDIT.md)

This audit documents the runtime behavior, API responsiveness, page loads, and navigation verification of the B1GCRM local Docker Compose deployment.

---

## 1. Verification of Surface Portals

### Public Portal (Marketing & Auth)
- **Reachable Routes:** `/`, `/signin`, `/login`, `/user/signup`, `/admin/login`, `/user/login`, `/agent/login`.
- **Page Loads:** **Success.** The browser loads all auth screens cleanly.
- **API Calls:** **Success.** Requests to `POST /api/user/signup` and `POST /api/user/login` return appropriate JSON payloads and JWT signatures.
- **Data Rendering:** **Success.** Core assets (logo, titles) and layout structure render.
- **Navigation:** **Success.** Internal layout links redirect correctly.

### Admin Portal (`/admin`)
- **Reachable Routes:** `dashboard`, `manage-plans`, `manage-users`, `orders`, `settings`.
- **Page Loads:** **Success.** Gated route loads correctly after authenticating with `admin@example.com` token.
- **API Calls:**
  - `GET /api/admin/get_users` (Succeeds)
  - `GET /api/admin/get_plans` (Succeeds)
  - `GET /api/admin/get_orders` (Succeeds)
- **Data Rendering:** **Success.** Tables render actual database values (such as seeded plan models and registered user rows).
- **Forms & Actions:** **Success.** Forms for adding plans or overriding user limits post correctly to the backend database via query adapter.

### User Portal (`/user`)
- **Reachable Routes:** `dashboard`, `inbox`, `contacts`, `campaigns`, `automation-flows`, `wa-chatbot`, `integrations`, `agent-login`, `agent-task`, `chat-widget`, `billing`, `api-dashboard`, `manage-webhooks`, `settings`.
- **Page Loads:** **Success.** Loads correctly under a valid user JWT.
- **API Calls:**
  - `GET /api/user/get_dashboard_details` (Succeeds)
  - `GET /api/phonebook/get_by_uid` (Succeeds)
  - `GET /api/inbox/get_chat` (Succeeds)
  - `GET /api/chat_flow/get_flows` (Succeeds)
  - `GET /api/chatbot/get_bots` (Succeeds)
- **Data Rendering:** **Success.** Contacts grid renders current contacts, React Flow canvas correctly maps edges and nodes from JSON, and diagnostics table displays auto-reply history logs.
- **Forms & Actions:** **Success.** Creating phonebooks, adding single contacts, importing CSV lists, scheduling broadcasts, and toggling chatbots execute cleanly.

### Agent Portal (`/agent`)
- **Reachable Routes:** `dashboard`, `inbox`.
- **Page Loads:** **Success.** Accessible under agent role JWT.
- **API Calls:**
  - `GET /api/agent/get_my_tasks` (Succeeds)
  - `GET /api/agent/get_my_assigned_chats` (Succeeds)
- **Data Rendering:** **Success.** Limits chat listing only to assigned rows linked via `agent_chats`. Task status updates post changes correctly.

---

## 2. Overall Usability Status

* **Static Assets Serving:** Serving from `client/dist/` assets works.
* **REST API Endpoint Routing:** Route handling in `server.js` functions correctly.
* **Real-time WebSockets:** Socket.IO server establishes handshakes and handles text dispatches correctly.
* **Campaign Loop Worker:** Background recursive worker handles schedule checks and schedules dispatches without blocking main port operations.
