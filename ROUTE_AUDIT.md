# Route Audit

Complete mapping of every frontend route, its backend API dependencies, and runtime verification status.

> [!NOTE]
> Compiled from `AppRoutes.jsx`, `navigation.js`, all `routes/*.js` files, and live API testing against `http://127.0.0.1:3010`.

---

## Frontend → Backend Route Map

### User Portal Routes

| Frontend Route | Component | Backend APIs Used | Status |
| --- | --- | --- | --- |
| `/user/dashboard` | `UserDashboardPage` | `GET /api/user/get_dashboard` | ✅ Active |
| `/user/inbox` | `UserInboxPage` | Socket.IO (`get_chat`, `on_open_chat`, `send_chat_message`), `POST /api/user/save_note`, `POST /api/user/return_media_url` | ✅ Active |
| `/user/kanban` | `UserKanbanPage` | `GET /api/inbox/get_chats`, `POST /api/inbox/change_chat_ticket_status` | ✅ Active |
| `/user/contacts` | `UserContactsPage` | `GET /api/phonebook/get_by_uid`, `GET /api/phonebook/get_uid_contacts`, `POST /api/phonebook/add`, `POST /api/phonebook/import_contacts`, `POST /api/phonebook/add_single_contact`, `POST /api/phonebook/del_phonebook`, `POST /api/phonebook/del_contacts` | ✅ Active |
| `/user/campaigns` | `UserCampaignsPage` | `GET /api/broadcast/get_broadcast`, `GET /api/broadcast/dashboard_summary`, `GET /api/phonebook/get_by_uid`, `GET /api/user/get_my_meta_templets` | ✅ Active |
| `/user/send-campaign` | `UserCampaignsPage` | `POST /api/broadcast/add_new` | ✅ Active |
| `/user/campaign-dashboard` | `UserCampaignsPage` | `POST /api/broadcast/get_broadcast_logs`, `POST /api/broadcast/change_broadcast_status`, `POST /api/broadcast/del_broadcast` | ✅ Active |
| `/user/automation-flows` | `UserAutomationFlowsPage` | `GET /api/chat_flow/get_mine`, `POST /api/chat_flow/add_new`, `POST /api/chat_flow/del_flow`, `POST /api/chat_flow/get_by_flow_id`, `POST /api/chat_flow/get_activity` | ✅ Active |
| `/user/chatbot` | `UserChatBotPage` | `GET /api/chatbot/get_chatbot`, `GET /api/chatbot/get_logs`, `POST /api/chatbot/add_chatbot`, `POST /api/chatbot/update_chatbot`, `POST /api/chatbot/change_bot_status`, `POST /api/chatbot/del_chatbot` | ✅ Active |
| `/user/create-meta-template` | `UserMetaTemplatesPage` | `GET /api/user/get_my_meta_templets`, `GET /api/user/get_meta_keys`, `POST /api/user/add_meta_templet`, `POST /api/user/del_meta_templet`, `POST /api/user/return_media_url_meta` | ✅ Active |
| `/user/integrations` | `UserIntegrationsPage` | `GET /api/qr/get_all`, `POST /api/qr/gen_qr`, `POST /api/qr/del_instance`, `POST /api/user/update_meta`, `GET /api/user/get_meta_keys` | ✅ Active |
| `/user/add-whatsapp-qr` | `UserIntegrationsPage` | `POST /api/qr/gen_qr` | ⚠️ Broken (Baileys stub) |
| `/user/link-meta-whatsapp` | `UserIntegrationsPage` | `POST /api/user/update_meta` | ✅ Active |
| `/user/link-instagram` | `UserIntegrationsPage` | None (placeholder) | 🔲 Placeholder |
| `/user/agent-login` | `UserAgentPage` | `GET /api/agent/get_my_agents`, `POST /api/agent/add_agent`, `POST /api/agent/del_agent`, `POST /api/user/auto_agent_login` | ✅ Active |
| `/user/agent-task` | `UserTaskPage` | `GET /api/user/get_my_agent_tasks`, `GET /api/agent/get_my_agents`, `POST /api/user/add_task_for_agent`, `POST /api/user/del_task_for_agent` | ✅ Active |
| `/user/chat-widget` | `UserChatWidgetPage` | `GET /api/user/get_my_widget`, `POST /api/user/add_widget`, `POST /api/user/del_widget` | ✅ Active |
| `/user/billing` | `UserBillingPage` | `POST /api/user/get_plan_details`, `GET /api/user/get_payment_details`, `GET /api/admin/get_plans`, `POST /api/user/create_stripe_session`, `POST /api/user/start_free_trial` | ✅ Active |
| `/user/api-dashboard` | `UserDeveloperApiPage` | `GET /api/user/generate_api_keys`, `GET /api/user/fetch_profile`, `GET /api/webhooks/rules`, `POST /api/webhooks/rules`, `POST /api/webhooks/rules/update`, `POST /api/webhooks/rules/delete` | ✅ Active |
| `/user/rest-api` | `UserDeveloperApiPage` | (Same as api-dashboard) | ✅ Active |
| `/user/manage-webhooks` | `UserDeveloperApiPage` | (Same as api-dashboard) | ✅ Active |
| `/user/settings` | `UserSettingsPage` | `GET /api/user/get_me`, `GET /api/admin/get_plans`, `POST /api/user/update_profile` | ✅ Active |
| `/user/whatsapp-forms` | `ReferenceModulePage` | None | 🔲 Placeholder |
| `/user/insta-dm-bot` | `ReferenceModulePage` | None | 🔲 Placeholder |
| `/user/insta-comment-dm` | `ReferenceModulePage` | None | 🔲 Placeholder |
| `/user/whatsapp-warmer` | `ReferenceModulePage` | None | 🔲 Placeholder |
| `/user/create-call-flow` | `ReferenceModulePage` | None | 🔲 Placeholder |
| `/user/wa-call-logs` | `ReferenceModulePage` | None | 🔲 Placeholder |
| `/user/setup-wa-calls` | `ReferenceModulePage` | None | 🔲 Placeholder |
| `/user/webhook-automation` | `ReferenceModulePage` | None | 🔲 Placeholder |
| `/user/webhook-logs` | `ReferenceModulePage` | None | 🔲 Placeholder |
| `/user/telegram-sessions` | `ReferenceModulePage` | None | 🔲 Placeholder |
| `/user/web-notification` | `ReferenceModulePage` | None | 🔲 Placeholder |

