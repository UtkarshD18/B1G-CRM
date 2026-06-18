# PAGE_REALITY_CLASSIFICATION.md

**Audit Date**: 2026-06-18  
**Audit Method**: Automated Puppeteer navigations (`verify-local-pages.js` logs) supplemented with manual browser checks and database verifications.

> [!NOTE]
> **False Positive Correction**: The automated Puppeteer script classified all pages as `Placeholder` because it searched for the word `"placeholder"` and triggered on the template banner message: *"Built from the verified live portal model, not a placeholder mock."* This audit corrects that classification based on actual runtime capabilities, database checks, and API interactions.

---

## 1. Page Reality Matrix

| Role | Page / Sidebar Item | Route | Classification | Runtime Evidence | Blocking Reason | Required Work |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Admin** | Dashboard | `/admin/dashboard` | **Fully Functional** | Stats render; queries database tables `user`, `orders` directly to count records. | None | None. |
| **Admin** | Manage Plans | `/admin/manage-plans` | **Partially Functional** | Renders pricing forms. Creates and deletes records in `plan` table. Edit action is broken. | Backend route bug. | Fix `POST /api/admin/update_plan` to edit plan definitions instead of modifying user plans. |
| **Admin** | Manage Users | `/admin/manage-users` | **Fully Functional** | Loads user list from `user` table. Deletes users. Auto-login token generator signs and redirects. | None | None. |
| **Admin** | Orders | `/admin/orders` | **Fully Functional** | Displays empty/seeded list of transaction logs from `orders` table. | None | None. |
| **Admin** | Settings | `/admin/settings` | **Fully Functional** | Config panels (Web, Payments, SMTP, CMS, Leads, Social) successfully read/write to `web_private` and `web_public` tables. | None | None. |
| **User** | Dashboard | `/user/dashboard` | **Fully Functional** | Renders cards and aggregates statistics (conversations, contacts, campaigns) from database. | None | None. |
| **User** | Inbox | `/user/inbox` | **External Dependency Blocked** | Displays chat container, sidebar threads, and text area. Media rendering is functional, but sending text/media throws a validation error. | Requires live Meta WhatsApp credentials to proxy messages. | Implement a mock-mode fallback for local development when Meta keys are absent. |
| **User** | Kanban | `/user/kanban` | **UI Only** | Renders contact cards in columns, but column state is not synced or saved to database. | Unfinished feature. | Implement backend endpoints to store and update Kanban card column states. |
| **User** | Contacts | `/user/contacts` | **Fully Functional** | Adds phonebooks, inserts contacts, performs bulk deletes. CSV parser imports rows from files. | None | Enhance CSV parsing error handling and validate header configurations in UI. |
| **User** | Campaigns | `/user/campaigns` | **External Dependency Blocked** | Loads logs and dashboards. Adding campaign validation fails because Meta credentials are not linked. | Requires live Meta WhatsApp credentials. | Implement local SMS/mock gateway to bypass Meta campaign validations in local mode. |
| **User** | Automation Flows | `/user/automation-flows` | **Fully Functional** | Renders interactive ReactFlow editor canvas. Adds/connects nodes and saves JSON file structures to disk (`/app/flow-json/`). | None | None. |
| **User** | ChatBot | `/user/wa-chatbot` | **Fully Functional** | Creates chatbot rules linked to automation flows, toggles active flags, and persists in `chatbot` table. | None | None. |
| **User** | Meta Templates | `/user/meta-templates` | **External Dependency Blocked** | Fails with message *"Please check your meta API keys"* on loading. | Directly requests Meta Graph API for template inventory. | Provide localized text template fallback database CRUD. |
| **User** | Integrations | `/user/integrations` | **Fully Functional** | Displays configuration variables. Saves developer credentials. | None | None. |
| **User** | Agent Login | `/user/agent-login` | **Fully Functional** | Creates agent staff profiles, deletes agents, toggles active states in `agents` table. | None | None. |
| **User** | Agent Task | `/user/agent-task` | **Fully Functional** | Creates tasks, assigns them to agent profiles, and deletes records in `agent_task` table. | None | None. |
| **User** | Chat Widget | `/user/chat-widget` | **Fully Functional** | Saves styling options, creates widgets, and serves Javascript embed. | Crash risk on large string styles. | Add payload length and format validation on styling fields. |
| **User** | Billing | `/user/billing` | **External Dependency Blocked** | Displays available plans. Starting free trials works if trial plan is defined. Stripe checkout redirects fail without credentials. | Requires API keys for Stripe, PayPal, Razorpay, or Paystack. | Connect mock payment sandbox. |
| **User** | Developer API | `/user/api-dashboard` | **Fully Functional** | Generates JWT-based API developer keys and configures webhook rule listings. | None | None. |
| **User** | Settings | `/user/settings` | **Fully Functional** | Updates name, email, profile variables, and passwords in `user` table. | None | None. |
| **Agent** | Workspace | `/agent/dashboard` | **Fully Functional** | Dashboard displays assigned chats, task completions, and agent metadata. | None | None. |
| **Agent** | Assigned Chats | `/agent/chats` | **Fully Functional** | Renders agent-specific restricted chat box console. | None | None. |

---

## 2. Summary Breakdown

*   **Total Pages Audited:** 22
*   **Fully Functional:** 15 pages (All core CRUD panels update DB rows immediately and persist on page reload).
*   **External Dependency Blocked:** 5 pages (Inbox, Campaigns, Meta Templates, Billing, and portions of Integrations fail at execution due to missing third-party keys).
*   **UI Only:** 1 page (Kanban chat board lacks database syncing).
*   **Partially Functional / Buggy:** 1 page (Admin Manage Plans creates/deletes but fails to edit plan definitions).
*   **Broken:** 0 pages (All pages successfully load without rendering React crash errors).
