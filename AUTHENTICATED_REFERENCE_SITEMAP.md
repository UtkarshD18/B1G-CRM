# Authenticated Reference CRM Sitemap

Comprehensive map of all authenticated pages in the reference CRM (whatsCRM) at `https://crm.oneoftheprojects.com`.

> [!NOTE]
> This sitemap was compiled from: reference page Markdown captures (`docs/reference-pages/`), authenticated browser screenshots, and B1GCRM source code reverse-engineering. The reference CRM is a React SPA using MUI (Material UI) with URL-based page routing via `?page=` query params.

---

## Authentication Entry Points

| URL | Role | Description |
| --- | --- | --- |
| `/user/login` | User | Tenant login + signup card (email/password, Google OAuth, Facebook OAuth) |
| `/admin/login` | Admin | Super-admin login (email/password only) |
| `/agent/login` | Agent | Agent restricted login (email/password, auto-login tokens) |

**Demo Credentials:** `user@example.com` / `<PASSWORD>` (visible on login page with Autofill button)

---

## User Portal — Authenticated Pages

| # | Sidebar Label | Route / Slug | Purpose | Sub-pages |
| --- | --- | --- | --- | --- |
| 1 | Dashboard | `/user?page=dashboard` | Tenant KPI cards (active chats, WA accounts, contacts, flows) + monthly time-series charts | — |
| 2 | Inbox | `/user?page=inbox` | 3-panel real-time chat console (chat list / conversation thread / context panel) | — |
| 3 | Kanban | `/user?page=kanban` | Drag-and-drop Kanban board grouping chats by status (Open / Pending / Solved) | — |
| 4 | Contacts | `/user?page=phonebook` | Phonebook group manager + CSV import + individual contact CRUD | — |
| 5 | Campaigns | `/user?page=campaigns` | Broadcast campaign workspace | `send-campaign`, `campaign-dashboard` |
| 6 | Automation Flows | `/user?page=automation-flows` | Visual node-based flow designer (ReactFlow canvas) | — |
| 7 | Chatbot | `/user?page=wa-chatbot` | Chatbot CRUD binding flows to chat targets + diagnostic log viewer | — |
| 8 | Meta Templates | `/user?page=create-meta-template` | WhatsApp Business API message template builder (header, body, footer, buttons) | — |
| 9 | Integrations | `/user?page=integrations` | WhatsApp connection methods overview | `add-whatsapp-qr`, `link-meta-whatsapp`, `link-instagram` |
| 10 | WhatsApp QR | `/user?page=add-whatsapp-qr` | Baileys QR session linking | — |
| 11 | Meta WhatsApp | `/user?page=link-meta-whatsapp` | Meta Business API app credentials form | — |
| 12 | Instagram | `/user?page=link-instagram` | Instagram DM credentials linking (placeholder) | — |
| 13 | WhatsApp Warmer | `/user?page=whatsapp-warmer` | Number warmup sequencer (placeholder) | — |
| 14 | WhatsApp Forms | `/user?page=whatsapp-forms` | Lead capture form builder (placeholder) | — |
| 15 | Agent Login | `/user?page=agent-login` | Agent accounts CRUD + auto-login token generation | — |
| 16 | Agent Task | `/user?page=agent-task` | Task assignment cards for agents | — |
| 17 | Chat Widget | `/user?page=chat-widget` | Embeddable JS chat widget configurator + snippet generator | — |
| 18 | Billing | `/user?page=billing` | Subscription plan selector + payment gateway checkout | — |
| 19 | API & Webhooks | `/user?page=api-dashboard` | API key generation + documentation | `rest-api`, `conversational-api`, `template-api`, `manage-webhooks` |
| 20 | REST API | `/user?page=rest-api` | Send-message API reference + code samples | — |
| 21 | Webhook Rules | `/user?page=manage-webhooks` | Webhook automation CRUD rules | — |
| 22 | Settings | `/user?page=settings` | User profile, timezone, password change, API key display | — |
| 23 | Instagram DM Bot | `/user?page=insta-dm-bot` | Instagram DM automation (placeholder) | — |
| 24 | Instagram Comment DM | `/user?page=insta-comment-dm` | Instagram comment-to-DM automation (placeholder) | — |
| 25 | Telegram Sessions | `/user?page=telegram-sessions` | Telegram bot linking (placeholder) | — |
| 26 | WA Call Flows | `/user?page=create-call-flow` | Voice call flow builder (placeholder) | — |
| 27 | WA Call Logs | `/user?page=wa-call-logs` | Voice call log viewer (placeholder) | — |
| 28 | Setup WA Calls | `/user?page=setup-wa-calls` | Twilio voice config (placeholder) | — |
| 29 | Webhook Automation | `/user?page=webhook-automation` | Advanced webhook triggers (placeholder) | — |
| 30 | Webhook Logs | `/user?page=webhook-logs` | Webhook dispatch logs viewer (placeholder) | — |
| 31 | Web Notification | `/user?page=web-notification` | Browser push notification settings (placeholder) | — |