### Admin Portal Routes

| Frontend Route | Component | Backend APIs Used | Status |
| --- | --- | --- | --- |
| `/admin/dashboard` | `AdminDashboardPage` | `GET /api/admin/get_dashboard_for_user` | ✅ Active |
| `/admin/manage-plans` | `AdminPlansPage` | `GET /api/admin/get_plans`, `POST /api/admin/add_plan`, `POST /api/admin/edit_plan`, `POST /api/admin/del_plan` | ✅ Active |
| `/admin/manage-users` | `AdminUsersPage` | `GET /api/admin/get_users`, `POST /api/admin/update_user`, `POST /api/admin/update_plan`, `POST /api/admin/auto_login`, `POST /api/admin/del_user` | ✅ Active |
| `/admin/orders` | `AdminOrdersPage` | `GET /api/admin/get_orders` | ✅ Active |
| `/admin/settings` | `AdminSettingsPage` | `GET /api/admin/get_payment_gateway_admin`, `POST /api/admin/update_pay_gateway`, `GET /api/admin/get_brands`, `POST /api/admin/add_brand_image`, `POST /api/admin/del_brand_logo`, `GET /api/admin/get_faq`, `POST /api/admin/add_faq`, `POST /api/admin/del_faq`, `GET /api/admin/get_pages`, `POST /api/admin/add_page`, `POST /api/admin/del_page`, `GET /api/admin/get_testi`, `POST /api/admin/add_testimonial`, `POST /api/admin/del_testi`, `GET /api/admin/get_smtp`, `POST /api/admin/update_smtp`, `POST /api/admin/send_test_email` | ✅ Active |

### Agent Portal Routes

| Frontend Route | Component | Backend APIs Used | Status |
| --- | --- | --- | --- |
| `/agent/dashboard` | `AgentDashboardPage` | Socket.IO (agent-scoped `get_chat`, `on_open_chat`) | ✅ Active |
| `/agent/chats` | `AgentDashboardPage` | (Same component, filtered view) | ✅ Active |

### Auth Routes

| Frontend Route | Component | Backend API | Status |
| --- | --- | --- | --- |
| `/login` | `UnifiedLoginPage` | `POST /api/user/login` | ✅ Active |
| `/admin/login` | `LoginPage (admin)` | `POST /api/admin/login` | ✅ Active |
| `/user/login` | `LoginPage (user)` | `POST /api/user/login` | ✅ Active |
| `/agent/login` | `LoginPage (agent)` | `POST /api/agent/login` | ✅ Active |
| `/user/signup` | `UserSignupPage` | `POST /api/user/signup` | ✅ Active |

### Public Routes

| Frontend Route | Component | Backend API | Status |
| --- | --- | --- | --- |
| `/` | `PublicSite` | `GET /api/admin/get_web_public`, `GET /api/admin/get_plans`, `GET /api/admin/get_brands`, `GET /api/admin/get_testi`, `GET /api/admin/get_faq` | ✅ Active |
| `/signin` | `PortalChooser` | None | ✅ Active |
| `/pricing` | `Navigate → /#pricing` | None | ✅ Active |
| `/register` | `Navigate → /user/signup` | None | ✅ Active |

---

## Route Totals

| Category | Total | Active | Broken | Placeholder |
| --- | --- | --- | --- | --- |
| User Portal | 32 | 20 | 1 | 11 |
| Admin Portal | 5 | 5 | 0 | 0 |
| Agent Portal | 2 | 2 | 0 | 0 |
| Auth | 5 | 5 | 0 | 0 |
| Public | 4 | 4 | 0 | 0 |
| **TOTAL** | **48** | **36 (75%)** | **1 (2%)** | **11 (23%)** |

---

## Backend API Summary

| Route File | Endpoints | Lines | Auth Middleware |
| --- | --- | --- | --- |
| `routes/user.js` | 41 | 1758 | `validateUser` |
| `routes/admin.js` | 40 | 1097 | `adminValidator` |
| `routes/agent.js` | ~20 | 721 | `agentValidator` |
| `routes/inbox.js` | 14 | 631 | `validateUser` / public webhook |
| `routes/broadcast.js` | 6 | 506 | `validateUser` + `checkPlan` |
| `routes/chatbot.js` | 7 | 313 | `validateUser` + `checkPlan` |
| `routes/chatFlow.js` | 6 | 220 | `validateUser` + `checkPlan` |
| `routes/phonebook.js` | 7 | 208 | `validateUser` + `checkPlan` + `checkContactLimit` |
| `routes/qr.js` | 6 | 219 | `validateUser` + `checkPlan` |
| `routes/webhooks.js` | 4 | 178 | `validateUser` |
| `routes/apiv2.js` | 2 | 296 | API key auth |
| `routes/web.js` | ~12 | 525 | Mixed |
| `routes/templet.js` | 1 | 58 | None |
