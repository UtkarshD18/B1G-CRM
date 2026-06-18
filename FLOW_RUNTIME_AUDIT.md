# FLOW_RUNTIME_AUDIT.md

**Audit Date**: 2026-06-18  
**Audit Method**: Visual flow canvas configuration execution, API response testing, and JSON file verification in Docker mounts.

---

## 1. Automation Flows Feature Matrix

| Feature | Works | Evidence | Database Persistence | Filesystem Persistence | API Endpoint | Notes |
| :--- | :---: | :--- | :--- | :--- | :--- | :--- |
| **Create Flow** | ✅ **Works** | Creates interactive canvas object, maps UI nodes/edges coordinates in ReactFlow. | ✅ Row added in `flow` table (cols: `uid`, `flow_id`, `title`). | ✅ Nodes written to `/app/flow-json/nodes/<uid>/<flowId>.json`. Edges written to `/app/flow-json/edges/<uid>/<flowId>.json`. | `POST /api/chat_flow/add_new` | Saves name, generates unique UUID flowId. |
| **Save / Update Flow** | ✅ **Works** | `{"success":true,"msg":"Flow was saved"}` | ✅ Updates title in `flow` table. | ✅ Overwrites nodes and edges JSON files on disk. | `POST /api/chat_flow/add_new` | Acts as an upsert based on `flowId` matching. |
| **Reload Flow** | ✅ **Works** | Retains node coordinates and editor properties. | ✅ Queries `flow` table to assert ownership. | ✅ Reads and parses node/edge JSON files. | `POST /api/chat_flow/get_by_flow_id` | Renders flow canvas exactly as saved. |
| **Delete Flow** | ✅ **Works** | `{"success":true,"msg":"Flow was deleted"}` | ✅ Deletes corresponding row from `flow` table. | ✅ Removes node/edge JSON files via `deleteFileIfExists()`. | `POST /api/chat_flow/del_flow` | Cleans up both DB and file system records. |
| **Execute Flow** | ⚠️ **Conditional** | Webhook processes matching text commands and returns node-configured replies. | ✅ Appends contact state updates to logs if chatbot fires. | N/A | Triggered via `/api/inbox/webhook/:uid` | Flow execution only operates when bound to an active Chatbot trigger. |

---

## 2. Core Technical Findings

### A. Dual Persistence Model (DB + Disk JSON)
B1GCRM implements a hybrid persistence model for flows:
1.  **Metadata**: Stored in PostgreSQL `flow` table.
2.  **Structural Graph**: Saved as serialized JSON on disk under `/app/flow-json/nodes/` and `/app/flow-json/edges/`.
*   **Implication**: If folders are not persistent (i.e. not mounted via a Docker volume like `flow-json-mount:/app/flow-json`), restarting a container retains the flow titles in the UI but rendering the canvas triggers a backend file-not-found error, resulting in blank workspaces.

### B. Flow Execution Architecture
Execution is triggered by incoming webhooks (e.g. WhatsApp messages). The inbound payload runs through the message processor, checks active rules in the `chatbot` table, loads the associated flow, reads the `flowId.json` coordinates, finds the entry node (usually "Start"), evaluates decisions, and sends the configured response back to the client.
