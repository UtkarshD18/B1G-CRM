# Reference CRM vs B1GCRM — Full Feature Alignment

> **Last crawled**: June 20, 2026
> **Reference URL**: `https://crm.oneoftheprojects.com`
> **Method**: Authenticated Puppeteer crawl of every page slug across User, Admin, and Agent portals
> **Credentials**: Demo autofill (`user@user.com` / `password` for User, `admin@admin.com` / `Password@123` for Admin)

---

## How to Read This Document

- **✅ Parity**: Feature exists in both reference and B1GCRM with comparable functionality
- **⚠️ Partial**: Feature exists in B1GCRM but is incomplete compared to reference
- **❌ Gap (Reference has, B1GCRM missing)**: Real functional page on reference, missing or placeholder in B1GCRM
- **🆕 B1GCRM Extra**: Feature exists in B1GCRM but NOT in the reference CRM
- **🔲 Both Placeholder**: Page exists in reference navigation but falls back to dashboard (plan-gated or stub)

---

## Executive Summary

| Metric | Count |
| --- | --- |
| Reference User Portal pages crawled | 31 |
| Reference Admin Portal pages crawled | 25 |
| Reference Agent Portal pages | 2 |
| Pages with real functional UI on reference | 40 |
| Pages that fell back to dashboard (plan-gated/stub) | 16 |
| **Features at full parity** | **22** |
| **Partial parity** | **5** |
| **Gaps (reference has, B1GCRM missing/placeholder)** | **18** |
| **B1GCRM-exclusive extras** | **5** |

---

## 1. USER PORTAL — Side-by-Side Comparison

### Pages with Real Functional UI on Reference

| # | Reference Slug | Reference Page Title | Reference UI Elements | B1GCRM Status | B1GCRM Component | Gap Notes |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | `dashboard` | Welcome Back Dashboard | KPI cards (AI Agents, Active Chats, Completed Tasks, WA Accounts), Message Activity chart, Chatbot Activity, Unread Messages, Active Chatbots, "Create Chatbot" button | ✅ Parity | `Dashboard.jsx` | Missing: Plan status display, revenue card |
| 2 | `inbox` | Inbox | 3-panel layout, chat list with All/Unread/Read filter, search bar, multi-channel badges (WhatsApp, Instagram, Telegram), tags | ✅ Parity | `Inbox.jsx` | Missing: quick-reply templates, emoji picker, media preview bubbles, read receipts, reactions |
| 3 | `phonebook` | Phonebook | Phonebook list with checkboxes, Add Phonebook button, Export button, contact form, 7 input fields | ✅ Parity | `Contacts.jsx` | Missing: contact search/filter, contact detail view |
| 4 | `automation-flows` | Automation Flows | ReactFlow canvas, Source dropdown, Flow title input, 4 input fields | ✅ Parity | `AutomationFlows.jsx` | — |
| 5 | `wa-chatbot` | WA Chatbot | Chatbot list, "Add Chatbot" button, empty state "No Chatbots Yet" | ✅ Parity | `ChatBot.jsx` | — |
| 6 | `create-meta-template` | Create Meta Template | **3 template types: Standard, Carousel, Catalog**, name input, language/category selectors, Back/Hide Preview/Next buttons | ⚠️ Partial | `MetaTemplates.jsx` | **NEW**: Reference now has Carousel and Catalog template types — B1GCRM only has Standard |
| 7 | `link-instagram` | Link Instagram | "Add" button × 2, heading "No accounts connected yet", account connection UI | ❌ Gap | Placeholder `ReferenceModulePage` | **Reference has a real functional page** — not a placeholder. Needs Instagram account linking CRUD |
| 8 | `agent-login` | Agent Login | Add Agent form (Email, Password, Full Name, Mobile Number, Short Comment, 2 textareas, 2 checkboxes), Agent List table, "Add Agent" button | ✅ Parity | `AgentLogin.jsx` | — |
| 9 | `agent-task` | Agent Task | Add Task form (Task Title, Task Description textarea, Select Agent dropdown), Task List, "Save Changes" button | ✅ Parity | `AgentTask.jsx` | — |
| 10 | `chat-widget` | Chat Widget | Add Widget form (Title, WhatsApp Number, range slider, color picker), Widget List, "Select Icon"/"Upload Mine"/"Save Changes" buttons | ✅ Parity | `ChatWidget.jsx` | Missing: live widget preview |
| 11 | `api-dashboard` | API Dashboard | **API Logs** data grid with Filters button, Export button, 6 inputs (checkboxes for column visibility, search) | ⚠️ Partial | `DeveloperApi.jsx` | **NEW**: Reference has a dedicated API Logs data grid with filtering/export — B1GCRM shows API key + docs only |
| 12 | `telegram-sessions` | Telegram Sessions | "Add New Session" button, session card showing "Wacrm" with "Account Information" section | ❌ Gap | Placeholder `ReferenceModulePage` | **Reference has a real functional page** with session management UI |
| 13 | `create-call-flow` | Create Call Flow | **AI voice call flow builder**: Welcome Message textarea, OpenAI API Key input (`sk-...`), System Instructions textarea, 5 inputs total | ❌ Gap | Placeholder `ReferenceModulePage` | **Reference has a real functional page** — full AI call flow config with OpenAI integration |
| 14 | `wa-call-logs` | WA Call Logs | Call logs viewer with checkbox filters, 4 inputs, heading "WA Call Logs" | ❌ Gap | Placeholder `ReferenceModulePage` | **Reference has a real functional page** — call log viewer |
| 15 | `webhook-automation` | Webhook Automation | "Add Webhook" button, empty state "No Webhooks Yet" | ❌ Gap | Placeholder `ReferenceModulePage` | **Reference has a real functional page** — webhook CRUD separate from manage-webhooks |
| 16 | `webhook-logs` | Webhook Logs | **Full MUI DataGrid**: Columns/Filters/Density/Export buttons, **14 inputs** (12 checkboxes + search), heading "Webhook Logs" | ❌ Gap | Placeholder `ReferenceModulePage` | **Reference has a real functional page** — this is a fully built MUI DataGrid with column visibility, filtering, density, and CSV export |

