# B1GCRM Reachable Routes & Status (WORKING_PAGES.md)

This document contains a comprehensive index of all reachable frontend page routes and portal pages, their purpose, backend dependency integrations, and active implementation statuses verified through local runtime testing.

---

## 1. Public & Authentication Routes

| Route | Purpose | Status | Dependencies | Notes |
| --- | --- | --- | --- | --- |
| \`/\` | Public landing page and marketing site. | **Working** (Static) | None | Displays product values, pricing tiers, and testimonial grids. |
| \`/signin\` | Select auth role to navigate. | **Working** | None | Landing chooser directing to Admin, User, or Agent sign-in. |
| \`/login\` | Unified sign-in page. | **Working** | None | Handles universal user credentials sign-in. |
| \`/user/signup\` | Registration page for new tenant signups. | **Working** | \`POST /api/user/signup\` | Inserts new tenant accounts into PostgreSQL user table. |
| \`/admin/login\` | Global SaaS super-admin login. | **Working** | \`POST /api/admin/login\` | Signs global admin JWT. |
| \`/user/login\` | Tenant workspace login. | **Working** | \`POST /api/user/login\` | Signs tenant workspace user JWT. |
| \`/agent/login\` | Support/Sales agent staff login. | **Working** | \`POST /api/agent/login\` | Signs restricted agent JWT. |

---

## 2. Super-Admin Portal Routes (Accessible via \`/admin?page=<slug>\`)

| Slug / Page Route | Purpose | Status | Dependencies | Notes |
| --- | --- | --- | --- | --- |
| \`dashboard\` | Overview of users, plans, and order counts. | **Working** | \`GET /api/admin/get_dashboard_for_user\` | Displays tenant metrics card grids. |
| \`manage-plans\` | SaaS plans creator and limits editor. | **Working** | \`GET /api/admin/get_plans\`<br>\`POST /api/admin/add_plan\` | Full plan CRUD. |
| \`manage-users\` | List tenants, assign plans, and impersonate. | **Working** | \`GET /api/admin/get_users\`<br>\`POST /api/admin/update_user_plan\` | Includes "Auto Login" to launch tenant portal. |
| \`orders\` | Global SaaS sales logs. | **Working** | \`GET /api/admin/get_orders\` | Displays invoice details. |
| \`settings\` / \`site-settings\` | Configure app details, SMTP, and gateways. | **Working** | \`GET /api/admin/get_settings\`<br>\`POST /api/admin/update_settings\` | Consolidates SMTP, Stripe keys, and logo upload. |
| \`front-partner\` / \`faq\` / \`testimonial\` | Manage homepage landing section items. | **Working** | Admin settings API | Configures public landing CMS. |
| \`flow-builder-template\` | Build chatbot templates globally. | **Mocked** | Reference page | Renders Planned placeholder details. |
| \`qr-plugin-settings\` | Manage global QR session settings. | **Mocked** | Reference page | Planned placeholder. |
| \`instagram-config\` / \`telegram-config\` | Third-party messaging provider keys. | **Mocked** | Reference page | Planned placeholder. |
| \`web-notification\` / \`send-web-push\` | Set up push credentials and trigger alerts. | **Mocked** | Reference page | Planned placeholder. |
| \`embed-config\` | Setup WA embedded login OAuth parameters. | **Mocked** | Reference page | Planned placeholder. |

---

## 3. Tenant User Portal Routes (Accessible via \`/user?page=<slug>\`)

| Slug / Page Route | Purpose | Status | Dependencies | Notes |
| --- | --- | --- | --- | --- |
| \`dashboard\` | Tenant workspace metrics and charts. | **Working** | \`GET /api/user/get_dashboard_details\` | Displays chatbot, task, and chat metrics. |
| \`inbox\` | 3-panel realtime messaging console. | **Working** | \`GET /api/inbox/get_chat\`<br>Socket.IO events | Real-time messages via sockets and Meta Webhooks. |
| \`kanban\` / \`kabnan\` | Group active chats by status label. | **Working** | \`GET /api/inbox/get_chat\` | Kanban board layout. |
| \`phonebook\` / \`contacts\` | Group management, single add, and CSV importer. | **Working** | \`GET /api/phonebook/*\`<br>\`POST /api/phonebook/import_contacts\` | Full contact database. Handles CSV streams. |
| \`campaigns\` / \`send-campaign\` | Setup broadcasts and monitor statistics. | **Working** | \`GET /api/broadcast/*\` | Communicates with campaign scheduling loops. |
| \`automation-flows\` | React Flow canvas drag/drop diagrams editor. | **Working** | \`GET /api/chat_flow/get_flows\`<br>\`POST /api/chat_flow/save_flow\` | Saves node/edge configs as JSON on disk. |
| \`wa-chatbot\` / \`chatbot\` | Keywords auto-reply CRUD and log diagnostic viewer. | **Working** | \`GET /api/chatbot/*\` | Links to \`chatbot_log\` database table logs. |
| \`integrations\` / \`link-meta-whatsapp\` | Meta app API credentials configurator. | **Working** | \`POST /api/user/save_meta_whatsapp\` | Primary WhatsApp Cloud gateway. |
| \`add-whatsapp-qr\` | Scan QR to register Baileys WhatsApp connection. | **Mocked** | Reference page | Helper module is stubbed; UI form is placeholder. |
| \`agent-login\` | Support agent accounts builder and impersonation. | **Working** | \`GET /api/agent/get_my_agents\` | Tenant can "Auto Login" to jump into Agent portal. |
| \`agent-task\` | Assign task cards and due dates to agents. | **Working** | \`GET /api/agent/get_tasks\` | Integrates with agent dashboard Kanban. |
| \`chat-widget\` | Generate custom website JS chat bubble snippet. | **Working** | \`POST /api/user/add_chat_widget\` | Renders logo and embed-code copy buttons. |
| \`billing\` | Check active plan status and purchase upgrades. | **Working** | \`POST /api/user/create_stripe_session\` |Pricing tiers; redirects to Stripe checkout. |
| \`api-dashboard\` / \`rest-api\` | Expose API tokens and developer documentation. | **Working** | \`GET /api/user/generate_api_keys\` | Displays API calls code snippet samples. |
| \`manage-webhooks\` | Create webhook notification automation rules. | **Working** | \`POST /api/webhooks/rules\` | CRUD for webhook dispatch hooks. |
| \`create-meta-template\` | Create WhatsApp message template payloads. | **Working** | Meta template APIs | Creates payload structures. |
| \`settings\` | Update tenant workspace local timezone. | **Working** | \`POST /api/user/update_timezone\` | Settings editor. |
| \`whatsapp-forms\` / \`whatsapp-warmer\` | Pre-built forms and warming sequencers. | **Mocked** | Reference page | Planned placeholder. |
| \`link-instagram\` / \`insta-dm-bot\` | Instagram messenger automation managers. | **Mocked** | Reference page | Planned placeholder. |
| \`create-call-flow\` / \`wa-call-logs\` | AI Voice calling setup dashboards. | **Mocked** | Reference page | Planned placeholder. |
| \`telegram-sessions\` | Setup Telegram session credentials. | **Mocked** | Reference page | Planned placeholder. |

---

## 4. Agent Portal Routes (Accessible via \`/agent?page=<slug>\`)

| Slug / Page Route | Purpose | Status | Dependencies | Notes |
| --- | --- | --- | --- | --- |
| \`dashboard\` | List assigned tasks, profiles, and chats. | **Working** | \`GET /api/agent/get_my_tasks\` | Agent workspace. |
| \`inbox\` | Restricted inbox layout for assigned chats. | **Working** | \`GET /api/agent/get_my_assigned_chats\` | Gated by validateAgent middleware; hides others. |
