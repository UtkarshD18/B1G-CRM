# REFERENCE_GAP_REFINEMENT.md

**Audit Date**: 2026-06-18  
**Audit Purpose**: Complete sitemap feature comparison between B1GCRM and the live Reference CRM (`https://crm.oneoftheprojects.com`), documenting gaps, behaviors, and priorities.

---

## 1. Authentication Entry Points

| URL | Role | Description | Classification | Gaps / Evidence |
| :--- | :---: | :--- | :--- | :--- |
| `/user/login` | User | Tenant credentials portal | **Parity Complete** | Renders correctly, authenticates and handles JWT sessions. |
| `/admin/login` | Admin | Super-admin access portal | **Parity Complete** | Validates credentials, sets session headers. |
| `/agent/login` | Agent | Roster staff entry point | **Parity Complete** | Handles agent task workspace authentication. |

---

## 2. User Portal — Authenticated Pages

| Page / Route | Reference Feature | Current B1GCRM Behavior | Classification | Gaps / Evidence | Priority |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `/user?page=dashboard` | Tenant KPI cards, data aggregation, charts. | Fetches count totals from DB, renders line chart. | **Parity Complete** | Matches layout exactly. | Low |
| `/user?page=inbox` | 3-panel chat box, thread history, composer, notes, assignments. | Renders bubbles for text, images, videos, audio, documents. Notes/assignments sync. | **Functional But Different** | Missing Telegram/Instagram channels in list. File uploads save to container media. | High |
| `/user?page=kanban` | Drag-and-drop Kanban board grouping chats by status. | Renders visual cards and columns. | **Placeholder** | Drag actions are visual-only; status column changes do not persist in DB. | Medium |
| `/user?page=phonebook` | Phonebook group manager + CSV import + contact CRUD. | Full contact/phonebook CRUD works. CSV imports rows. | **Parity Complete** | Lacks import progress alerts on UI. | Low |
| `/user?page=campaigns` | Broadcast campaign workspace. | CRUD is functional, dashboard aggregates logs. | **Functional But Different** | Requires active Meta API credentials. Sandbox mode / mock loops are missing. | High |
| `/user?page=automation-flows` | Visual node-based flow designer. | ReactFlow canvas saves/loads JSON files correctly. | **Parity Complete** | Saves configurations to `flow-json/` directory. | Low |
| `/user?page=wa-chatbot` | Chatbot CRUD mapping flows to chat targets. | Rules bind flows, status active flags persist in database. | **Parity Complete** | DB queries verify status updates. | Low |
| `/user?page=create-meta-template` | Message template builder. | Form inputs render. Creation requests call Meta Graph API. | **Functional But Different** | Fails without active Meta credentials. | Medium |
| `/user?page=integrations` | Connectivity switches (QR, Meta, Instagram, Telegram). | Shows connection cards. | **Placeholder** | Instagram and Telegram buttons are inactive. QR points to stub page. | High |
| `/user?page=add-whatsapp-qr` | Baileys QR session linking. | Renders QR page UI. | **Placeholder** | QR library and backend logic are stubbed. | High |
| `/user?page=link-meta-whatsapp` | Meta Business credentials form. | Form saves tokens to `meta_api` table. | **Parity Complete** | Saves tokens successfully. | Low |
| `/user?page=link-instagram` | Instagram DM config. | Inactive. | **Placeholder** | Stub page. | Low |
| `/user?page=whatsapp-warmer` | Number warmup sequencer. | Inactive. | **Placeholder** | Stub page. | Low |
| `/user?page=whatsapp-forms` | Lead form builder. | Inactive. | **Placeholder** | Stub page. | Low |
| `/user?page=agent-login` | Agent accounts CRUD. | Stores agents, deletes logins, signs JWT impersonation. | **Parity Complete** | imp. verified in agent audit. | Low |
| `/user?page=agent-task` | Task assignment cards. | Assigns tasks, deletes, updates status in DB. | **Parity Complete** | Verified database updates. | Low |
| `/user?page=chat-widget` | Chat widget script generator. | Config panel saves styles, serves JS script. | **Parity Complete** | Configures styles. | Medium |
| `/user?page=billing` | Subscription plan selector. | Renders plan levels. Trial activates. | **Functional But Different** | Checkout redirects require configured Stripe/PayPal credentials. | Medium |
| `/user?page=api-dashboard` | REST API key generation. | Generates JWT-based developer tokens. | **Parity Complete** | Token generation verified. | Low |
| `/user?page=rest-api` | Send-message API reference docs. | Displays curl commands. | **Parity Complete** | Renders guides. | Low |
| `/user?page=manage-webhooks` | Webhook rules CRUD. | Rules insert, update, and delete in database. | **Missing Logic** | The webhook execution engine does not exist; rules are never evaluated. | High |
| `/user?page=insta-dm-bot` | Instagram DM automation. | Inactive. | **Placeholder** | Stub page. | Low |
| `/user?page=insta-comment-dm` | Instagram comment automation. | Inactive. | **Placeholder** | Stub page. | Low |
| `/user?page=telegram-sessions` | Telegram bot linking. | Inactive. | **Placeholder** | Stub page. | Low |
| `/user?page=create-call-flow` | Voice call flow builder. | Inactive. | **Placeholder** | Stub page. | Low |
| `/user?page=wa-call-logs` | Voice call log viewer. | Inactive. | **Placeholder** | Stub page. | Low |
| `/user?page=setup-wa-calls` | Twilio voice configuration. | Inactive. | **Placeholder** | Stub page. | Low |
| `/user?page=webhook-automation` | Advanced webhook triggers. | Inactive. | **Placeholder** | Stub page. | Low |
| `/user?page=webhook-logs` | Outbound delivery logs. | Inactive. | **Placeholder** | No database logs table exists. | Medium |
| `/user?page=web-notification` | Push notification settings. | Inactive. | **Placeholder** | Stub page. | Low |

