# WEBHOOK_RUNTIME_PROOF.md

**Audit Date**: 2026-06-18  
**Audit Method**: REST API CRUD, PostgreSQL Database Verification, and System Tracing.

---

## 1. Webhook Automation Feature Matrix

| Phase / Test Case | Works | Evidence / Result | DB Persistence | API Endpoint | Notes |
| :--- | :---: | :--- | :--- | :--- | :--- |
| **Create Webhook Rule** | ✅ **Works** | Returns `{"success":true,"msg":"Webhook rule created","data":{...}}`. | ✅ Row created in `webhook_rules` table. | `POST /api/webhooks/rules` | Rules validate matching fields and action formats. |
| **Read Webhook Rules** | ✅ **Works** | Returns list of configured webhook rules. | ✅ Reads from `webhook_rules` table. | `GET /api/webhooks/rules` | Displays rules sorted by creation time. |
| **Update Webhook Rule** | ✅ **Works** | Returns `{"success":true,"msg":"Webhook rule updated","data":{...}}`. | ✅ Updates corresponding row in `webhook_rules`. | `POST /api/webhooks/rules/update` | Successfully edits operators and active states. |
| **Delete Webhook Rule** | ✅ **Works** | Returns `{"success":true,"msg":"Webhook rule deleted"}`. | ✅ Deletes row from `webhook_rules` table. | `POST /api/webhooks/rules/delete` | |
| **Trigger Rule Execution** | ❌ **Broken** | Rules are never evaluated when incoming messages are processed. | N/A | None | **Missing Engine**: Rules are never checked or triggered. |
| **Confirm Expected Action** | ❌ **Broken** | No actions are executed. | N/A | None | No outgoing webhooks or tags are dispatched. |

---

## 2. Codebase Tracing & Missing Execution Engine

A comprehensive codebase trace confirms that the webhook automation rules are fully disconnected from incoming webhooks.

### A. The Ingest Entry Point
Incoming webhook requests from Meta (WhatsApp) hit:
*   [routes/inbox.js](routes/inbox.js#L26-L83) -> `router.post("/webhook/:uid")`

This endpoint triggers message processing:
*   [helper/inbox/inbox.js](helper/inbox/inbox.js#L59-L152) -> `processMessage()`

### B. The Process Flow
Inside `processMessage()`, the logic splits into:
*   `processMetaMessage()` for origin `meta`
*   `processMessageQr()` for origin `qr`
*   `metaChatbotInit()` for initializing chatbots.

### C. Missing Code Path
There is **no database query or handler** referencing the `webhook_rules` table in either:
*   [routes/inbox.js](routes/inbox.js)
*   [helper/inbox/inbox.js](helper/inbox/inbox.js)
*   [helper/inbox/meta/index.js](helper/inbox/meta/index.js)

### D. Exact Missing Files/Tables
1.  **Webhook Outbound Client (Dispatcher)**: A helper tool to dispatch HTTP requests (`axios.post`) is entirely missing.
2.  **Webhook Delivery Logs Table**: The `webhook_logs` table (referenced in reference pages `/user?page=webhook-logs`) does not exist in the schema, making audit trails of outgoing webhooks impossible to store or display.

---

## 3. Database Proof

Verification from direct PostgreSQL audit run:
```json
{
  "crud": {
    "create": {
      "successResponse": true,
      "persistedInDb": true
    },
    "read": {
      "success": true,
      "count": 1
    },
    "update": {
      "successResponse": true,
      "activeValInDb": 0
    },
    "delete": {
      "successResponse": true,
      "removedFromDb": true
    }
  },
  "trigger": {
    "engineStatus": "Missing",
    "webhookLogsTableExists": false
  }
}
```