### Pages That Fell Back to Dashboard (Plan-Gated or Stub on Reference)

These pages exist in the reference sidebar navigation but redirect to the dashboard when visited with the demo account. They may be gated behind paid plans or genuinely unimplemented.

| # | Reference Slug | B1GCRM Status | Notes |
| --- | --- | --- | --- |
| 17 | `kanban` | ✅ B1GCRM has `Kanban.jsx` | Reference falls back to dashboard — **B1GCRM is ahead** |
| 18 | `campaigns` | ✅ B1GCRM has `Campaigns.jsx` | Reference falls back to dashboard — likely plan-gated. **B1GCRM is ahead** |
| 19 | `integrations` | ✅ B1GCRM has `Integrations.jsx` | Reference falls back to dashboard |
| 20 | `add-whatsapp-qr` | ⚠️ Broken | Reference falls back to dashboard; B1GCRM has UI but Baileys is stubbed |
| 21 | `link-meta-whatsapp` | ✅ B1GCRM has it in `Integrations.jsx` | Reference falls back to dashboard |
| 22 | `whatsapp-warmer` | 🔲 Both placeholder | Reference falls back to dashboard |
| 23 | `whatsapp-forms` | 🔲 Both placeholder | Reference falls back to dashboard |
| 24 | `billing` | ✅ B1GCRM has `Billing.jsx` | Reference falls back to dashboard — likely plan-gated. **B1GCRM is ahead** |
| 25 | `rest-api` | ✅ B1GCRM has it in `DeveloperApi.jsx` | Reference falls back to dashboard |
| 26 | `manage-webhooks` | ✅ B1GCRM has it in `DeveloperApi.jsx` | Reference falls back to dashboard |
| 27 | `settings` | ✅ B1GCRM has `Settings.jsx` | Reference falls back to dashboard |
| 28 | `insta-dm-bot` | 🔲 Both placeholder | Reference falls back to dashboard |
| 29 | `insta-comment-dm` | 🔲 Both placeholder | Reference falls back to dashboard |
| 30 | `setup-wa-calls` | 🔲 Both placeholder | Reference falls back to dashboard |
| 31 | `web-notification` | 🔲 Both placeholder | Reference falls back to dashboard |

---

## 2. ADMIN PORTAL — Side-by-Side Comparison

### Pages with Real Functional UI on Reference

