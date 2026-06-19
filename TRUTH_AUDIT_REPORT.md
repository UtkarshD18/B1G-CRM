# TRUTH_AUDIT_REPORT.md

This report presents the module-by-module runtime verification of the B1GCRM application. All findings are derived from real execution outcomes, network logs, and PostgreSQL database queries on the `sprint5-runtime-verification` branch.

---

## 1. Authentication & Role Portals

### Gated Portals & Roles
*   **Tenant Admin (`admin@example.com` / `Admin@123`)**:
    *   **Backend Validation**: Verifies role checks in `middlewares/admin.js`.
    *   **Database Count**: 1 admin row in table `admin` (`local-admin-uid`).
    *   **Frontend Parity**: Accesses `/admin/dashboard`, `/admin/manage-plans`, and `/admin/manage-users` successfully.
*   **Workspace Owner (`user@example.com` / `User@123`)**:
    *   **Backend Validation**: Gated by `middlewares/user.js`.
    *   **Database Count**: 1 user row in table `user` (`local-user-uid`).
    *   **Frontend Parity**: Accesses `/user/dashboard`, `/user/contacts`, etc.
*   **Workspace Agent (`demo_agent_local-@example.com` / `Agent@123`)**:
    *   **Backend Validation**: Gated by agent credentials in `middlewares/agent.js` (stored in `agents` table).
    *   **Database Count**: 1 agent row in table `agents` (`agent_1zT2YHFv`).
    *   **Frontend Parity**: Accesses `/agent/dashboard` and `/agent/inbox` with restricted visibility to assigned conversations in `agent_chats`.

---

## 2. Seeder Verification (Demo CRM Data)
When triggering the **"Generate Demo CRM Data"** button via `/user/dashboard` with direct Node execution (`node server.js` to bypass nodemon crash):
*   **Phonebooks**: Inserts 1 row in `phonebook` table (`Demo Leads Phonebook`, ID 4).
*   **Contacts**: Inserts 10 rows in `contact` table (Aarav Mehta, Diya Sharma, etc.).
*   **Campaigns**: Inserts 1 row in `broadcast` table (`Demo Launch Campaign`, Status `COMPLETED`, ID `bc_demo_...`).
*   **Campaign Logs**: Inserts 10 rows in `broadcast_log` table mapping delivery statuses (`read`, `delivered`, `failed`, etc.).
*   **Flows**: Inserts 1 row in `flow` table (`Demo Welcome Visual Flow`, ID `flow_demo_welcome`). Writes JSON nodes (`[{"id":"1","type":"START"},{"id":"2","type":"MESSAGE"}]`) and edges to the filesystem (`flow-json/nodes/` and `flow-json/edges/`).
*   **Chatbots**: Inserts 1 row in `chatbot` table (`Demo Welcome Autopilot`, ID 3).
*   **Chatbot Logs**: Inserts 5 rows in `chatbot_log` table (statuses: `replied`, `unmatched`, `escalated`).
*   **Templates**: **Verified Seeding.** 2 template rows are inserted into the `templets` database table (`demo_welcome_template` and `order_update`).
*   **Agents**: Inserts 1 row in `agents` table (`demo_agent_local-@example.com`).
*   **Agent Tasks**: Inserts 1 row in `agent_task` table (`Follow up with Aarav Mehta`, status `PENDING`).
*   **Conversations (Chats)**: Inserts 3 rows in `chats` table (`demo-chat-wa-1`, `demo-chat-qr-2`, `demo-chat-insta-3`). Writes 3 JSON conversations to the filesystem under `conversations/inbox/local-user-uid/`.

---

## 3. Module Parity & Reality Matrix

