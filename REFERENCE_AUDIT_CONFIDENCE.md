# Reference Audit Confidence Report

Audit of all reference CRM pages, verifying that claimed functionality matches live screenshots, timestamps, and compiled markdown exports.

## Reference Page Verification Log

| Target Page | Reference URL | Screenshot Path (Artifacts) | Timestamp | Role Used | Markdown Export Path | Verification Status |
| --- | --- | --- | --- | --- | --- | --- |
| **Homepage** | `https://crm.oneoftheprojects.com/` | `public_pages_capture_1781659399503.webp` | 2026-06-17 | Guest | `docs/reference-pages/homepage.md` | **VERIFIED** |
| **Login** | `https://crm.oneoftheprojects.com/user/login` | `login_page_1781659446867.png` | 2026-06-17 | Guest | `docs/reference-pages/login.md` | **VERIFIED** |
| **Signup** | `https://crm.oneoftheprojects.com/user/login` | `signup_state_1781659510379.png` | 2026-06-17 | Guest | `docs/reference-pages/signup.md` | **VERIFIED** |
| **Dashboard** | `https://crm.oneoftheprojects.com/user?page=dashboard` | `dashboard_scrolled_further_1781661930851.png` | 2026-06-17 | User | `docs/reference-pages/master_index.md` | **VERIFIED** |
| **Inbox** | `https://crm.oneoftheprojects.com/user?page=inbox` | `inbox_page_1781661968964.png` | 2026-06-17 | User | `docs/reference-pages/inbox.md` | **VERIFIED** |
| **Contacts** | `https://crm.oneoftheprojects.com/user?page=phonebook` | `phonebook_page_1781662052537.png` | 2026-06-17 | User | `docs/reference-pages/contacts.md` | **VERIFIED** |
| **Campaigns** | `https://crm.oneoftheprojects.com/user?page=campaigns` | `campaigns_scrolled_1781662100405.png` | 2026-06-17 | User | `docs/reference-pages/campaigns.md` | **VERIFIED** |
| **Automation Flows** | `https://crm.oneoftheprojects.com/user?page=automation-flows` | `automation_flows_page_1781662428409.png` | 2026-06-17 | User | `docs/reference-pages/automation_flows.md` | **VERIFIED** |
| **Chatbot** | `https://crm.oneoftheprojects.com/user?page=chatbot` | `wa_chatbot_page_1781662507539.png` | 2026-06-17 | User | `docs/reference-pages/chatbot.md` | **VERIFIED** |
| **Integrations** | `https://crm.oneoftheprojects.com/user?page=integrations` | `add_whatsapp_page_1781662166560.png` | 2026-06-17 | User | `docs/reference-pages/integrations.md` | **VERIFIED** |
| **Create Meta Template** | `https://crm.oneoftheprojects.com/user?page=create-meta-template` | `create_meta_template_page_1781662612295.png` | 2026-06-17 | User | `docs/reference-pages/billing.md` | **VERIFIED** |
| **Agent Management** | `https://crm.oneoftheprojects.com/user?page=agent-login` | None | None | User | `docs/reference-pages/agent_login.md` | **UNVERIFIED** |
| **Agent Tasks** | `https://crm.oneoftheprojects.com/user?page=agent-task` | None | None | User | `docs/reference-pages/agent_task.md` | **UNVERIFIED** |
| **Chat Widget** | `https://crm.oneoftheprojects.com/user?page=chat-widget` | None | None | User | `docs/reference-pages/chat_widget.md` | **UNVERIFIED** |
| **Billing** | `https://crm.oneoftheprojects.com/user?page=billing` | None | None | User | `docs/reference-pages/billing.md` | **UNVERIFIED** |
| **Admin Plans** | `https://crm.oneoftheprojects.com/admin?page=manage-plans` | None | None | Admin | `docs/reference-pages/admin_plans.md` | **UNVERIFIED** |
| **Admin Users** | `https://crm.oneoftheprojects.com/admin?page=manage-users` | None | None | Admin | `docs/reference-pages/admin_users.md` | **UNVERIFIED** |
| **Admin Orders** | `https://crm.oneoftheprojects.com/admin?page=orders` | None | None | Admin | `docs/reference-pages/admin_orders.md` | **UNVERIFIED** |
| **Admin Settings** | `https://crm.oneoftheprojects.com/admin?page=settings` | None | None | Admin | `docs/reference-pages/admin_settings.md` | **UNVERIFIED** |

## Audit Summary
* **Total unique reference pages audited**: 19
* **Verified pages**: 11 (58%)
* **Unverified pages**: 8 (42%)
