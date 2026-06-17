const fs = require('fs');
const path = require('path');

const targetDir = path.resolve(__dirname, '../docs/reference-pages');

if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

const pages = {
  'inbox.md': `# Reference Page Audit — Inbox

- **Page Purpose:** Core workspace for real-time customer chat management, supporting text, attachments, and quick response flows.
- **Page Layout:** 3-panel dynamic layout (Left: Chat list with tenant filter & tags; Middle: Active chat bubble thread, composer, attachments; Right: Contact meta-details, tags assignment, comments).
- **Navigation Structure:** Mounted under user portal \`/user?page=inbox\` and restricted agent portal \`/agent?page=inbox\`.
- **Tables & Lists:** Chat conversation thread list, agent assignments list, quick-reply templates list.
- **Filters & Search:** Search by contact name/number, filter by tag/label, filter by assigned agent (Unassigned, Assigned to Me, Assigned to Others).
- **Forms & Inputs:** Message composer input (textarea), quick reply selector dropdown, tag creation input, agent selector dropdown, chat note text field.
- **Actions:** Send text message, upload attachment (image/video/pdf), assign chat to agent, set chat labels/tags, save/delete chat notes.
- **Workflows:** Message ingest via Meta Cloud API webhook → Socket.IO broadcast to online tenant/assigned agent → dynamic layout update.
- **API Expectations:**
  - \`GET /api/inbox/get_chat\`: Load active chat thread list
  - \`POST /api/inbox/send_chat_message\`: Send WhatsApp text/media payload
  - \`POST /api/agent/update_agent_in_chat\`: Assign agent to chat
`,

  'campaigns.md': `# Reference Page Audit — Campaigns & Broadcasting

- **Page Purpose:** Orchestrate and monitor automated WhatsApp broadcast message campaigns.
- **Page Layout:** Master-detail list of campaigns with status cards (Sent, Pending, Failed), campaign scheduler form, and target audience selector.
- **Navigation Structure:** User portal \`/user?page=campaign-dashboard\` (for analytics) and \`/user?page=send-campaign\` (for setup).
- **Tables & Lists:** Historical campaigns table (ID, Title, Target Group, Status, Created At, Action buttons), campaign delivery log table.
- **Filters & Search:** Filter campaigns by status (QUEUE, PROCESSING, COMPLETED, FAILED), search by campaign title.
- **Forms & Inputs:** Campaign Title input, Phonebook Target selector dropdown, Meta Template selector, Scheduling datetime-picker, Timezone selector dropdown.
- **Actions:** Start campaign, pause/cancel campaign, delete campaign records, download campaign delivery analytics.
- **Workflows:** User submits broadcast schedule → loops/campaignLoop processes target phonebook contacts in chunks → invokes Meta Template API → registers delivery logs.
- **API Expectations:**
  - \`GET /api/broadcast/get_broadcasts\`: List historical campaigns
  - \`POST /api/broadcast/add_broadcast\`: Schedule a new campaign
  - \`DELETE /api/broadcast/delete_broadcast\`: Delete campaign record
`,

  'contacts.md': `# Reference Page Audit — Contacts & Phonebooks

- **Page Purpose:** Manage contact lists (phonebooks) and tenant contact records for targeting.
- **Page Layout:** Split layout (Left: Phonebooks list and import manager; Right: Contacts datatable with multi-select rows).
- **Navigation Structure:** User portal \`/user?page=phonebook\` and \`/user?page=contacts\`.
- **Tables & Lists:** Phonebooks master list (Name, Total Contacts, Actions), Contacts detail grid (Checkbox, Name, Mobile, Phonebook Name, Custom Variables var1-var5).
- **Filters & Search:** Search contacts by name or number, filter contacts by associated phonebook.
- **Forms & Inputs:** Create Phonebook form (name input), Import CSV form (phonebook dropdown, file upload input), Add Contact form (phonebook dropdown, name, mobile, variables var1-5).
- **Actions:** Create phonebook group, delete phonebook group, import CSV contact list, add single contact, bulk delete selected contacts.
- **Workflows:** User uploads CSV file → backend parses csv-parser stream → inserts contact rows tied to phonebook ID with tenant isolation check.
- **API Expectations:**
  - \`GET /api/phonebook/get_by_uid\`: List phonebooks
  - \`GET /api/phonebook/get_uid_contacts\`: Fetch contacts
  - \`POST /api/phonebook/add\`: Create phonebook
  - \`POST /api/phonebook/import_contacts\`: Stream CSV uploads
  - \`POST /api/phonebook/del_contacts\`: Bulk delete
`,

  'automation_flows.md': `# Reference Page Audit — Automation Flows

- **Page Purpose:** Build and save visual chatbot automation diagrams.
- **Page Layout:** Drag-and-drop workspace canvas using React Flow, sidebar menu containing node types (Trigger, Send Message, Set Condition, Call API), and properties editor panel.
- **Navigation Structure:** User portal \`/user?page=automation-flows\`.
- **Tables & Lists:** Saved automation flows list (Flow Title, Active State, Date Updated, Actions).
- **Filters & Search:** Search saved flows by name.
- **Forms & Inputs:** Flow properties form, Node properties editor (Message template selection, variable mappings, API endpoint, routing keys).
- **Actions:** Add node, connect nodes, delete connection, edit node parameters, save flow JSON, load flow JSON, delete flow.
- **Workflows:** User saves flow → client serializes nodes/edges JSON → backend stores flow config on disk under \`/flow-json\` and triggers in memory.
- **API Expectations:**
  - \`GET /api/chat_flow/get_flows\`: List user flows
  - \`POST /api/chat_flow/save_flow\`: Persist flow nodes and edges
  - \`DELETE /api/chat_flow/delete_flow\`: Remove flow
`,

  'chatbot.md': `# Reference Page Audit — Chatbot Diagnostics

- **Page Purpose:** Manage auto-reply WhatsApp bot settings and view real-time diagnostics.
- **Page Layout:** Dashboard containing active chatbot triggers list, chatbot diagnostics log grid, and trigger details panel.
- **Navigation Structure:** User portal \`/user?page=wa-chatbot\`.
- **Tables & Lists:** Chatbot triggers table, Chatbot logs table (Time, Incoming Message, Matched Rule, Bot Response, Delivery Status).
- **Filters & Search:** Filter diagnostics by chatbot ID, filter logs by status (matched, unmatched, failed).
- **Forms & Inputs:** Chatbot CRUD form (title, trigger words input, target phonebook dropdown, automation flow dropdown, status toggle).
- **Actions:** Toggle bot active state, create trigger, delete trigger, view execution logs details.
- **Workflows:** Meta Webhook ingest → chatbot processor reads active flow → evaluates keywords → triggers automatic response → writes database row in \`chatbot_log\`.
- **API Expectations:**
  - \`GET /api/chatbot/get_bots\`: Fetch tenant bots
  - \`GET /api/chatbot/get_logs\`: Fetch bot diagnostic history
  - \`POST /api/chatbot/add\`: Save chatbot rule
`,

  'billing.md': `# Reference Page Audit — Billing

- **Page Purpose:** Manage subscription plans, checkouts, payment receipts, and billing cycles.
- **Page Layout:** Portal displaying active plan limits (progress bars), payment gateway pricing cards, and invoice lists.
- **Navigation Structure:** User portal \`/user?page=billing\`.
- **Tables & Lists:** Invoice history table (Order ID, Plan Title, Amount, Payment Gateway, Date, Status, Receipt link).
- **Filters & Search:** None.
- **Forms & Inputs:** Pricing checkout selection, Stripe Checkout form iframe, offline payment invoice upload.
- **Actions:** Start free trial, upgrade/downgrade subscription, download receipt, select billing frequency.
- **Workflows:** User checks out → creates Stripe Session → upgrades user plan model JSON on payment webhook callback.
- **API Expectations:**
  - \`POST /api/user/create_stripe_session\`: Initialize Stripe checkout
  - \`POST /api/user/start_free_trial\`: Start trial
`,

  'integrations.md': `# Reference Page Audit — Integrations & API Keys

- **Page Purpose:** Expose developer credentials, REST API keys, and webhook endpoints to link third-party apps.
- **Page Layout:** Cards layout showing API Secret token panel, Webhook URL destination configuration form, and webhook rule settings.
- **Navigation Structure:** User portal \`/user?page=api-dashboard\` and \`/user?page=manage-webhooks\`.
- **Tables & Lists:** Webhook automation rules list (Rule Name, Event, Trigger Condition, Action Payload, Status).
- **Filters & Search:** None.
- **Forms & Inputs:** Generate API Key form, Webhook rules CRUD form (Name, Event Type, Match Field, Operator, Action Type, Payload).
- **Actions:** Generate new API key, copy webhook destination URL, add webhook rule, delete rule, toggle rule active.
- **Workflows:** System registers incoming webhook/message → evaluates webhook rules in database → triggers payload to registered target endpoint.
- **API Expectations:**
  - \`GET /api/user/generate_api_keys\`: Generate/refresh API secret
  - \`POST /api/webhooks/rules\`: Add webhook rule
`,

  'agent_login.md': `# Reference Page Audit — Agent Management

- **Page Purpose:** Create and manage agent logins for tenant workspace support staff.
- **Page Layout:** Portal showing list of agents, add agent form modal, and agent sitemap linkages.
- **Navigation Structure:** User portal \`/user?page=agent-login\`.
- **Tables & Lists:** Workspace agents table (Name, Email, Assigned Chats Count, Active Toggle, Auto-Login button).
- **Filters & Search:** Search agents by name.
- **Forms & Inputs:** Create agent form (name, email, password, active).
- **Actions:** Add agent, toggle agent active status, generate auto-login impersonation token.
- **Workflows:** Tenant user creates agent → agent row inserted in database → user clicks "Auto Login" → system signs agent JWT → redirects to agent inbox.
- **API Expectations:**
  - \`POST /api/agent/add_agent\`: Create agent
  - \`POST /api/user/auto_agent_login\`: Obtain impersonation token
`,

  'agent_task.md': `# Reference Page Audit — Agent Tasks

- **Page Purpose:** Manage task queues and workloads assigned to staff agents.
- **Page Layout:** Kanban board or task grid displaying task items grouped by status (PENDING, IN_PROGRESS, COMPLETED).
- **Navigation Structure:** User portal \`/user?page=agent-task\` and agent portal \`/agent?page=dashboard\`.
- **Tables & Lists:** Tasks table (Title, Assigned Agent, Due Date, Status, Comments, Timestamps).
- **Filters & Search:** Filter by agent, filter by due status.
- **Forms & Inputs:** Create Task form (Title, Description, Agent selection, Priority).
- **Actions:** Create task, assign task, update task status, add comments.
- **Workflows:** Tenant user creates task → database registers row → agent logs in → views task list → updates task status via dashboard.
- **API Expectations:**
  - \`GET /api/agent/get_tasks\`: List tenant/agent tasks
  - \`POST /api/agent/update_task_status\`: Update state
`,

  'chat_widget.md': `# Reference Page Audit — Chat Widget

- **Page Purpose:** Configure the JavaScript chat widget for external customer embedding.
- **Page Layout:** Widget configurations settings panel with visual widget preview mock.
- **Navigation Structure:** User portal \`/user?page=chat-widget\`.
- **Tables & Lists:** Registered widgets list.
- **Filters & Search:** None.
- **Forms & Inputs:** Title input, WhatsApp Number input, Logo upload input, Layout alignment dropdown, Widget size number input.
- **Actions:** Create widget config, upload logo, generate JS embed script copy.
- **Workflows:** User embeds JS snippet → snippet connects to backend sockets → exposes customer support chat portal.
- **API Expectations:**
  - \`POST /api/user/add_chat_widget\`: Save widget config
  - \`GET /api/user/get_widgets\`: List configurations
`,

  'admin_plans.md': `# Reference Page Audit — Super-Admin Plans CRUD

- **Page Purpose:** Manage SaaS pricing tiers, feature gates, and account limits globally.
- **Page Layout:** Plans data table and plan editor property sheet.
- **Navigation Structure:** Admin portal \`/admin?page=manage-plans\`.
- **Tables & Lists:** SaaS Plans grid (Plan Title, Price, Billing Interval, Trial Duration, Max Contacts).
- **Filters & Search:** None.
- **Forms & Inputs:** Plan details form (title, description, price, contact limit, trial duration, checkboxes for Chatbot, API, Notes, Tags).
- **Actions:** Create plan tier, edit plan, delete plan, toggle trial plan.
- **Workflows:** Admin saves plan → updates \`plan\` database table → plans options updated on public site registration page.
- **API Expectations:**
  - \`GET /api/admin/get_plans\`: List plans
  - \`POST /api/admin/add_plan\`: Save plan config
`,

  'admin_users.md': `# Reference Page Audit — Super-Admin Users Management

- **Page Purpose:** Manage registered tenant accounts, assign subscriptions, and impersonate workspaces.
- **Page Layout:** Users datatable with plan overrides panel.
- **Navigation Structure:** Admin portal \`/admin?page=manage-users\`.
- **Tables & Lists:** Users datatable (UID, Name, Email, Active Plan, Expiry, Auto-Login button).
- **Filters & Search:** Search users by name/email, filter by subscription plan.
- **Forms & Inputs:** Edit user subscription details (Plan select dropdown, expiry date picker, trial toggle).
- **Actions:** Edit user plan, suspend/deactivate user, auto-login impersonation bypass.
- **Workflows:** Admin clicks auto-login → signs JWT payload for user uid → opens user dashboard portal in new tab.
- **API Expectations:**
  - \`GET /api/admin/get_users\`: List users
  - \`POST /api/admin/update_user_plan\`: Override plan details
`,

  'admin_orders.md': `# Reference Page Audit — Super-Admin Orders List

- **Page Purpose:** Track transaction records and checkout logs globally.
- **Page Layout:** Grid detailing recent orders, payment receipts, and billing statuses.
- **Navigation Structure:** Admin portal \`/admin?page=orders\`.
- **Tables & Lists:** Order list datatable (Transaction ID, Tenant Name, Plan, Amount, Gateway, Date, Status).
- **Filters & Search:** Filter orders by status (PAID, PENDING, REFUNDED), search by transaction ID.
- **Forms & Inputs:** Order status override selector.
- **Actions:** Override payment status, verify manual invoice.
- **Workflows:** Gateway callback verifies transaction → registers order database row → upgrades client workspace limits.
- **API Expectations:**
  - \`GET /api/admin/get_orders\`: List transaction order logs
`,

  'admin_settings.md': `# Reference Page Audit — Super-Admin Site Settings

- **Page Purpose:** Global super-admin settings panel for gateway tokens, SMTP servers, legal documents, FAQ, testimonials, and translation JSON packages.
- **Page Layout:** Sidebar settings tabs panel with settings editor sheet.
- **Navigation Structure:** Admin portal settings slugs (\`/admin?page=site-settings\`, \`/admin?page=smtp\`, \`/admin?page=payment-gateways\`, \`/admin?page=faq\`, \`/admin?page=testimonial\`, \`/admin?page=translation\`).
- **Tables & Lists:** Faq entries list, Partners logo list, Testimonials grid.
- **Filters & Search:** None.
- **Forms & Inputs:** Site name, currency select, logo uploader, Payment gateways settings (Stripe API Keys, Razorpay Keys, SMTP credentials), translation JSON editor, Legal documents editor.
- **Actions:** Update gateway keys, verify SMTP connection test email, add FAQ, update testimonials, save translations.
- **Workflows:** Admin updates theme/translations → writes JSON assets on server filesystem → public endpoints stream localized pages.
- **API Expectations:**
  - \`GET /api/admin/get_settings\`: Load global configuration
  - \`POST /api/admin/update_settings\`: Save config values
`,

  'master_index.md': `# Master Reference Feature Index

Comprehensive inventory of features compiled from the reference CRM platform, categorized by system surfaces.

| Category | Reference Feature | Page Link (Slug) | Parity Priority |
| --- | --- | --- | --- |
| **Dashboard** | Tenant KPI metrics (active chats, tasks, WA accounts) | \`dashboard\` | High |
| **Inbox** | Real-time chat console with agent assignment & tags | \`inbox\` | High |
| **Inbox** | Kanban chat board (assigned status progression) | \`kanban\` | Medium |
| **Campaigns** | Bulk WhatsApp broadcasting loop & delivery statistics | \`campaign-dashboard\` | High |
| **Contacts** | Phonebook segmentation & CSV contacts importer | \`phonebook\` | High |
| **Automation** | Node-based visual chat flow designer | \`automation-flows\` | High |
| **Chatbot** | Text trigger chatbots and logs diagnostics | \`wa-chatbot\` | High |
| **Widgets** | Javascript embed chat widget builder | \`chat-widget\` | Medium |
| **Integrations** | API keys generation & manage webhook rules | \`api-dashboard\` | High |
| **Integrations** | Webhook delivery logs & execution engine | \`webhook-logs\` | Medium |
| **Billing** | Pricing plans subscription & Stripe checkouts | \`billing\` | High |
| **Team Management** | Agent logins CRUD & tenant impersonation | \`agent-login\` | High |
| **Team Management** | Agent task queue Kanban board | \`agent-task\` | Medium |
| **Settings** | Public CMS settings (Partners, FAQ, Pages, Testimonials) | \`settings\` (Admin) | Medium |
| **Settings** | Payment gateways credentials (Stripe, Razorpay) | \`payment-gateways\` (Admin) | High |
`
};

for (const [filename, content] of Object.entries(pages)) {
  const filePath = path.join(targetDir, filename);
  fs.writeFileSync(filePath, content.trim() + '\n', 'utf8');
}

console.log('Successfully generated all reference pages under docs/reference-pages/');