| # | Reference Slug | Reference Page Title | Reference UI Elements | B1GCRM Status | Gap Notes |
| --- | --- | --- | --- | --- | --- |
| 1 | `dashboard` | Dashboard 🛠️ | KPI cards (4 H3 metric values), sections: User Growth, Message Activity, Message Types, Agent Performance, Recent Users, Recent Activity | ✅ Parity | Admin `Dashboard.jsx` exists |
| 2 | `manage-plans` | Manage Plans | Plan cards (Trial $0, Premium $499, Platinum $1899), "Add New Plan" button, Edit/Delete buttons per plan | ✅ Parity | Admin `Plans.jsx` exists |
| 3 | `manage-users` | Manage Users | MUI DataGrid with Refresh/Columns/Filters/Density/Export buttons, 3 inputs | ✅ Parity | Admin `Users.jsx` exists |
| 4 | `orders` | Orders | DataGrid with Refresh/Filters/Export buttons, search input, 4 inputs total | ✅ Parity | Admin `Orders.jsx` exists |
| 5 | `front-partner` | Partner Logos | File upload (PNG/JPEG/JPG, max 200KB), Refresh button | ✅ Parity | In Admin `Settings.jsx` |
| 6 | `faq` | FAQ | Question/Answer form, "Add FAQ" button, Refresh button, 5 inputs | ✅ Parity | In Admin `Settings.jsx` |
| 7 | `manage-page` | Manage Pages | Page Title input, rich text editor, file upload, "Privacy Policy"/"Terms & Conditions" buttons, "Add" button | ✅ Parity | In Admin `Settings.jsx` |
| 8 | `testimonial` | Testimonial | Title/Description/Reviewer Name/Reviewer Position fields, "Add" button, 7 inputs | ✅ Parity | In Admin `Settings.jsx` |
| 9 | `contact-form` | Contact Leads | DataGrid with Filters/Export buttons, 3 inputs | ✅ Parity | In Admin `Settings.jsx` |
| 10 | `payment-gateways` | Payment Gateways | **21 input fields**: Razorpay (Key/Secret + toggle), Stripe (Key/Secret + toggle), PayPal (Key/Secret + toggle), Paystack (Key/Secret + toggle), **MercadoPago** (Public Key/Access Token + toggle), **Offline Payment** (Title/Description + toggle), "Save Settings" button | ⚠️ Partial | In Admin `Settings.jsx` — **MercadoPago and Offline Payment** sections may be missing in B1GCRM |
| 11 | `social-login` | Social Login | Google Client ID (with toggle), Facebook App ID + App Secret (with toggle), "Save" button, 7 inputs | ✅ Parity | In Admin `Settings.jsx` |
| 12 | `site-settings` | Application Configuration | **15 inputs**: Logo upload, App Name, Custom Home URL (with toggle), Login Signup toggle, Currency Code/Symbol/Exchange Rate, Meta Description, Tutorial URLs (Home Page/Chatbot/Broadcast), "Save Changes" button | ⚠️ Partial | In Admin `Settings.jsx` — **Tutorial URL fields, Custom Home URL toggle, Login Signup toggle, Exchange Rate** may be missing |
| 13 | `smtp` | SMTP Configuration | Email/Username/SMTP Host/Port/Password fields, "Save" + "Test Email" buttons, 7 inputs | ✅ Parity | In Admin `Settings.jsx` |
| 14 | `web-theme` | Theme Manager | **14 pre-built themes** (Default, Sunset, Forest, Violet, Sharp, Bubbly, Glass, Editorial, Cyber, Zen, Same, dark Ocean, WA Midnight, WA New), "Create New Theme" button, Edit/Set Active buttons per theme | ❌ Gap | B1GCRM: Placeholder — **Reference has a full theme manager with 14 themes + create/edit** |
| 15 | `translation` | Web Translation | Language list with Add New/Edit/Delete/Set Default per language (13+ languages), CRUD management | ❌ Gap | B1GCRM: Partial — **Reference has full language CRUD manager** |
| 16 | `update-web` | App Update | Current version (5.9.5), available update (5.9.9), "Update Now" button | ❌ Gap | B1GCRM: Partial — **Reference has a real updater page** |
| 17 | `wa-link` | WhatsApp Links | DataGrid with Filters/Export buttons, 3 inputs | ❌ Gap | B1GCRM: Placeholder — **Reference has a real data grid** |
| 18 | `flow-builder-template` | Flow Builder Templates | "Add New" button, template library view | ❌ Gap | B1GCRM: Placeholder — **Reference has real template library** |
| 19 | `qr-plugin-settings` | QR Plugin Setting | Save button, configuration form | ❌ Gap | B1GCRM: Placeholder — **Reference has real settings form** |
| 20 | `instagram-config` | Instagram Config | **Webhook Settings** section + **App Credentials** section (App ID, App Secret), "Save Settings" button, 3× "Copy to clipboard" buttons, 4 inputs | ❌ Gap | B1GCRM: Placeholder — **Reference has real Instagram webhook + app credential config** |
| 21 | `web-notification` | Web Notification | **Firebase App Config** (API Key, Auth Domain, Project ID, Storage Bucket, Messaging Sender ID, App ID, Measurement ID) + **Push & Service Account** (VAPID Key, Client Email, Private Key), "Save Changes" button, **12 inputs total** | ❌ Gap | B1GCRM: Placeholder — **Reference has comprehensive Firebase/VAPID push notification config** |
| 22 | `send-web-push` | Manual Web Push | 🎯 Select Audience section, 📝 Notification Type (Text Only / With Image), 👁️ Live Preview, Title/Body/Click URL fields, "Send Now (N recipients)" button, 6 inputs | ❌ Gap | B1GCRM: Placeholder — **Reference has full push notification sender with audience selector and preview** |
| 23 | `embed-config` | WA Embed Login | App Secret (password field), App ID, embed code display, "Save" + "Copy to clipboard" buttons, 5 inputs | ❌ Gap | B1GCRM: Placeholder — **Reference has real embed login config** |
| 24 | `telegram-config` | Telegram Config | Telegram API ID, Telegram API Hash inputs, "Save" button, link to `my.telegram.org`, 4 inputs | ❌ Gap | B1GCRM: Placeholder — **Reference has real Telegram API config** |

