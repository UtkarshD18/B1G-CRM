# Reference Page Audit — Agent Management

- **Page Purpose:** Create and manage agent logins for tenant workspace support staff.
- **Page Layout:** Portal showing list of agents, add agent form modal, and agent sitemap linkages.
- **Navigation Structure:** User portal `/user?page=agent-login`.
- **Tables & Lists:** Workspace agents table (Name, Email, Assigned Chats Count, Active Toggle, Auto-Login button).
- **Filters & Search:** Search agents by name.
- **Forms & Inputs:** Create agent form (name, email, password, active).
- **Actions:** Add agent, toggle agent active status, generate auto-login impersonation token.
- **Workflows:** Tenant user creates agent → agent row inserted in database → user clicks "Auto Login" → system signs agent JWT → redirects to agent inbox.
- **API Expectations:**
  - `POST /api/agent/add_agent`: Create agent
  - `POST /api/user/auto_agent_login`: Obtain impersonation token