---

## Admin Portal — Authenticated Pages

| # | Sidebar Label | Route / Slug | Purpose | Sub-pages |
| --- | --- | --- | --- | --- |
| 1 | Dashboard | `/admin?page=dashboard` | Global SaaS metrics (total users, revenue, active tenants) | — |
| 2 | Manage Plans | `/admin?page=manage-plans` | Subscription plans CRUD (title, pricing, feature flags, limits) | — |
| 3 | Manage Users | `/admin?page=manage-users` | Tenant user list + plan override + auto-login impersonation | — |
| 4 | Orders | `/admin?page=orders` | Payment order history viewer | — |
| 5 | Settings | `/admin?page=settings` | Multi-tab settings | `front-partner`, `faq`, `manage-page`, `testimonial`, `contact-form`, `payment-gateways`, `social-login`, `site-settings`, `smtp`, `web-theme`, `translation`, `update-web` |
| 6 | WA Links Data | `/admin?page=wa-link` | WhatsApp link analytics (placeholder) | — |
| 7 | Flowbuilder Template | `/admin?page=flow-builder-template` | Pre-built flow templates library (placeholder) | — |
| 8 | QR Plugin Settings | `/admin?page=qr-plugin-settings` | QR generation settings (placeholder) | — |
| 9 | Instagram Config | `/admin?page=instagram-config` | Instagram app configuration (placeholder) | — |
| 10 | Web Notification | `/admin?page=web-notification` | Push notification config (placeholder) | — |
| 11 | Manual Web Push | `/admin?page=send-web-push` | Send one-off push notification (placeholder) | — |
| 12 | WA Embed Login | `/admin?page=embed-config` | WhatsApp embedded login config (placeholder) | — |
| 13 | Telegram Config | `/admin?page=telegram-config` | Telegram bot configuration (placeholder) | — |

---

## Agent Portal — Authenticated Pages

| # | Sidebar Label | Route / Slug | Purpose |
| --- | --- | --- | --- |
| 1 | Workspace | `/agent?page=dashboard` | Assigned chats dashboard with message thread |
| 2 | Assigned Chats | `/agent?page=chats` | Filtered view of agent-assigned conversations |

---

## Public Pages (Unauthenticated)

| URL | Purpose |
| --- | --- |
| `/` | Marketing landing page with feature showcase, pricing, testimonials |
| `/pricing` | Redirects to `/#pricing` anchor |
| `/signin` | Portal chooser (Admin / User / Agent) |
| `/login` | Unified login page |
| `/register` | Redirects to `/user/signup` |
| `/user/signup` | Standalone user registration page |

---

## Navigation Structure Summary

### User Portal Sidebar (16 items)
Dashboard → Inbox → Kanban → Contacts → Campaigns → Automation Flows → ChatBot → Meta Templates → Integrations → Meta WhatsApp → Agent Login → Agent Task → Chat Widget → Billing → API & Webhooks → Settings

### Admin Portal Sidebar (5 items)
Dashboard → Manage Plans → Manage Users → Orders → Settings

### Agent Portal Sidebar (2 items)
Workspace → Assigned Chats
