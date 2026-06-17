# Reference Page Audit — Agent Tasks

- **Page Purpose:** Manage task queues and workloads assigned to staff agents.
- **Page Layout:** Kanban board or task grid displaying task items grouped by status (PENDING, IN_PROGRESS, COMPLETED).
- **Navigation Structure:** User portal `/user?page=agent-task` and agent portal `/agent?page=dashboard`.
- **Tables & Lists:** Tasks table (Title, Assigned Agent, Due Date, Status, Comments, Timestamps).
- **Filters & Search:** Filter by agent, filter by due status.
- **Forms & Inputs:** Create Task form (Title, Description, Agent selection, Priority).
- **Actions:** Create task, assign task, update task status, add comments.
- **Workflows:** Tenant user creates task → database registers row → agent logs in → views task list → updates task status via dashboard.
- **API Expectations:**
  - `GET /api/agent/get_tasks`: List tenant/agent tasks
  - `POST /api/agent/update_task_status`: Update state