### Admin Pages That Fell Back to Dashboard

| # | Reference Slug | Notes |
| --- | --- | --- |
| 25 | `settings` | Falls back to dashboard — admin settings are accessed via individual sub-pages listed above |

---

## 3. AGENT PORTAL

| # | Reference Slug | Reference Features | B1GCRM Status | Notes |
| --- | --- | --- | --- | --- |
| 1 | `dashboard` / Chats | Navigation: Chats, My Tasks, Logout. Agent profile display. Inbox with All/Unread/Read filter, multi-channel support (Instagram, Telegram), search bar | ✅ Parity | `agent/Dashboard.jsx` + `agent/Inbox.jsx` |
| 2 | My Tasks | Task list for agent | ✅ Parity | Agent can view and update tasks |

> **Note**: Agent Auto-Login via the user portal did not work during this crawl session. Agent portal data is supplemented from the existing `docs/reference-pages/live-crawl/agent/` markdown captures.

---

## 4. B1GCRM-EXCLUSIVE FEATURES (Not in Reference)

These features exist in B1GCRM but have **no equivalent** in the reference CRM:

| # | B1GCRM Feature | Component | Description |
| --- | --- | --- | --- |
| 1 | **Lead Pipeline (CRM Pipeline)** | `CrmPipeline.jsx` (23KB) | Drag-and-drop sales pipeline board for managing leads through stages |
| 2 | **AI Providers Settings** | `AiProviderSettings.jsx` (9KB) | Configure multiple AI providers (OpenAI, Anthropic, etc.) for chatbot intelligence |
| 3 | **Knowledge Base** | `KnowledgeBase.jsx` (9KB) | Document/FAQ knowledge base for AI-powered chatbot responses |
| 4 | **Websites Manager** | `WebsiteManager.jsx` (15KB) | Multi-website management and configuration panel |
| 5 | **Supervisor Dashboard** | `SupervisorDashboard.jsx` (10KB) | Real-time agent supervision with performance metrics |

---

## 5. REFERENCE SIDEBAR NAVIGATION STRUCTURE

### User Portal Sidebar (from crawl text extract)

```
Dashboard
Inbox
Kabnan (Kanban)
WhatsApp Forms

── INSTAGRAM ──
Link Instagram [NEW]
Insta DM Bot [NEW]
Insta Comment DM [NEW]

── WHATSAPP QR PLUGIN ──
Add WhatsApp by QR
WhatsApp Warmer
Rest API

── WA META CONNECT ──
Link Meta WhatsApp

── AUTOMATION & BOTS ──
Automation Flows
WA Chatbot

── BROADCASTING ──
Create Meta Template
Send Campaign
Campaign Dashboard
Phonebook

── AI WHATSAPP CALLING ──
Create Call Flow
WA Call Logs
Setup WA Calls

── META REST API ──
Conversational API
Template API
API Dashboard

── WEBHOOK AUTOMATION ──
Manage Webhooks
Webhook Automation
Webhook Logs

── TELEGRAM PLUGIN ──
Telegram Sessions

── MORE OPTIONS ──
Web Notification
Agent Login
Agent Task
Chat Widget
```

