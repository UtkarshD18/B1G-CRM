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
- [x] 🟢 Inbox (Omnichannel: WA, IG)
- [ ] ðŸ”´ Kanban 
- [ ] ðŸ”´ WhatsApp Forms
- [ ] ðŸ”´ Link Instagram (NEW)
- [ ] ðŸ”´ Insta DM Bot (NEW)
- [ ] ðŸ”´ Insta Comment DM (NEW)
- [~] ðŸŸ¡ Add WhatsApp by QR
- [ ] ðŸ”´ WhatsApp Warmer
- [ ] ðŸ”´ Rest API
- [ ] ðŸ”´ Link Meta WhatsApp
- [x] 🟢 Automation Flows (React Flow Node Builder)
- [~] ðŸŸ¡ WA Chatbot
- [~] ðŸŸ¡ Create Meta Template
- [~] ðŸŸ¡ Send Campaign
- [ ] ðŸ”´ Campaign Dashboard
- [~] ðŸŸ¡ Phonebook
- [ ] ðŸ”´ Create Call Flow (AI Calls)
- [ ] ðŸ”´ WA Call Logs
- [ ] ðŸ”´ Setup WA Calls
- [ ] ðŸ”´ Conversational API
- [ ] ðŸ”´ Template API
- [ ] ðŸ”´ API Dashboard
- [ ] ðŸ”´ Manage Webhooks
- [ ] ðŸ”´ Webhook Automation
- [ ] ðŸ”´ Webhook Logs
- [ ] ðŸ”´ Web Notification
- [x] 🟢 Agent Login / Auto-login
- [x] 🟢 Agent Task
- [ ] ðŸ”´ Chat Widget

## Agent Portal Features
- [x] 🟢 Agent Auth (Login)
- [x] 🟢 Restricted Inbox (Only assigned chats)
- [x] 🟢 Agent Tasks View
