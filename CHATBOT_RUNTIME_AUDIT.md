# CHATBOT_RUNTIME_AUDIT.md

**Audit Date**: 2026-06-18  
**Audit Method**: REST API endpoint execution, database record inspection, flow association verification, and log queue query tests.

---

## 1. Chatbot Feature Matrix

| Action / Test Case | Works | Evidence | Database Persistence | API Endpoint | Notes |
| :--- | :---: | :--- | :--- | :--- | :--- |
| **Create Chatbot** | ✅ **Works** | `{"success":true,"msg":"Chatbot was added"}` | ✅ Row inserted into `chatbot` table (stores title, `for_all` flag, `chats` targets array, `flow` JSON data, `flow_id`, active status). | `POST /api/chatbot/add_chatbot` | Requires providing a flow object and chatbot name. |
| **Assign Flow** | ✅ **Works** | Backend loads the flow metadata from DB and embeds it inside the chatbot record. | ✅ Flow details are serialized and stored inside the `flow` column in the `chatbot` table. | `POST /api/chatbot/add_chatbot` | Validates flow ownership prior to association. |
| **Enable Bot** | ✅ **Works** | Chatbot state updates dynamically. | ✅ Sets `active = 1` in the `chatbot` table. | `POST /api/chatbot/change_bot_status` | Plan constraints verified before enabling. |
| **Disable Bot** | ✅ **Works** | Chatbot state updates dynamically. | ✅ Sets `active = 0` in the `chatbot` table. | `POST /api/chatbot/change_bot_status` | Bypasses trigger checks in incoming webhook pipeline. |
| **Read Logs** | ✅ **Works** | Returns match outcomes (`matched`, `no_match`, `skipped`). | ✅ Reads from `chatbot_log` table. | `GET /api/chatbot/get_logs` | Logs match timestamp, incoming message, and actions. |
| **Delete Chatbot** | ✅ **Works** | `{"success":true,"msg":"Chatbot was deleted"}` | ✅ Row deleted from `chatbot` table. | `POST /api/chatbot/del_chatbot` | Logs are retained for diagnostics. |

---

## 2. Validation Constraints & Edge Cases

### A. Dynamic Flow Validation
B1GCRM performs strict flow composition audits during chatbot creation:
*   **Unsupported Node Blocker**: If the chatbot origin is configured as **QR** and the selected flow contains interactive buttons or lists (`BUTTON` or `LIST` type nodes), the API returns a validation error block: *"Please select another flow which does not contain interactive buttons"*. This is because WhatsApp QR Baileys connections cannot handle interactive template schemas natively.
*   **Flow Ownership Validation**: The backend checks that the `flow_id` matches the user's logged-in `uid` using `SELECT * FROM flow WHERE uid = ? AND flow_id = ?`.

### B. Chat Targets Isolation
When configuring target scope:
1.  **For All Chats (`for_all = 1`)**: The bot responds to all incoming messages.
2.  **Targeted Chats (`for_all = 0`)**: The bot only processes messages belonging to specific `chat_id` values listed in the `chats` JSON array. The backend validates that these chat sessions actually belong to the current user before saving.
