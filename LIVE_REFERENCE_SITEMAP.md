# Live Reference Sitemap (LIVE_REFERENCE_SITEMAP.md)

This sitemap documents the verified pages and slugs of the live reference CRM platform (`https://crm.oneoftheprojects.com`), categorizing their routes, access levels, and specific user/agent/admin portal roles.

---

## 1. Public & Marketing Portal

| URL / Page Slug | Page Name | Navigation Location | Access Level | Notes |
| --- | --- | --- | --- | --- |
| `/` | Marketing Homepage | Header menu, Footer links | Public | Details features, pricing, testimonials. |
| `/user/login` | Unified Login & Signup | Homepage "Sign in" & "Get started free" | Public | Authenticates users. Displays signup fields via React state toggle. |
| `/signin` | Sign in Selector | Redirects or falls back to public | Public | 404 in the live reference app; redirects to `/user/login` locally. |

---

## 2. Super-Admin Portal (`https://crm.oneoftheprojects.com/admin?page=<slug>`)

Authentication requires the `admin` role JWT.

| URL Slug | Page Name | Navigation Location | Access Level | Notes |
| --- | --- | --- | --- | --- |
| `dashboard` | Admin Dashboard | Sidebar menu | Admin | Displays overall KPI metrics for tenants. |
| `manage-plans` | Manage Plans | Sidebar menu | Admin | CRUD interface for subscription plans and gates. |
| `manage-users` | Manage Users | Sidebar menu | Admin | Lists tenants, edits plans, provides "Auto Login" bypass. |
| `orders` | Transaction Orders | Sidebar menu | Admin | Financial invoices lists and checkout logs. |
| `front-partner` | Homepage Partner Logos | Settings sub-tab | Admin | Manages marketing landing page partner sliders. |
| `faq` | FAQ Manager | Settings sub-tab | Admin | Manages homepage landing accordion items. |
| `manage-page` | Manage Custom Pages | Settings sub-tab | Admin | Manages terms and custom marketing sections. |
| `testimonial` | Testimonial Manager | Settings sub-tab | Admin | Approves/edits homepage testimonials grids. |
| `contact_form` / `contact-form` | Contact Leads | Settings sub-tab | Admin | Leads submissions inbox for global contact forms. |
| `payment-gateways` | Payment Gateways | Settings sub-tab | Admin | Key configs (Stripe/PayPal/Razorpay). |
| `smtp` | SMTP Configuration | Settings sub-tab | Admin | Configures mailing transport parameters. |
| `web-theme` | Site Theme | Settings sub-tab | Admin | Colors and layout styles settings. |
| `social-login` | Social Login Config | Settings sub-tab | Admin | Sets Google/Facebook OAuth client keys. |
| `site-settings` | Main Site Config | Settings sub-tab | Admin | Sets application name, logo, currency. |
| `translation` | Web Translation | Settings sub-tab | Admin | Language localization editor. |
| `update-web` | Update Website | Settings sub-tab | Admin | Core backend/frontend system updater. |
| `wa-link` | WhatsApp Links | Sidebar menu | Admin | Planned placeholder panel. |
| `flow-builder-template` | Flowbuilder Templates | Sidebar menu | Admin | Planned placeholder panel. |
| `qr-plugin-settings` | QR Plugin Settings | Sidebar menu | Admin | Planned placeholder panel. |
| `instagram-config` | Instagram Config | Sidebar menu | Admin | Planned placeholder panel. |
| `web-notification` | Web Notifications | Sidebar menu | Admin | Planned placeholder panel. |
| `send-web-push` | Manual Web Push | Sidebar menu | Admin | Planned placeholder panel. |
| `embed-config` | WA Embed Login | Sidebar menu | Admin | Planned placeholder panel. |
| `telegram-config` | Telegram Config | Sidebar menu | Admin | Planned placeholder panel. |

---

## 3. Tenant User Portal (`https://crm.oneoftheprojects.com/user?page=<slug>`)

Authentication requires the `user` role JWT.

| URL Slug | Page Name | Navigation Location | Access Level | Notes |
| --- | --- | --- | --- | --- |
| `dashboard` | Tenant Dashboard | Sidebar menu | User | KPI grids (chats, tasks, chatbots, WA accounts). |
| `inbox` | Live Inbox | Sidebar menu | User | Main 3-panel chat workspace. |
| `kanban` / `kabnan` | Kanban Inbox | Sidebar menu | User | Group chats by active status labels. |
| `phonebook` / `contacts` | Contacts List | Sidebar menu | User | Contacts datatable and CSV importing tools. |
| `campaign-dashboard` / `campaigns` | Campaign Dashboard | Sidebar menu | User | Broadcast scheduler and metrics. |
| `automation-flows` | Flowbuilder Designer | Sidebar menu | User | React Flow diagram canvas workspace. |
| `wa-chatbot` / `chatbot` | Keyword Chatbot | Sidebar menu | User | CRUD triggers and chatbot diagnostic logs. |
| `integrations` / `link-meta-whatsapp` | Meta Integrations | Sidebar menu | User | Meta Cloud App integration parameters. |
| `add-whatsapp-qr` | WhatsApp QR Connection | Sidebar menu | User | Stubbed/planned connection portal. |
| `agent-login` | Agent Accounts | Sidebar menu | User | Support agent accounts manager with auto-login link. |
| `agent-task` | Agent Tasks | Sidebar menu | User | Task queues creator for agent staff. |
| `chat-widget` | Chat Widget embed | Sidebar menu | User | Generate customer embed snippet. |
| `billing` | Subscriptions Billing | Sidebar menu | User | Progress quotas, upgrade plans, checkout links. |
| `api-dashboard` / `rest-api` | Developer REST API | Sidebar menu | User | API keys generation and endpoint samples. |
| `manage-webhooks` | Webhook Automations | Sidebar menu | User | CRUD for webhook rule destinations. |
| `create-meta-template` | Meta Template Builder | Sidebar menu | User | visual WhatsApp template composer. |
| `settings` | Personal Settings | Sidebar menu | User | User Profile configuration (timezone). |
| `whatsapp-forms` | WhatsApp Forms | Sidebar menu | User | Planned placeholder panel. |
| `link-instagram` | Link Instagram | Sidebar menu | User | Planned placeholder panel. |
| `whatsapp-warmer` | WhatsApp Warmer | Sidebar menu | User | Planned placeholder panel. |
| `create-call-flow` / `wa-call-logs` | calling modules | Sidebar menu | User | Planned placeholder panels. |
| `telegram-sessions` | Telegram Sessions | Sidebar menu | User | Planned placeholder panel. |

---

## 4. Agent Portal (`https://crm.oneoftheprojects.com/agent?page=<slug>`)

Authentication requires the `agent` role JWT.

| URL Slug | Page Name | Navigation Location | Access Level | Notes |
| --- | --- | --- | --- | --- |
| `dashboard` | Agent Dashboard | Sidebar menu | Agent | Assigned task list, agent profile, assigned chats counts. |
| `inbox` | Restricted Inbox | Sidebar menu | Agent | Inbox filtered specifically to agent's assigned chats. |
