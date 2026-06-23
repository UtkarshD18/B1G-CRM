# Role Page Status Matrix

Complete mapping of all 48 frontend routes, role permissions, active UI state, backend API responsiveness, and source data mode.

## User Portal Routes

| Route | Role | Status | API Status | Data Source | Notes |
| --- | --- | --- | --- | --- | --- |
| `/user/dashboard` | User | Working | Success | Real Data | Renders dashboard KPI cards and statistics graphs. |
| `/user/inbox` | User | Working | Success | Real Data | Real-time chat console using WebSockets and note saves. |
| `/user/kanban` | User | Working | Success | Real Data | Visual ticket-stage board grouping open/closed tickets. |
| `/user/contacts` | User | Working | Success | Real Data | Phonebook managers and contacts lists. |
| `/user/phonebook` | User | Working | Success | Real Data | Direct alias mapping for contacts. |
| `/user/campaigns` | User | Working | Success | Real Data | Broadcast list and dashboard statistics workspace. |
| `/user/send-campaign` | User | Working | Success | Real Data | Campaign builder for new dispatches. |
| `/user/campaign-dashboard` | User | Working | Success | Real Data | Logs viewer and status editor for campaigns. |
| `/user/automation-flows` | User | Working | Success | Real Data | Visual workflow canvas builder using ReactFlow. |
| `/user/chatbot` | User | Working | Success | Real Data | Interactive bot editor and response configuration. |
| `/user/wa-chatbot` | User | Working | Success | Real Data | Direct alias mapping for chatbot. |
| `/user/create-meta-template` | User | Working | Success | Real Data | Form template creation and key metadata mapping. |
| `/user/integrations` | User | Working | Success | Real Data | WhatsApp QR instance management and webhook settings. |
| `/user/add-whatsapp-qr` | User | Broken | Error | Empty State | Connect instance fails due to missing actual Baileys WhatsApp connection state in headless Docker. |
| `/user/link-meta-whatsapp` | User | Working | Success | Real Data | Updates Meta WhatsApp Business App API keys. |
| `/user/link-instagram` | User | Placeholder | Unknown | Empty State | Integration placeholder card. |
| `/user/agent-login` | User | Working | Success | Real Data | Agent management controls and sub-agent auto-login. |
| `/user/agent-task` | User | Working | Success | Real Data | Add/remove tasks assigned to portal agents. |
| `/user/chat-widget` | User | Working | Success | Real Data | Dynamic script config builder for live web chat widget. |
| `/user/billing` | User | Working | Success | Real Data | Stripe subscription checkout sessions and trials. |
| `/user/api-dashboard` | User | Working | Success | Real Data | API token keys manager and webhook configurations. |
| `/user/rest-api` | User | Working | Success | Real Data | Rest API details page. |
| `/user/manage-webhooks` | User | Working | Success | Real Data | Outbound webhook rules settings. |
| `/user/settings` | User | Working | Success | Real Data | Profile information updater. |
| `/user/whatsapp-forms` | User | Placeholder | None | Mock Data | planned/queued reference screen. |
| `/user/insta-dm-bot` | User | Placeholder | None | Mock Data | planned/queued reference screen. |
| `/user/insta-comment-dm` | User | Placeholder | None | Mock Data | planned/queued reference screen. |
| `/user/whatsapp-warmer` | User | Placeholder | None | Mock Data | planned/queued reference screen. |
| `/user/create-call-flow` | User | Placeholder | None | Mock Data | planned/queued reference screen. |
| `/user/wa-call-logs` | User | Placeholder | None | Mock Data | planned/queued reference screen. |
| `/user/setup-wa-calls` | User | Placeholder | None | Mock Data | planned/queued reference screen. |
| `/user/webhook-automation` | User | Placeholder | None | Mock Data | planned/queued reference screen. |
| `/user/webhook-logs` | User | Placeholder | None | Mock Data | planned/queued reference screen. |
| `/user/telegram-sessions` | User | Placeholder | None | Mock Data | planned/queued reference screen. |
| `/user/web-notification` | User | Placeholder | None | Mock Data | planned/queued reference screen. |

## Admin Portal Routes

| Route | Role | Status | API Status | Data Source | Notes |
| --- | --- | --- | --- | --- | --- |
| `/admin/dashboard` | Admin | Working | Success | Real Data | Super-admin analytics dashboard. |
| `/admin/manage-plans` | Admin | Working | Success | Real Data | Plan packages list and configuration CRUD. |
| `/admin/manage-users` | Admin | Working | Success | Real Data | User table dashboard, credentials editor and auto-impersonation. |
| `/admin/orders` | Admin | Working | Success | Real Data | Stripe transaction payment logs list. |
| `/admin/settings` | Admin | Working | Success | Real Data | SMTP configuration, Gateway API keys, FAQ, testimonials. |

## Agent Portal Routes

| Route | Role | Status | API Status | Data Source | Notes |
| --- | --- | --- | --- | --- | --- |
| `/agent/dashboard` | Agent | Working | Success | Real Data | Assigned chat rows console. |
| `/agent/chats` | Agent | Working | Success | Real Data | Filtered websocket thread console. |

## Public & Auth Routes

| Route | Role | Status | API Status | Data Source | Notes |
| --- | --- | --- | --- | --- | --- |
| `/login` | Public | Working | Success | Real Data | Unified login selector. |
| `/admin/login` | Public | Working | Success | Real Data | Admin login credentials endpoint form. |
| `/user/login` | Public | Working | Success | Real Data | Tenant login credentials endpoint form. |
| `/agent/login` | Public | Working | Success | Real Data | Agent login credentials endpoint form. |
| `/user/signup` | Public | Working | Success | Real Data | Tenant subscription workspace onboarding. |
| `/` | Public | Working | Success | Real Data | Public marketing pages landing section. |
| `/signin` | Public | Working | None | None | Workspace portal selector card. |
| `/pricing` | Public | Working | None | None | Navigation redirect helper. |
| `/register` | Public | Working | None | None | Navigation redirect helper. |
