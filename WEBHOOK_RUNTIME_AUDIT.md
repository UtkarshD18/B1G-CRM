# WEBHOOK_RUNTIME_AUDIT.md

**Audit Date**: 2026-06-18  
**Audit Method**: REST API CRUD execution, PostgreSQL database confirmation, and repository-wide codebase trace.

---

## 1. Webhook Automation Feature Matrix

| Phase / Test Case | Works | Evidence / Result | DB Persistence | API Endpoint | Notes |
| :--- | :---: | :--- | :--- | :--- | :--- |
| **Create Webhook Rule** | ✅ **Works** | Returns `{"success":true,"msg":"Webhook rule created","data":{...}}`. | ✅ Row created in `webhook_rules` table (stores event name, conditions, matches, payload). | `POST /api/webhooks/rules` | Strict JSON validation for action payload strings. |
| **Read Webhook Rules** | ✅ **Works** | Returns list of configured rule rows. | ✅ Reads from `webhook_rules` table. | `GET /api/webhooks/rules` | Displays rules sorted by creation timestamp. |
| **Update Webhook Rule** | ✅ **Works** | Returns `{"success":true,"msg":"Webhook rule updated","data":{...}}`. | ✅ Updates corresponding row in `webhook_rules`. | `POST /api/webhooks/rules/update` | Returns updated row data. |
| **Delete Webhook Rule** | ✅ **Works** | Returns `{"success":true,"msg":"Webhook rule deleted"}`. | ✅ Deletes row from `webhook_rules` table. | `POST /api/webhooks/rules/delete` | |
| **Trigger Rule Execution** | ❌ **Broken** | Rules are never evaluated when incoming messages are processed. | N/A | None | **Missing Engine**: Rules are never checked or triggered. |
| **Confirm Expected Action** | ❌ **Broken** | No actions are executed. | N/A | None | No outgoing webhooks or tags are dispatched. |

---

## 2. Definitive Codebase Parity Audit

### A. CRUD Capability Validation
The API endpoint logic in `routes/webhooks.js` successfully manages the database table `webhook_rules`. When a tenant admin creates a rule (e.g., matching event "incoming_message", field "body", operator "contains", action "tag_chat"), the backend successfully writes this schema to the database.

### B. Execution Engine Gap Analysis
A deep repository search confirms:
*   The `webhook_rules` table is **only referenced** in `routes/webhooks.js` (for CRUD) and the schema migrations (`007_create_webhook_rules.sql` and `schema.sql`).
*   **No hook, event emitter, or trigger function** in the incoming webhook pipeline (`routes/inbox.js` and `helper/inbox/inbox.js`) queries or processes the `webhook_rules` table at runtime.
*   Incoming webhook requests successfully process chatbot rules (`chatbot` table) and save message records to files, but **never execute webhook rules**.

### C. Parity Gap Against Live Reference CRM
The live reference CRM contains a functional Webhook Logs (`/user?page=webhook-logs`) page that displays delivery status logs (200, 500, etc.) of rule executions. In B1GCRM, the Webhook Logs page is a frontend template layout, and the backend lacks both a delivery log database table and an outgoing webhook dispatch engine.