---

## 3. Admin Portal — Authenticated Pages

| Page / Route | Reference Feature | Current B1GCRM Behavior | Classification | Gaps / Evidence | Priority |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `/admin?page=dashboard` | Global SaaS metrics. | Aggregates DB users/orders correctly. | **Parity Complete** | Verified. | Low |
| `/admin?page=manage-plans` | Subscription plans CRUD. | Renders plan listings. Saves and deletes plans. | **Functional But Different** | Editing plans has a routing collision bug. | High |
| `/admin?page=manage-users` | Tenant override logins. | Overrides plan levels, auto-logs into tenant. | **Parity Complete** | Impersonation works. | Low |
| `/admin?page=orders` | Payment transaction logs. | Displays payment rows. | **Parity Complete** | Matches schema logs. | Low |
| `/admin?page=settings` | Multi-tab CMS configurations. | Saves configs to `settings` database table. | **Parity Complete** | Saves site text. | Low |
| `/admin?page=wa-link` | WhatsApp links analytics. | Inactive. | **Placeholder** | Stub page. | Low |
| `/admin?page=flow-builder-template` | Flow templates library. | Inactive. | **Placeholder** | Stub page. | Low |
| `/admin?page=qr-plugin-settings` | QR generation configs. | Inactive. | **Placeholder** | Stub page. | Low |
| `/admin?page=instagram-config` | Instagram API app keys. | Inactive. | **Placeholder** | Stub page. | Low |
| `/admin?page=web-notification` | Push notify configs. | Inactive. | **Placeholder** | Stub page. | Low |
| `/admin?page=send-web-push` | Dispatch custom push alerts. | Inactive. | **Placeholder** | Stub page. | Low |
| `/admin?page=embed-config` | Embedded login config. | Inactive. | **Placeholder** | Stub page. | Low |
| `/admin?page=telegram-config` | Telegram bot credentials. | Inactive. | **Placeholder** | Stub page. | Low |

---

## 4. Agent Portal — Authenticated Pages

| Page / Route | Reference Feature | Current B1GCRM Behavior | Classification | Gaps / Evidence | Priority |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `/agent?page=dashboard` | Assigned thread dashboard. | Shows assigned chats. | **Parity Complete** | Verified. | Low |
| `/agent?page=chats` | Filtered chats listing. | Displays chats assigned. | **Parity Complete** | Verified. | Low |

---

## 5. Public Pages

| URL | Purpose | Classification | Gaps / Evidence |
| :--- | :--- | :--- | :--- |
| `/` | Landing page | **Parity Complete** | Shows marketing hero, plan packages, testimonials. |
| `/pricing` | Pricing anchors | **Parity Complete** | Smooth scroll to pricing. |
| `/signin` | Portal selectors | **Parity Complete** | User, Admin, and Agent links load. |
| `/login` | Unified login card | **Parity Complete** | Handles email/password authentication. |
| `/register` | Signup redirection | **Parity Complete** | Redirects to register portal. |
| `/user/signup` | Tenant registration | **Parity Complete** | Registers new accounts in DB. |