### Admin Portal Sidebar (from crawl text extract)

```
Dashboard

── USERS & PLANS ──
Manage Plans
Manage Users
Orders

── FRONT-END CONTENT ──
Front Partners
FAQ
Manage Pages
Testimonial
Contact Form

── DATA & INTEGRATIONS ──
WA Links data
Payment Gateways
Flowbuilder Template

── SETTINGS ──
Theme Settings
Social Login
Site Settings
SMTP
Web Translation
Update Web

── PRO PLUGINS ──
QR Plugin Settings
Instagram Config
Web Notification
Manual Web Push
WA Embed Login
Telegram Config
```

### Agent Portal Sidebar

```
Agent Panel
── NAVIGATION ──
Chats
My Tasks
Logout
```

---

## 6. PRIORITY GAP ANALYSIS — What to Build Next

### Tier 1: High-Value Real Pages on Reference (Previously Thought to Be Placeholders)

These were marked as "placeholder" in B1GCRM but are **fully functional** on the reference CRM:

| Priority | Feature | Reference Page | Effort Est. | Impact |
| --- | --- | --- | --- | --- |
| 🔴 1 | **Webhook Logs Viewer** | `webhook-logs` — Full MUI DataGrid with 14 inputs, columns, filters, density, export | 3 days | High — customers need webhook debugging |
| 🔴 2 | **Webhook Automation CRUD** | `webhook-automation` — Add Webhook button, webhook list | 2 days | High — separate from manage-webhooks |
| 🔴 3 | **Instagram Account Linking** | `link-instagram` — Real "Add" button, account connection UI | 3 days | High — omnichannel support |
| 🔴 4 | **AI Call Flow Builder** | `create-call-flow` — Welcome message, OpenAI API key, system instructions | 4 days | Medium — AI calling is a premium feature |
| 🔴 5 | **WA Call Logs Viewer** | `wa-call-logs` — Call log data grid with filters | 2 days | Medium — paired with call flow builder |
| 🟡 6 | **Telegram Sessions Manager** | `telegram-sessions` — Add New Session, session cards | 3 days | Medium — channel expansion |
| 🟡 7 | **API Dashboard Logs Grid** | `api-dashboard` — Dedicated API logs DataGrid (separate from REST API docs) | 2 days | Medium — developer experience |
| 🟡 8 | **Meta Template Carousel/Catalog** | `create-meta-template` — Standard + **Carousel** + **Catalog** types | 3 days | Medium — template variety |

### Tier 2: Admin Portal Gaps (Real Pages on Reference)

| Priority | Feature | Reference Page | Effort Est. | Impact |
| --- | --- | --- | --- | --- |
| 🔴 9 | **Theme Manager** | `web-theme` — 14 pre-built themes + create/edit themes | 4 days | High — white-label customization |
| 🔴 10 | **Instagram Config** | `instagram-config` — Webhook Settings + App Credentials | 2 days | High — enables Instagram integration |
| 🔴 11 | **Web Notification Config** | `web-notification` — 12-field Firebase/VAPID push config | 3 days | Medium — push notifications |
| 🔴 12 | **Manual Web Push Sender** | `send-web-push` — Audience selector, title/body/URL, live preview | 2 days | Medium — marketing tool |
| 🟡 13 | **Telegram Config** | `telegram-config` — API ID/Hash config | 1 day | Medium — enables Telegram |
| 🟡 14 | **WA Embed Login Config** | `embed-config` — App Secret/ID + embed code | 1 day | Low — niche feature |
| 🟡 15 | **Translation Manager** | `translation` — Full language CRUD | 3 days | Medium — internationalization |
| 🟡 16 | **Flow Builder Templates** | `flow-builder-template` — Template library + Add New | 2 days | Medium — starter templates |
| 🟡 17 | **WA Links Data Grid** | `wa-link` — DataGrid with filters/export | 2 days | Low — analytics |
| 🟡 18 | **QR Plugin Settings** | `qr-plugin-settings` — Configuration form | 1 day | Low — QR config |

### Tier 3: Existing Feature Enhancements

