# FEATURE TRACKER

> **âš ï¸ ATTENTION AI AGENTS âš ï¸**
> You MUST read this file when starting a task, and you MUST update the status of any feature you have worked on before finishing your turn. This acts as our persistent state-manager so no context is lost between agents.

## Status Legend
- [ ] ðŸ”´ Pending (Not started)
- [~] ðŸŸ¡ Backend Ready / UI Missing (API routes exist but no interface)
- [x] ðŸŸ¢ Fully Completed

## Core Infrastructure
- [x] 🟢 Frontend App Shell & Routing (3-portal architecture laid out in React)
- [~] 🟡 Global Styling & Figma Tokens (Dark mode, base colors starting)
- [x] 🟢 Frontend Testing Infrastructure (Jest + React Testing Library configured in `client/`)
- [x] 🟢 Reference Route Registry + RTL Coverage (audited admin/user SaaS slugs are registered and tested)
- [x] 🟢 Local Dependency Bootstrap (`npm install` completed for root and `client/`)
- [x] 🟢 React Profiler Hook (opt-in local performance logging)
- [x] 🟢 Live Reference App Audit (`REFERENCE_APP_AUDIT.md` maps public, admin, and user portals against the repo)

## Admin Portal Features
- [~] ðŸŸ¡ Dashboard (Stats: AI Agents, Active Chats, Tasks, WA Accounts, Charts)
- [~] ðŸŸ¡ Manage Plans
- [~] ðŸŸ¡ Manage Users
- [~] ðŸŸ¡ Orders
- [ ] ðŸ”´ Front Partners
- [~] ðŸŸ¡ FAQ
- [~] ðŸŸ¡ Manage Pages
- [~] ðŸŸ¡ Testimonial
- [~] ðŸŸ¡ Contact Form
- [ ] ðŸ”´ WA Links data
- [~] ðŸŸ¡ Payment Gateways (Stripe, Razorpay, PayPal)
- [~] ðŸŸ¡ Flowbuilder Template
- [~] ðŸŸ¡ Theme Settings
- [~] ðŸŸ¡ Social Login
- [~] ðŸŸ¡ Site Settings
- [~] ðŸŸ¡ SMTP
- [~] ðŸŸ¡ Web Translation
- [~] ðŸŸ¡ Update Web (Logo/Meta)
- [~] ðŸŸ¡ QR Plugin Settings
- [ ] ðŸ”´ Instagram Config (NEW)
- [ ] ðŸ”´ Web Notification (NEW)
- [ ] ðŸ”´ Manual Web Push
- [ ] ðŸ”´ WA Embed Login

## User Portal Features
- [~] ðŸŸ¡ Authentication (Login, Social Auth, Signup)
- [~] ðŸŸ¡ Dashboard (User Stats)
- [~] ðŸŸ¡ Inbox (WhatsApp-style operator console with socket text/media replies; Instagram connection and advanced message polish pending)
- [~] ðŸŸ¡ Kanban (chat pipeline grouped by status with tenant-scoped status updates; drag/drop pending)
- [ ] ðŸ”´ WhatsApp Forms
- [ ] ðŸ”´ Link Instagram (NEW)
- [ ] ðŸ”´ Insta DM Bot (NEW)
- [ ] ðŸ”´ Insta Comment DM (NEW)
- [~] ðŸŸ¡ Add WhatsApp by QR
- [ ] ðŸ”´ WhatsApp Warmer
- [~] ðŸŸ¡ Rest API (dashboard/docs/key generation wired; usage analytics pending)
- [~] ðŸŸ¡ Link Meta WhatsApp (Cloud API credential form, readiness panel, and backend verification wired; embedded signup/OAuth pending)
- [~] ðŸŸ¡ Billing / Checkout (Stripe UI wired; PayPal/Razorpay/Paystack SDK handoff pending)
- [~] Automation Flows (bot-ready template generator, JSON editor, save/load/delete, and activity inspection wired; full drag/drop React Flow canvas pending)
- [~] WA Chatbot (flow-based bot CRUD, all-chat vs selected-chat targeting, tenant-scoped backend validation, status controls, and runtime diagnostics wired; visual flow builder handoff and advanced execution analytics pending)
- [~] ðŸŸ¡ Create Meta Template (UI wired to Meta create/list/delete, media header upload, variable examples, quick reply/URL/phone buttons, and dynamic URL examples; approval diagnostics pending)
- [~] Send Campaign (approved template picker, audience contact count, variable mapping, and safer creation validation wired; advanced pacing/preview pending)
- [x] Campaign Dashboard (backend aggregate summary, delivery trend, template usage, date filters, and per-campaign analytics wired)
- [~] ðŸŸ¡ Phonebook
- [ ] ðŸ”´ Create Call Flow (AI Calls)
- [ ] ðŸ”´ WA Call Logs
- [ ] ðŸ”´ Setup WA Calls
- [~] ðŸŸ¡ Conversational API (sample/docs wired to `/api/v1/send-message`)
- [~] ðŸŸ¡ Template API (sample/docs wired to `/api/v1/send_templet`)
- [~] ðŸŸ¡ API Dashboard (readiness cards and endpoint docs wired)
- [~] ðŸŸ¡ Manage Webhooks (tenant webhook URL exposed; rule CRUD pending)
- [ ] ðŸ”´ Webhook Automation
- [ ] ðŸ”´ Webhook Logs
- [ ] ðŸ”´ Web Notification
- [x] 🟢 Agent Login / Auto-login
- [x] 🟢 Agent Task
- [~] ðŸŸ¡ Chat Widget (create/list/delete plus endpoint, iframe embed copy, and test link wired; logo upload UI and analytics pending)

## Agent Portal Features
- [x] 🟢 Agent Auth (Login)
- [x] 🟢 Restricted Inbox (Only assigned chats)
- [x] 🟢 Agent Tasks View
