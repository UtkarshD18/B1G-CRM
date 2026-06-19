# AGENT_RUNTIME_PROOF.md

**Audit Date**: 2026-06-18  
**Verification Method**: Automated agent lifecycle checks (`verify-agent-lifecycle.js`) and PostgreSQL state inspections.

---

## 1. Agent & Task Lifecycle Matrix

| Action / Workflow | Works | Evidence | Database Persistence | Notes |
| :--- | :---: | :--- | :--- | :--- |
| **Create Agent** | ✅ **Works** | `{"msg":"Agent account was created","success":true}` | ✅ Row created in `agents` table (stores credentials, email, and mobile). | Checked globally to verify email uniqueness. |
| **Agent Login** | ✅ **Works** | Logs in using email/password. Returns signed JWT containing role: `'agent'`. | N/A (Session token verification). | Authorizes agent-specific routes successfully. |
| **Assign Task** | ✅ **Works** | `{"success":true,"msg":"Task was added"}` | ✅ Row created in `agent_task` table with status `'PENDING'`. | Binds owner ID and agent ID. |
| **Receive Task** | ✅ **Works** | Loaded in task queue during Agent query. | ✅ Reads matching records from `agent_task` table. | Agent reads where `uid = agent.uid`. |
| **Complete Task** | ✅ **Works** | `{"msg":"Task updated","success":true}` | ✅ Updates status to `'COMPLETED'` and saves `agent_comments`. | Comment is mandatory during update. |
| **Refresh Persistence** | ✅ **Works** | State persists and counts update on portal reloads. | ✅ Read from PG tables dynamically. | Both User and Agent screens reflect changes. |

---

## 2. Technical Evidence & Database Tracing

### A. Agent Row Creation Verification
Creating an agent account inserted the following record in the PostgreSQL `agents` table:
```json
{
  "id": 3,
  "owner_uid": "local-user-uid",
  "uid": "mtwTofz6LA1oIhzldEvfjvT6BK2xn9IH",
  "email": "audit-agent-178177361434@example.com",
  "password": "$2b$10$...[HASHED]",
  "role": "agent",
  "name": "Audit Agent 178177361434",
  "mobile": "+919876543210",
  "comments": "Audit temp comments",
  "is_active": 1
}
```

### B. Task Assignment Verification
Creating the task for the agent inserted the following record in the PostgreSQL `agent_task` table:
```json
{
  "id": 4,
  "owner_uid": "local-user-uid",
  "uid": "mtwTofz6LA1oIhzldEvfjvT6BK2xn9IH",
  "title": "Audit Task 1781773761535",
  "description": "Please complete the parity check validation",
  "status": "PENDING",
  "agent_comments": null
}
```

### C. Task Completion Verification
When the agent completed the task, the database successfully executed the update:
`UPDATE agent_task SET status = 'COMPLETED', agent_comments = 'Parity check completed successfully' WHERE id = 4`
DB query verification confirmed:
*   **status**: `'COMPLETED'`
*   **agent_comments**: `'Parity check completed successfully'`
*   **Cleanup**: Both agent and task records were successfully cleaned up at the end of the test.
