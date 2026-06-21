# CHATBOT_RUNTIME_PROOF.md

**Audit Date**: 2026-06-18  
**Verification Method**: Programmatic CRUD endpoint checks (`verify-chatbot.js`) and database state assertions.

---

## 1. Chatbots CRUD Lifecycle Matrix

| Action / Workflow | Works | Evidence | Database Persistence | Notes |
| :--- | :---: | :--- | :--- | :--- |
| **Create Chatbot** | ✅ **Works** | `{"success":true,"msg":"Chatbot was added"}` | ✅ Row created in `chatbot` table (stores title, scope, flow, active status, origin). | Requires a saved flow object to complete creation successfully. |
| **Assign Flow** | ✅ **Works** | The JSON flow definition is saved inline. | ✅ The DB serializes and embeds flow fields in the `flow` column. | Verifies flow ownership matches before link saving. |
| **Disable Bot** | ✅ **Works** | Active flag updates to 0. | ✅ Sets `active = 0` in the `chatbot` table. | Checked dynamically via `/api/chatbot/change_bot_status`. |
| **Enable Bot** | ✅ **Works** | Active flag updates to 1. | ✅ Sets `active = 1` in the `chatbot` table. | Checked dynamically via `/api/chatbot/change_bot_status`. |
| **Read Configs** | ✅ **Works** | Lists configured chatbot rules. | ✅ Reads from `chatbot` table. | Serves rules filtered by user ID. |
| **Delete Bot** | ✅ **Works** | `{"success":true,"msg":"Chatbot was deleted"}` | ✅ Row removed from `chatbot` table. | Removes configuration cleanly. |

---

## 2. Technical Evidence & Database Tracing

### A. Chatbot Database Record Creation
Creating a chatbot created the following record in the PostgreSQL `chatbot` table:
*   **Row Output**:
    ```json
    {
      "id": 2,
      "uid": "local-user-uid",
      "title": "Audit Chatbot 1781773748298",
      "for_all": 1,
      "chats": "[]",
      "flow": "{\"id\":4,\"uid\":\"local-user-uid\",\"flow_id\":\"audit-flow-1781773748278\",\"title\":\"Audit Flow for Bot 1781773748278\",\"prevent_list\":null,\"ai_list\":null,\"createdat\":\"2026-06-18T09:09:08.282Z\",\"updatedat\":\"2026-06-18T09:09:08.282Z\"}",
      "flow_id": "audit-flow-1781773748278",
      "active": 1,
      "origin": "{\"title\":\"Meta\",\"code\":\"META\",\"data\":{}}",
      "createdat": "2026-06-18T09:09:08.301Z",
      "updatedat": "2026-06-18T09:09:08.301Z"
    }
    ```
*   **SQL Schema Table**: `chatbot` (columns: `id`, `uid`, `title`, `for_all`, `chats`, `flow`, `flow_id`, `active`, `origin`, `createdat`, `updatedat`).

### B. Status Toggles State Checks
*   Disabling the bot (`status: false`): SQL query executed `UPDATE chatbot SET active = 0 WHERE id = 2`. DB verification returned `active = 0`.
*   Enabling the bot (`status: true`): SQL query executed `UPDATE chatbot SET active = 1 WHERE id = 2`. DB verification returned `active = 1`.
*   Verification query: `SELECT active FROM chatbot WHERE id = 2;`