| Module | Feature | UI State | Database Mutation | API Endpoint | Parity Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Contacts** | Create Phonebook | Accessible Form | `INSERT INTO phonebook` | `POST /api/phonebook/add` | ✅ Works (Decoupled load status clears correctly) |
| **Contacts** | Add Single Contact | Accessible Form | `INSERT INTO contact` | `POST /api/phonebook/add_single_contact` | ✅ Works (Decoupled load status clears correctly) |
| **Contacts** | Import CSV | File Uploader | `INSERT INTO contact` (Bulk) | `POST /api/phonebook/import_contacts` | ✅ Works (Requires headers) |
| **Contacts** | Edit Contact | **Fully Operational Modal** | `UPDATE contact` | `POST /api/phonebook/update_contact` | ✅ Works (Added in Sprint 11) |
| **Contacts** | Rename Phonebook | **Fully Operational Modal** | `UPDATE phonebook` | `POST /api/phonebook/update` | ✅ Works (Added in Sprint 11) |
| **Campaigns** | Create & Schedule | Form fields | `INSERT INTO broadcast` | `POST /api/broadcast/add_new` | ✅ Works (Mock/live templates supported) |
| **Campaigns** | Delivery Loop | Grid Display | `UPDATE broadcast` + `broadcast_log` | In-process background runner | ✅ Processed successfully via Loop |
| **Campaigns** | Dashboard Summary | Charts & Counters | Reads logs/broadcasts | `GET /api/broadcast/dashboard_summary` | ✅ Works |
| **Chatbot** | Flow Dropdown | Populates | Reads `flow` table | `GET /api/chatbot/get_chatbot` | ✅ Works |
| **Chatbot** | Create / Update | Form fields | `INSERT/UPDATE chatbot` | `POST /api/chatbot/add_chatbot` | ✅ Works |
| **Chatbot** | Enable / Disable | Status toggle | `UPDATE chatbot SET active` | `POST /api/chatbot/change_bot_status` | ✅ Works |
| **Automation** | Node / Edge Create | Canvas & Palette | filesystem write | `POST /api/chat_flow/add_new` | ✅ Works (Raw JSON hidden under collapsible sidebar card) |
| **Automation** | Execution | Triggered by webhook | Writes `chatbot_log` | Webhook receiver | ✅ Works (Verified offline via logs) |
| **Click-to-Chat**| WhatsApp click-to-chat | iframe embeds | `INSERT INTO chat_widget` | `GET /api/user/widget` | ✅ Renamed from Chat Widget to WhatsApp Click-to-Chat Launcher |
| **Webhooks** | Rule CRUD | Form editor | `INSERT/UPDATE/DELETE webhook_rules`| `/api/webhooks/rules/*` | ✅ Works |
| **Webhooks** | Rule Evaluation | **Active Matcher** | `INSERT INTO webhook_logs` | `/api/inbox/webhook/:uid` | ✅ Works (Rule evaluation integrated into ingest lifecycle in Sprint 11) |
| **Plans** | Plan definition edit | Plan Forms | `UPDATE plan` | `POST /api/admin/edit_plan` | ✅ Works |
| **Plans** | Plan Assignment | User Card | `UPDATE user SET plan` | `POST /api/admin/update_plan` | ✅ Works (Endpoint naming is mismatch) |
| **QR WhatsApp**| Baileys Session | Connections list | `INSERT INTO instance` | `POST /api/qr/gen_qr` | ⚠️ Session CRUD works; integration stubs present in other modules |

---

## 4. Visual Evidence Map (Seeded State)

*   **Login Interface**:
    ![Login Page](/home/sagaragrawal/.gemini/antigravity-ide/brain/b4af9645-f484-4534-b01d-98ab8f43cc16/01_login_page.png)
*   **Dashboard (After Seeding)**:
    ![Dashboard](/home/sagaragrawal/.gemini/antigravity-ide/brain/b4af9645-f484-4534-b01d-98ab8f43cc16/03_dashboard_after_seeding.png)
*   **Contacts Inventory**:
    ![Contacts Page](/home/sagaragrawal/.gemini/antigravity-ide/brain/b4af9645-f484-4534-b01d-98ab8f43cc16/08_contacts_after_contact_submit.png)
*   **Campaigns Interface**:
    ![Campaigns Send](/home/sagaragrawal/.gemini/antigravity-ide/brain/b4af9645-f484-4534-b01d-98ab8f43cc16/11_campaigns_details_mapped.png)
*   **Chatbot Management**:
    ![Chatbots](/home/sagaragrawal/.gemini/antigravity-ide/brain/b4af9645-f484-4534-b01d-98ab8f43cc16/14_chatbot.png)
*   **Chat Widget Setup**:
    ![Chat Widget](/home/sagaragrawal/.gemini/antigravity-ide/brain/b4af9645-f484-4534-b01d-98ab8f43cc16/15_chat_widget.png)
