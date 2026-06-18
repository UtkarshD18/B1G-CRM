# Reference App Audit

Last verified against the live reference app on June 7, 2026.

This file is the source of truth for parity work against `https://crm.oneoftheprojects.com`.

## 1. Product Model Confirmed From Live App

### Roles
- `admin`: global SaaS owner portal at `/admin`
- `user`: paying tenant workspace at `/user`
- `agent`: restricted staff workspace at `/agent`

### Commercial flow
- The public marketing site is the pre-purchase entry point.
- Users can start a free trial or buy a paid plan from the public site.
- After signup/login, the tenant lands in the `user` portal.
- Agents are created inside the `user` portal and managed by the tenant.

## 2. Public Site Audit

### Public navigation
- `Features`
- `Pricing`
- `Testimonials`
- `Sign in`

### Public feature positioning
- AI Voice Calling
- Smart Inbox
- Flow Builder
- Multi-channel WhatsApp connection
- Automation Flows and Chatbots
- Campaigns and Broadcasting
- Webhooks and REST API
- Inbox, Agents, Tasks, and Chat Widget

### Pricing plans visible on the public site
- `Trial`: 10-day free plan
- `Premium`: 365-day paid plan
- `Platinum`: 365-day paid plan

### Important implication for this repo
- The project is not only a CRM dashboard. It also needs a polished client-facing marketing and pricing site that feeds signup, trial enrollment, and paid checkout.

## 3. Live Admin Sitemap

Confirmed live routes use `https://crm.oneoftheprojects.com/admin?page=<slug>`.

| Module | Live route |
| --- | --- |
| Dashboard | `dashboard` |
| Manage Plans | `manage-plans` |
| Manage Users | `manage-users` |
| Orders | `orders` |
| Front Partners | `front-partner` |
| FAQ | `faq` |
| Manage Pages | `manage-page` |
| Testimonial | `testimonial` |
| Contact Form | `contact-form` |
| WA Links data | `wa-link` |
| Payment Gateways | `payment-gateways` |
| Flowbuilder Template | `flow-builder-template` |
| Theme Settings | `web-theme` |
| Social Login | `social-login` |
| Site Settings | `site-settings` |
| SMTP | `smtp` |
| Web Translation | `translation` |
| Update Web | `update-web` |
| QR Plugin Settings | `qr-plugin-settings` |
| Instagram Config | `instagram-config` |
| Web Notificaion | `web-notification` |
| Manual Web Push | `send-web-push` |
| WA Embed Login | `embed-config` |
| Telegram Config | `telegram-config` |

### Confirmed admin screen behaviors
- `Manage Plans` contains rich plan feature toggles, trial support, add-on flags, and account limits.
- `Manage Users` includes tenant listing plus `AUTO LOGIN`.
- `Orders` shows transaction history and status.
- `Payment Gateways` includes Stripe, PayPal, Razorpay, Paystack, MercadoPago, and offline payment.
- `Site Settings` includes logo, login-page chrome, currency, SEO, and tutorial-video configuration.
- `SMTP` exposes server credentials and test email.
- `Social Login` exposes Google and Facebook config.
- `Manage Pages` includes permanent legal docs plus custom pages.

## 4. Live User Sitemap

Confirmed live routes use `https://crm.oneoftheprojects.com/user?page=<slug>`.

| Module | Live route |
| --- | --- |
| Dashboard | `dashboard` |
| Inbox | `inbox` |
| Kabnan | `kanban` or `kabnan` in UI copy |
| WhatsApp Forms | `whatsapp-forms` |
| Link Instagram | `link-instagram` |
| Insta DM Bot | `insta-dm-bot` |
| Insta Comment DM | `insta-comment-dm` |
| Add WhatsApp by QR | `add-whatsapp-qr` |
| WhatsApp Warmer | `whatsapp-warmer` |
| Rest API | `rest-api` |
| Link Meta WhatsApp | `link-meta-whatsapp` |
| Automation Flows | `automation-flows` |
| WA Chatbot | `wa-chatbot` |
| Create Meta Template | `create-meta-template` |
| Send Campaign | `send-campaign` |
| Campaign Dashboard | `campaign-dashboard` |
| Phonebook | `phonebook` |
| Create Call Flow | `create-call-flow` |
| WA Call Logs | `wa-call-logs` |
| Setup WA Calls | `setup-wa-calls` |
| Conversational API | `conversational-api` |
| Template API | `template-api` |
| API Dashboard | `api-dashboard` |
| Manage Webhooks | `manage-webhooks` |
| Webhook Automation | `webhook-automation` |
| Webhook Logs | `webhook-logs` |
| Telegram Sessions | `telegram-sessions` |
| Web Notificaion | `web-notification` |
| Agent Login | `agent-login` |
| Agent Task | `agent-task` |
| Chat Widget | `chat-widget` |