| Priority | Feature | Module | Effort Est. |
| --- | --- | --- | --- |
| 🟡 | MercadoPago + Offline Payment gateway support | Admin Settings (`payment-gateways`) | 2 days |
| 🟡 | Site Settings: Tutorial URLs, Custom Home URL toggle, Exchange Rate | Admin Settings (`site-settings`) | 1 day |
| 🟢 | App Update page | Admin (`update-web`) | 1 day |

---

## 7. REFERENCE SIDEBAR vs B1GCRM SIDEBAR — Navigation Comparison

### Items in Reference Sidebar But NOT in B1GCRM Sidebar

| Reference Sidebar Item | Category | B1GCRM Route Exists? | B1GCRM Nav Entry? |
| --- | --- | --- | --- |
| WhatsApp Forms | User | Yes (placeholder) | ❌ No nav entry |
| Insta DM Bot | User | Yes (placeholder) | ❌ No nav entry |
| Insta Comment DM | User | Yes (placeholder) | ❌ No nav entry |
| WhatsApp Warmer | User | Yes (placeholder) | ❌ No nav entry |
| Rest API | User | Yes (routes to DeveloperApi) | ❌ No nav entry |
| Send Campaign | User | Yes (routes to Campaigns) | ❌ No nav entry |
| Campaign Dashboard | User | Yes (routes to Campaigns) | ❌ No nav entry |
| Create Call Flow | User | Yes (placeholder) | ❌ No nav entry |
| WA Call Logs | User | Yes (placeholder) | ❌ No nav entry |
| Setup WA Calls | User | Yes (placeholder) | ❌ No nav entry |
| Conversational API | User | Yes (routes to DeveloperApi) | ❌ No nav entry |
| Template API | User | Yes (routes to DeveloperApi) | ❌ No nav entry |
| Webhook Automation | User | Yes (placeholder) | ❌ No nav entry |
| Webhook Logs | User | Yes (placeholder) | ❌ No nav entry |
| Web Notification | User | Yes (placeholder) | ❌ No nav entry |

### Items in B1GCRM Sidebar But NOT in Reference Sidebar

| B1GCRM Sidebar Item | Category | Notes |
| --- | --- | --- |
| Lead Pipeline | User | B1GCRM exclusive — CRM sales pipeline |
| AI Providers | User | B1GCRM exclusive — multi-AI config |
| Knowledge Base | User | B1GCRM exclusive — AI knowledge docs |
| Websites Manager | User | B1GCRM exclusive — multi-site management |
| Supervisor Dashboard | User | B1GCRM exclusive — agent supervision |

---

## 8. KEY OBSERVATIONS FROM LIVE CRAWL

### Important Discovery: Plan-Gated Pages

Several pages that appear in the reference sidebar but fall back to the dashboard when visited with the demo account are likely **gated behind paid plans** (Premium or Platinum). These include:
- `kanban`, `campaigns`, `billing`, `settings`, `integrations`, `add-whatsapp-qr`, `link-meta-whatsapp`, `rest-api`, `manage-webhooks`

This means B1GCRM may actually be **ahead** of the reference for demo-tier users on these pages, since B1GCRM shows these pages regardless of plan tier.

### Reference Uses `?page=` Query Routing

The reference CRM is a React SPA using MUI (Material UI) with `?page=<slug>` query parameter routing rather than path-based routing. B1GCRM uses standard React Router path-based routing (`/user/inbox` vs `/user?page=inbox`). This is a design choice difference, not a gap.

### Reference Admin Sidebar Has More Sections

The reference admin sidebar uses section grouping:
- **USERS & PLANS**: Dashboard, Manage Plans, Manage Users, Orders
- **FRONT-END CONTENT**: Partners, FAQ, Pages, Testimonial, Contact Form
- **DATA & INTEGRATIONS**: WA Links, Payment Gateways, Flow Templates
- **SETTINGS**: Theme, Social Login, Site Settings, SMTP, Translation, Update Web
- **PRO PLUGINS**: QR, Instagram, Notifications, Push, Embed, Telegram

B1GCRM admin sidebar has a flat list with 5 items. Consider adopting grouped sections for better organization.

### Agent Portal Has "My Tasks" Tab

The reference agent portal has 3 navigation items: **Chats**, **My Tasks**, **Logout**. B1GCRM agent portal has 2: **Workspace**, **Assigned Chats**. The "My Tasks" tab should be added to the agent portal.
