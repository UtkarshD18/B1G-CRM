# FLOW_RUNTIME_PROOF.md

**Audit Date**: 2026-06-18  
**Verification Method**: Automated endpoint execution (`verify-automation-flows.js`), Postgres state checks, and filesystem cleanup validations inside Docker container volumes.

---

## 1. Automation Flows CRUD Lifecycle Matrix

| Action | Works | Evidence | DB Persistence | Filesystem JSON Storage | API Endpoint | Notes |
| :--- | :---: | :--- | :--- | :--- | :--- | :--- |
| **Create Flow** | ✅ **Works** | `{"success":true,"msg":"Flow was saved"}` | ✅ Row created in `flow` table. | ✅ Serialized graph coordinates written to `/app/flow-json/nodes/` and `/app/flow-json/edges/`. | `POST /api/chat_flow/add_new` | Generates a unique UUID `flowId`. |
| **Save / Reload** | ✅ **Works** | Loaded node count matching UI layout. | ✅ Reads metadata from `flow` table. | ✅ Reads graph details from JSON files. | `POST /api/chat_flow/get_by_flow_id` | Verifies and parses edge/node properties correctly. |
| **Edit / Update** | ✅ **Works** | `{"success":true,"msg":"Flow was saved"}` | ✅ Updates title in `flow` table. | ✅ Overwrites graph detail files on disk. | `POST /api/chat_flow/add_new` | Evaluates matching `flowId` for updates. |
| **Delete Flow** | ✅ **Works** | `{"success":true,"msg":"Flow was deleted"}` | ✅ Row removed from `flow` table. | ✅ Removes JSON files using `deleteFileIfExists()`. | `POST /api/chat_flow/del_flow` | Cleans up database records and filesystem allocations. |

---

## 2. Technical Evidence & Logs Tracing

### A. Flow Database Record Creation
During the audit, creation generated the following record in the PostgreSQL `flow` table:
*   **Row Output**:
    ```json
    {
      "id": 3,
      "uid": "local-user-uid",
      "flow_id": "audit-flow-1781773735412",
      "title": "Audit Flow 1781773735412",
      "prevent_list": null,
      "ai_list": null,
      "createdat": "2026-06-18T09:08:55.417Z",
      "updatedat": "2026-06-18T09:08:55.417Z"
    }
    ```

### B. Filesystem JSON Serialization
Inside the docker container, coordinates are persisted at:
*   **Nodes**: `/app/flow-json/nodes/local-user-uid/audit-flow-1781773735412.json`
*   **Edges**: `/app/flow-json/edges/local-user-uid/audit-flow-1781773735412.json`
*   **Volumetric Persistence**: Safe (mounted via named volume `app-flow-json:/app/flow-json`).

### C. Structure Integrity & Deletion Cleanup
*   **Reload integrity**: Querying `POST /api/chat_flow/get_by_flow_id` returned:
    `{"nodes": [{"id": "1", "type": "START", "data": {"label": "Start"}}], "edges": [], "success": true}`
*   **Cleanup Verification**: Running `ls /app/flow-json/nodes/local-user-uid/audit-flow-1781773735412.json` after delete returns *No such file or directory*, confirming file storage space is reclaimed dynamically on deletion.