### Confirmed user screen behaviors
- `Dashboard` shows AI Agents, Active Chats, Completed Tasks, WA Accounts, charts, and chatbot summaries.
- `Agent Login` includes agent creation, activation, list management, and auto-login actions.
- `Agent Task` includes task creation, assignment, status, comments, and timestamps.
- `Chat Widget` includes widget creation plus embed-code and test actions.

## 5. Agent Model Confirmed From Live App And Repo

- Agents are created by the tenant, not by the global admin.
- Agents are listed under the tenant workspace.
- Agents have their own login portal at `/agent/login`.
- The repo supports auto-login tokens for agent impersonation from the tenant workspace.

Repo evidence:
- [routes/agent.js](routes/agent.js:36)
- [routes/user.js](routes/user.js:1520)
- [routes/user.js](routes/user.js:1733)
- [middlewares/agent.js](middlewares/agent.js:4)
- [socket.js](socket.js:23)

## 6. Parity Matrix: Live App vs Repo

Status legend:
- `Backend present`: route or middleware support exists in this repo
- `Frontend missing`: live app screen exists but local React app does not implement it
- `Backend partial/missing`: live app surface exists but repo does not yet clearly back it fully

### Public site and commercial flow

| Area | Live app | Repo status | Notes |
| --- | --- | --- | --- |
| Marketing homepage | Present | Frontend missing | Local `client` does not contain the public site yet. |
| Pricing cards | Present | Partial | Plans exist in backend; public pricing UI is missing locally. |
| Tenant signup/login | Present | Backend present, frontend missing | [routes/user.js](routes/user.js:194), [routes/user.js](routes/user.js:236) |
| Free trial activation | Present | Backend present | [routes/user.js](routes/user.js:1327) |
| Paid checkout | Present | Backend present, frontend missing | Stripe, PayPal, Razorpay, Paystack exist in `routes/user.js`. |

### Admin portal

| Area | Live app | Repo status | Notes |
| --- | --- | --- | --- |
| Admin auth | Present | Backend present, frontend missing | [routes/admin.js](routes/admin.js:18) |
| Dashboard | Present | Backend present, frontend missing | [routes/admin.js](routes/admin.js:776) |
| Manage Plans | Present | Backend present, frontend missing | [routes/admin.js](routes/admin.js:61) |
| Manage Users | Present | Backend present, frontend missing | [routes/admin.js](routes/admin.js:142) |
| Orders | Present | Backend present, frontend missing | [routes/admin.js](routes/admin.js:565) |
| Front Partners | Present | Backend present, frontend missing | [routes/admin.js](routes/admin.js:307), [routes/admin.js](routes/admin.js:335) |
| FAQ | Present | Backend present, frontend missing | [routes/admin.js](routes/admin.js:359) |
| Manage Pages | Present | Backend present, frontend missing | [routes/admin.js](routes/admin.js:406) |
| Testimonial | Present | Backend present, frontend missing | [routes/admin.js](routes/admin.js:520) |
| Contact Form leads | Present | Backend present, frontend missing | [routes/admin.js](routes/admin.js:602) |
| Payment Gateways | Present | Backend partial | Live UI includes MercadoPago, but current admin update route does not clearly persist MercadoPago fields. |
| Flowbuilder Template | Present | Backend unclear/partial | Tracker and live UI expose it, but local route coverage is not yet obvious. |
| Theme Settings | Present | Backend partial | Local tracker expects it; exact route coverage is not yet clearly represented in the current backend snapshot. |
| Social Login | Present | Backend present, frontend missing | [routes/admin.js](routes/admin.js:979) |
| Site Settings | Present | Backend partial | `web_public` exists, but the live screen is richer than the current documented local plan. |
| SMTP | Present | Backend present, frontend missing | [routes/admin.js](routes/admin.js:700) |
| Web Translation | Present | Backend partial | Translation asset exists locally, but full admin editing flow is not confirmed in backend routes. |
| Update Web | Present | Backend partial | Live screen exists; local route coverage needs fuller audit. |
| QR Plugin Settings | Present | Backend partial | Related QR support exists, but exact admin config surface is not fully mapped locally. |
| Instagram Config | Present | Backend unclear/partial | Live-only confirmation so far. |
| Web Notificaion | Present | Backend unclear/partial | Live-only confirmation so far. |
| Manual Web Push | Present | Backend unclear/partial | Live-only confirmation so far. |
| WA Embed Login | Present | Backend unclear/partial | Live-only confirmation so far. |
| Telegram Config | Present | Backend unclear/partial | Live-only confirmation so far. |

