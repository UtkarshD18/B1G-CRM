# AGENT_RUNTIME_AUDIT.md

**Audit Date**: 2026-06-18  
**Audit Method**: Real-time HTTP API verification, PostgreSQL database query verification, agent session generation, and task lifecycle tracking.

---

## 1. Agent Feature Audit Matrix

| Action / Workflow | Works | Evidence | Database Persistence | API Endpoint | Notes |
| :--- | :---: | :--- | :--- | :--- | :--- |
| **Create Agent** | ✅ **Works** | `{"success":true,"msg":"Agent account was created"}` | ✅ Row inserted into `agents` table (stores hashed password, comments, uid, name, mobile, active status). | `POST /api/agent/add_agent` | Validates duplicate emails globally before inserting. |
| **Edit Agent** | ✅ **Works** | `{"msg":"Agent profile was updated","success":true}` | ✅ Updates `email`, `name`, `mobile`, and `password` columns in `agents` table. | `POST /api/user/update_agent_profile` | Supports optional password hashing updates. |
| **Delete Agent** | ✅ **Works** | `{"success":true,"msg":"Agent was deleted"}` | ✅ Deletes the corresponding row from the `agents` table. | `POST /api/agent/del_agent` | Cascade deletes agent chats and tasks in PostgreSQL. |
| **Agent Login** | ✅ **Works** | JWT token signed with JWT_SECRET containing `{uid, role: "agent", email, owner_uid}` payload. | N/A (Session-only token verification). | `POST /api/agent/login` | Uses bcrypt password comparison. |
| **Agent Task Create** | ✅ **Works** | `{"success":true,"msg":"Task was added"}` | ✅ Row inserted into `agent_task` table with status `'PENDING'`. | `POST /api/user/add_task_for_agent` | Requires `title`, `des`, and target `agent_uid`. |
| **Agent Task Read** | ✅ **Works** | Renders list with tasks assigned to agent. | ✅ Query performs a JOIN on `agent_task` and `agents` tables. | `GET /api/user/get_my_agent_tasks` (User) & `GET /api/agent/get_my_task` (Agent) | Filtered by owner_uid for user, or uid for agent. |
| **Agent Task Complete** | ✅ **Works** | `{"msg":"Task updated","success":true}` | ✅ Updates `status` to `'COMPLETED'` and saves `agent_comments` in `agent_task`. | `POST /api/agent/mark_task_complete` | Comments are mandatory during update submission. |
| **Agent Auto-Login** | ✅ **Works** | Renders impersonation JWT. Opens `/agent/login?token=<jwt>` dynamically. | N/A (Generates signing block at runtime). | `POST /api/user/auto_agent_login` | Allows tenant admins to test agent interfaces instantly. |

---

## 2. Agent Workflow Walkthrough

### A. Roster & Profile Management (Tenant-to-Agent)
Admins register new agents via `/user/agent-login`. Form fields submit data to the backend `agents` table. The backend checks if the username/email exists elsewhere. Agent accounts are disabled or enabled dynamically using:
*   `POST /api/agent/change_agent_activeness` (updates `is_active = 0` or `1`).

### B. Task Life-Cycle (Tenant-to-Agent-to-DB)
1.  **Creation**: The tenant admin creates a task on the `Agent Tasks` screen. The record is created in `agent_task` binding `owner_uid` (tenant) and `uid` (agent).
2.  **Notification / Loading**: When the agent logs in, the client issues a `GET /api/agent/get_my_task` API call. The backend retrieves records where `agent_task.uid = agent.uid`.
3.  **Completion**: The agent inputs comments in the task interface and clicks **Complete**. The backend issues `POST /api/agent/mark_task_complete`, transitioning the DB column `status` to `'COMPLETED'`.
4.  **Admin Inspection**: The tenant views the updated status and agent comments under their dashboard view.