### User portal

| Area | Live app | Repo status | Notes |
| --- | --- | --- | --- |
| User auth | Present | Backend present, frontend missing | [routes/user.js](routes/user.js:194), [routes/user.js](routes/user.js:236) |
| Dashboard | Present | Backend partial, frontend missing | Live dashboard exists; local dashboard endpoint coverage needs fuller audit. |
| Inbox | Present | Backend present, frontend missing | `routes/inbox.js`, `socket.js`, helper inbox flows exist. |
| Kanban | Present | Backend unclear/partial | Live menu exists; local implementation is not obvious yet. |
| WhatsApp Forms | Present | Backend unclear/partial | Mentioned in plan and live app, not clearly implemented locally. |
| Instagram modules | Present | Backend unclear/partial | Live menu exists, local route support not yet fully confirmed. |
| QR onboarding | Present | Backend present, frontend missing | `routes/qr.js` and QR helpers exist. |
| WhatsApp Warmer | Present | Backend unclear/partial | Live menu exists, local support not yet fully mapped. |
| REST API | Present | Backend partial | API key generation exists; exact UI/API parity still needs mapping. |
| Meta WhatsApp connection | Present | Backend present, frontend missing | Meta helper code and profile fetch exist. |
| Automation Flows | Present | Backend present, frontend missing | `routes/chatFlow.js`, `flow-json/`, chatbot helpers exist. |
| WA Chatbot | Present | Backend present, frontend missing | `routes/chatbot.js`, `functions/chatbot.js` exist. |
| Meta Template builder | Present | Backend present, frontend missing | Template helper functions and route coverage exist. |
| Send Campaign | Present | Backend present, frontend missing | `routes/broadcast.js`, `loops/campaignLoop.js` exist. |
| Campaign Dashboard | Present | Backend partial | Broadcasting exists, but exact dashboard surface still needs mapping. |
| Phonebook | Present | Backend present, frontend missing | `routes/phonebook.js` exists. |
| AI WhatsApp Calling | Present | Backend unclear/partial | Live menus exist, but local support is not yet obvious. |
| Conversational API | Present | Backend partial | API key generation exists, but exact live-page parity needs design and endpoint audit. |
| Template API | Present | Backend partial | Same as above. |
| API Dashboard | Present | Backend partial | Same as above. |
| Webhooks | Present | Backend present, frontend missing | Webhook hooks are referenced in plan and inbox helpers. |
| Telegram Sessions | Present | Backend unclear/partial | Live menu exists; local support not yet fully confirmed. |
| Web Notification | Present | Backend unclear/partial | Live-only confirmation so far. |
| Agent Login | Present | Backend present, frontend missing | [routes/agent.js](routes/agent.js:36), [routes/user.js](routes/user.js:1733) |
| Agent Task | Present | Backend present, frontend missing | [routes/user.js](routes/user.js:1520) |
| Chat Widget | Present | Backend present, frontend missing | [routes/user.js](routes/user.js:1580) |

### Agent portal

| Area | Live app | Repo status | Notes |
| --- | --- | --- | --- |
| Agent auth | Present | Backend present, frontend missing | [routes/agent.js](routes/agent.js:255) |
| Restricted inbox | Present by architecture | Backend present, frontend missing | Agent middleware and `agent_chats` linkage exist. |
| Agent tasks | Present by architecture | Backend present, frontend missing | Task creation and owner/agent linkage exist. |
| Exact agent UI parity | Unknown | Frontend missing | Agent live portal needs a dedicated crawl after auto-login or agent credentials are obtained from the tenant flow. |

## 7. Key Architecture Conclusion

`PROJECT_PLAN.md` is directionally right, but it is not yet detailed enough to recreate the live app exactly.

The real implementation target is:
- a marketing and checkout site
- a super-admin operations portal
- a tenant operations portal
- an agent workspace
- plan-gated features and add-ons
- impersonation and auto-login flows

The current repo already contains much of the backend skeleton for that model, but the local frontend is still only a minimal shell.

## 8. Recommended Build Order

1. Rebuild the public marketing, pricing, signup, and checkout flow.
2. Rebuild admin shell plus high-value admin CRUD pages:
   - dashboard
   - manage plans
   - manage users
   - orders
   - payment gateways
   - SMTP
   - site settings
3. Rebuild user shell plus high-value tenant workflow:
   - dashboard
   - inbox
   - QR onboarding
   - automation flows
   - campaigns
   - phonebook
   - agent login
   - agent task
   - chat widget
4. Rebuild agent shell and restricted inbox experience.
5. Close parity gaps on add-ons:
   - Instagram
   - Telegram
   - web notifications
   - embed login
   - AI calling
