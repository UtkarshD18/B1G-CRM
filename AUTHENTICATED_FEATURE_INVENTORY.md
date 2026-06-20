# Authenticated Feature Inventory

Detailed inventory of every feature in the reference CRM, grouped by module, with implementation evidence from B1GCRM source code.

> [!IMPORTANT]
> **Source of truth:** This inventory is compiled from B1GCRM source code (`client/src/pages/`, `routes/`, `socket.js`), reference page Markdown captures (`docs/reference-pages/`), and authenticated browser screenshots. Runtime behavior takes precedence over documentation.

---

## Module 1: Dashboard

### User Dashboard
| Feature | Reference | B1GCRM Implementation | Evidence |
| --- | --- | --- | --- |
| KPI Cards (Chats, Chatbots, Contacts, Flows) | ✅ | ✅ Complete | `Dashboard.jsx` L49-53, API: `GET /api/user/get_dashboard` |
| Monthly time-series charts (Open / Resolved) | ✅ | ✅ Complete | `Dashboard.jsx` L55-57, `DashboardSeries` component |
| Plan status display | ✅ | ❌ Missing | Not rendered on user dashboard |

### Admin Dashboard
| Feature | Reference | B1GCRM Implementation | Evidence |
| --- | --- | --- | --- |
| Global tenant metrics | ✅ | ✅ Complete | `admin/Dashboard.jsx`, API: `GET /api/admin/get_dashboard_for_user` |
| Revenue overview | ✅ | ❌ Missing | No revenue aggregation on admin dashboard |

---

## Module 2: Inbox

| Feature | Reference | B1GCRM Implementation | Evidence |
| --- | --- | --- | --- |
| 3-panel layout (list / thread / context) | ✅ | ✅ Complete | `Inbox.jsx` L359-588 |
| Real-time Socket.IO messaging | ✅ | ✅ Complete | Socket events: `get_chat`, `on_open_chat`, `send_chat_message` |
| Channel filter (All / WhatsApp / Instagram / Website) | ✅ | ✅ Complete | `Inbox.jsx` L7-12, L378-389 |
| Search by name/number/note/tag | ✅ | ✅ Complete | `Inbox.jsx` L391-395 |
| Read/Unread filter | ✅ | ✅ Complete | `Inbox.jsx` L396-400 |
| Text message sending | ✅ | ✅ Complete | `Inbox.jsx` L270-298 |
| Media upload (image/video/doc/audio) | ✅ | ✅ Complete | `Inbox.jsx` L300-349, API: `POST /api/user/return_media_url` |
| Chat notes (internal) | ✅ | ✅ Complete | `Inbox.jsx` L228-248, API: `POST /api/user/save_note` |
| Agent assignment selector | ✅ | ✅ Complete | `Inbox.jsx` L250-268 |
| Chat labels/tags display | ✅ | ✅ Complete | `Inbox.jsx` L574-584 |
| Label/tag management (add/remove) | ✅ | ⚠️ Partial | Tags displayed but no add/remove UI buttons |
| Contact avatar with initials | ✅ | ✅ Complete | `Inbox.jsx` L57-69 |
| Ticket status display (Open/Pending/Solved) | ✅ | ✅ Complete | `Inbox.jsx` L93-102 |
| Quick reply templates | ✅ | ❌ Missing | No quick-reply template dropdown in composer |
| Emoji picker | ✅ | ❌ Missing | No emoji picker integration |
| Message read receipts (ticks) | ✅ | ❌ Missing | No delivery/read status indicators |
| Message reactions | ✅ | ❌ Missing | No reaction support |
| Media preview bubbles (image/video) | ✅ | ❌ Missing | Messages render as text only |

---

## Module 3: Kanban

| Feature | Reference | B1GCRM Implementation | Evidence |
| --- | --- | --- | --- |
| Column-based board (Open / Pending / Solved) | ✅ | ✅ Complete | `Kanban.jsx` L6-10 |
| Drag-and-drop status change | ✅ | ❌ Missing | Status change via button click only |
| Chat card with contact name + number | ✅ | ✅ Complete | `Kanban.jsx` |
| Timestamp display | ✅ | ✅ Complete | Uses `formatRelativeTimestamp` |

---

## Module 4: Contacts & Phonebooks

| Feature | Reference | B1GCRM Implementation | Evidence |
| --- | --- | --- | --- |
| Phonebook group CRUD | ✅ | ✅ Complete | `Contacts.jsx`, API: `POST /api/phonebook/add`, `POST /api/phonebook/del_phonebook` |
| CSV contact import | ✅ | ✅ Complete | `Contacts.jsx`, API: `POST /api/phonebook/import_contacts` |
| Single contact add form (name, mobile, var1-5) | ✅ | ✅ Complete | `Contacts.jsx` L14-23 |
| Contacts table with checkbox selection | ✅ | ✅ Complete | `Contacts.jsx` |
| Bulk delete selected contacts | ✅ | ✅ Complete | API: `POST /api/phonebook/del_contacts` |
| Contact search / filter | ✅ | ❌ Missing | No search input on contacts page |
| Contact detail view | ✅ | ❌ Missing | No click-to-view contact detail panel |
| Duplicate detection | ✅ | ❌ Missing | No duplicate finder |

---

## Module 5: Campaigns (Broadcasting)

| Feature | Reference | B1GCRM Implementation | Evidence |
| --- | --- | --- | --- |
| Campaign workspace (list view) | ✅ | ✅ Complete | `Campaigns.jsx` L669-733 |
| Send campaign form (template + phonebook + schedule) | ✅ | ✅ Complete | `Campaigns.jsx` L553-667 |
| Template variable mapping | ✅ | ✅ Complete | `Campaigns.jsx` L625-661 |
| Campaign dashboard with aggregate delivery metrics | ✅ | ✅ Complete | `Campaigns.jsx` L446-551 |
| Date range filter on dashboard | ✅ | ✅ Complete | `Campaigns.jsx` L447-478 |
| Per-campaign delivery log inspection | ✅ | ✅ Complete | `Campaigns.jsx` L735-776 |
| Campaign status management (Queue/Pause/Delete) | ✅ | ✅ Complete | `Campaigns.jsx` L693-722 |
| Delivery trend chart | ✅ | ✅ Complete | CSS bar chart in `Campaigns.jsx` L519-531 |
| Template usage chart | ✅ | ✅ Complete | `Campaigns.jsx` L533-549 |
| Campaign background loop executor | ✅ | ✅ Complete | `loops/campaignLoop.js` |

---

## Module 6: Automation Flows (Flow Builder)

| Feature | Reference | B1GCRM Implementation | Evidence |
| --- | --- | --- | --- |
| Visual canvas (ReactFlow) | ✅ | ✅ Complete | `AutomationFlows.jsx` uses `@xyflow/react` |
| Node palette (Trigger, Text, Image, Document, Location, Quick Reply, AI) | ✅ | ✅ Complete | `AutomationFlows.jsx` L22-30 |
| Drag-and-drop node placement | ✅ | ✅ Complete | ReactFlow handlers L619-660 |
| Edge connection with source handles | ✅ | ✅ Complete | `AutomationFlows.jsx` L635-646 |
| Node property editor panel | ✅ | ✅ Complete | Selected node editing L662-734 |
| Bot-ready template generator | ✅ | ✅ Complete | `buildBotReadyFlow()` L161-195 |
| Flow CRUD (create/save/delete) | ✅ | ✅ Complete | APIs: `POST /api/chat_flow/add_new`, `POST /api/chat_flow/del_flow` |
| Flow activity log viewer | ✅ | ✅ Complete | API: `POST /api/chat_flow/get_activity` |
| JSON editor (nodes/edges) | ✅ | ✅ Complete | Raw JSON textarea editing |
| MiniMap + Controls | ✅ | ✅ Complete | ReactFlow MiniMap + Controls components |

---

## Module 7: Chatbot

| Feature | Reference | B1GCRM Implementation | Evidence |
| --- | --- | --- | --- |
| Chatbot CRUD form | ✅ | ✅ Complete | `ChatBot.jsx` L252-329 |
| Flow binding selector | ✅ | ✅ Complete | `ChatBot.jsx` L266-276 |
| Origin selector (Meta/QR) | ✅ | ✅ Complete | `ChatBot.jsx` L277-283 |
| "Run on all chats" toggle | ✅ | ✅ Complete | `ChatBot.jsx` L285-298 |
| Chat target checkboxes | ✅ | ✅ Complete | `ChatBot.jsx` L311-324 |
| Bot status toggle (Activate/Deactivate) | ✅ | ✅ Complete | `ChatBot.jsx` L181-199 |
| Diagnostic log viewer | ✅ | ✅ Complete | `ChatBot.jsx` L384-420 |
| Bot summary cards | ✅ | ✅ Complete | `ChatBot.jsx` L233-250 |

---

## Module 8: Meta Templates

| Feature | Reference | B1GCRM Implementation | Evidence |
| --- | --- | --- | --- |
| Template creation form (name, language, category) | ✅ | ✅ Complete | `MetaTemplates.jsx` |
| Header types (None/Text/Image/Video/Document) | ✅ | ✅ Complete | `MetaTemplates.jsx` |
| Body text with variable interpolation | ✅ | ✅ Complete | `MetaTemplates.jsx` |
| Footer text | ✅ | ✅ Complete | `MetaTemplates.jsx` |
| Button builder (Quick Reply/URL/Phone) | ✅ | ✅ Complete | `MetaTemplates.jsx` |
| Media file upload for header | ✅ | ✅ Complete | API: `POST /api/user/return_media_url_meta` |
| Template submission to Meta API | ✅ | ✅ Complete | API: `POST /api/user/add_meta_templet` |
| Template list + delete | ✅ | ✅ Complete | API: `GET /api/user/get_my_meta_templets`, `POST /api/user/del_meta_templet` |
| Live JSON preview | ✅ | ✅ Complete | `MetaTemplates.jsx` renders JSON preview |

---

## Module 9: Integrations

| Feature | Reference | B1GCRM Implementation | Evidence |
| --- | --- | --- | --- |
| WhatsApp connection methods overview cards | ✅ | ✅ Complete | `Integrations.jsx` |
| Meta WhatsApp Business API credential form | ✅ | ✅ Complete | `Integrations.jsx`, API: `POST /api/user/update_meta` |
| QR code WhatsApp link page | ✅ | ⚠️ Broken | UI renders but Baileys helper is stubbed |
| Instagram DM link page | ✅ | 🔲 Placeholder | Route exists, `ReferenceModulePage` rendered |
| Telegram sessions | ✅ | 🔲 Placeholder | Route exists, `ReferenceModulePage` rendered |

---

## Module 10: Developer API & Webhooks

| Feature | Reference | B1GCRM Implementation | Evidence |
| --- | --- | --- | --- |
| API key generation + display | ✅ | ✅ Complete | `DeveloperApi.jsx`, API: `GET /api/user/generate_api_keys` |
| Send-message REST API docs | ✅ | ✅ Complete | `DeveloperApi.jsx` with code samples |
| Template-message REST API docs | ✅ | ✅ Complete | `DeveloperApi.jsx` |
| Webhook rules CRUD | ✅ | ✅ Complete | `DeveloperApi.jsx`, API: `POST /api/webhooks/rules` |
| Webhook execution logs viewer | ✅ | ❌ Missing | No logs table or API endpoint |
| API rate limiting | ✅ | ❌ Missing | No rate limit middleware |

---

## Module 11: Agent Management

| Feature | Reference | B1GCRM Implementation | Evidence |
| --- | --- | --- | --- |
| Agent accounts CRUD (name, email, mobile, password) | ✅ | ✅ Complete | `AgentLogin.jsx`, API: `POST /api/agent/add_agent`, `DELETE /api/agent/del_agent` |
| Auto-login token generation | ✅ | ✅ Complete | API: `POST /api/user/auto_agent_login` |
| Agent task card CRUD | ✅ | ✅ Complete | `AgentTask.jsx`, API: `POST /api/user/add_task_for_agent` |
| Agent task status updates | ✅ | ✅ Complete | Agent portal task management |

---

## Module 12: Chat Widget

| Feature | Reference | B1GCRM Implementation | Evidence |
| --- | --- | --- | --- |
| Widget config form (title, color, position, avatar) | ✅ | ✅ Complete | `ChatWidget.jsx` |
| JS embed snippet generator | ✅ | ✅ Complete | `ChatWidget.jsx` generates `<script>` code |
| Widget preview | ✅ | ❌ Missing | No live preview rendering |
| Widget CRUD | ✅ | ✅ Complete | API: `POST /api/user/add_widget`, `POST /api/user/del_widget` |

---

## Module 13: Billing

| Feature | Reference | B1GCRM Implementation | Evidence |
| --- | --- | --- | --- |
| Plan pricing cards | ✅ | ✅ Complete | `Billing.jsx` |
| Current plan display | ✅ | ✅ Complete | `Billing.jsx` |
| Stripe checkout session | ✅ | ⚠️ Partial | API exists but webhook verification incomplete |
| Razorpay checkout | ✅ | ⚠️ Partial | API exists, frontend handler present |
| PayPal checkout | ✅ | ⚠️ Partial | API exists, frontend handler present |
| Paystack checkout | ✅ | ⚠️ Partial | API exists, frontend handler present |
| Free trial start | ✅ | ✅ Complete | API: `POST /api/user/start_free_trial` |
| Payment gateway status display | ✅ | ✅ Complete | `Billing.jsx` shows enabled gateways |

---

## Module 14: Settings

### User Settings
| Feature | Reference | B1GCRM Implementation | Evidence |
| --- | --- | --- | --- |
| Profile editor (name, email, mobile, timezone) | ✅ | ✅ Complete | `Settings.jsx`, API: `POST /api/user/update_profile` |
| Password change | ✅ | ✅ Complete | `Settings.jsx` |
| API key display | ✅ | ✅ Complete | `Settings.jsx` |
| Plan status display | ✅ | ✅ Complete | `Settings.jsx` |

### Admin Settings
| Feature | Reference | B1GCRM Implementation | Evidence |
| --- | --- | --- | --- |
| Payment gateway configuration | ✅ | ✅ Complete | `admin/Settings.jsx` |
| Brand logo upload (partners) | ✅ | ✅ Complete | `admin/Settings.jsx`, API: `POST /api/admin/add_brand_image` |
| FAQ CRUD | ✅ | ✅ Complete | APIs: `POST /api/admin/add_faq`, `POST /api/admin/del_faq` |
| Page CRUD | ✅ | ✅ Complete | APIs: `POST /api/admin/add_page`, `POST /api/admin/del_page` |
| Testimonial CRUD | ✅ | ✅ Complete | APIs: `POST /api/admin/add_testimonial`, `POST /api/admin/del_testi` |
| SMTP configuration | ✅ | ✅ Complete | APIs: `GET /api/admin/get_smtp`, `POST /api/admin/update_smtp` |
| Social login settings | ✅ | ⚠️ Partial | OAuth client IDs stored but callback flow incomplete |
| Site settings (title, meta) | ✅ | ✅ Complete | Admin settings form |
| Terms of Service / Privacy Policy | ✅ | ✅ Complete | APIs: `POST /api/admin/update_terms`, `POST /api/admin/update_privacy_policy` |

---

## Module 15: Agent Portal

| Feature | Reference | B1GCRM Implementation | Evidence |
| --- | --- | --- | --- |
| Agent dashboard with assigned chats | ✅ | ✅ Complete | `agent/Dashboard.jsx` (201 lines) |
| Message thread viewer | ✅ | ✅ Complete | Agent dashboard includes conversation view |
| Task status updates | ✅ | ✅ Complete | Agent can update task status |
| Agent profile editor | ✅ | ❌ Missing | No agent self-service profile page |

---

## Module 16: Newly Discovered Real Pages (June 20, 2026 Crawl)

> [!IMPORTANT]
> The following pages were previously classified as "placeholder" in B1GCRM, but a live crawl on June 20, 2026 confirmed they are **fully functional pages** on the reference CRM with real forms, data grids, and CRUD operations.

### User Portal — Real Pages on Reference, Placeholder in B1GCRM

| Feature | Reference Route | Reference UI Elements | B1GCRM Status | Priority |
| --- | --- | --- | --- | --- |
| **Webhook Logs Viewer** | `webhook-logs` | Full MUI DataGrid: Columns/Filters/Density/Export, 14 inputs, heading "Webhook Logs" | ❌ Placeholder in B1GCRM | 🔴 High |
| **Webhook Automation CRUD** | `webhook-automation` | "Add Webhook" button, empty state "No Webhooks Yet" | ❌ Placeholder in B1GCRM | 🔴 High |
| **Instagram Account Linking** | `link-instagram` | "Add" button ×2, heading "No accounts connected yet" | ❌ Placeholder in B1GCRM | 🔴 High |
| **AI Call Flow Builder** | `create-call-flow` | Welcome Message textarea, OpenAI API Key (`sk-...`), System Instructions textarea, 5 inputs | ❌ Placeholder in B1GCRM | 🟡 Medium |
| **WA Call Logs** | `wa-call-logs` | Call log viewer with checkbox filters, heading "WA Call Logs" | ❌ Placeholder in B1GCRM | 🟡 Medium |
| **Telegram Sessions** | `telegram-sessions` | "Add New Session" button, session card "Wacrm" with "Account Information" | ❌ Placeholder in B1GCRM | 🟡 Medium |
| **API Dashboard Logs** | `api-dashboard` | API Logs DataGrid with Filters/Export, 6 inputs (checkboxes + search) | ⚠️ Partial (B1GCRM shows API key/docs but not logs grid) | 🟡 Medium |

### Admin Portal — Real Pages on Reference, Placeholder in B1GCRM

| Feature | Reference Route | Reference UI Elements | B1GCRM Status | Priority |
| --- | --- | --- | --- | --- |
| **Theme Manager** | `web-theme` | 14 pre-built themes + "Create New Theme" + Edit/Set Active per theme | ❌ Placeholder in B1GCRM | 🔴 High |
| **Instagram Config** | `instagram-config` | Webhook Settings + App Credentials (App ID, App Secret), "Save Settings", 3× "Copy to clipboard" | ❌ Placeholder in B1GCRM | 🔴 High |
| **Web Notification Config** | `web-notification` | Firebase App Config (7 fields) + Push & Service Account (VAPID Key, Client Email, Private Key), 12 inputs total | ❌ Placeholder in B1GCRM | 🟡 Medium |
| **Manual Web Push** | `send-web-push` | Audience selector, Text Only/With Image toggle, Title/Body/URL, Live Preview, "Send Now (N recipients)" | ❌ Placeholder in B1GCRM | 🟡 Medium |
| **Telegram Config** | `telegram-config` | Telegram API ID/Hash inputs, "Save" button, link to `my.telegram.org` | ❌ Placeholder in B1GCRM | 🟡 Medium |
| **WA Embed Login** | `embed-config` | App Secret/App ID + embed code display, "Save"/"Copy to clipboard" buttons | ❌ Placeholder in B1GCRM | 🟡 Medium |
| **Translation Manager** | `translation` | Language list with Add New/Edit/Delete/Set Default per language (13+ languages) | ❌ Placeholder in B1GCRM | 🟡 Medium |
| **Flow Builder Templates** | `flow-builder-template` | Template library view, "Add New" button | ❌ Placeholder in B1GCRM | 🟡 Medium |
| **WA Links Data** | `wa-link` | DataGrid with Filters/Export, 3 inputs | ❌ Placeholder in B1GCRM | 🟢 Low |
| **QR Plugin Settings** | `qr-plugin-settings` | Configuration form, "Save" button | ❌ Placeholder in B1GCRM | 🟢 Low |

---

## Module 17: True Both-Placeholder Pages

These pages exist in the reference sidebar but **fall back to the dashboard** when visited (plan-gated or stub on both sides):

| Feature | Reference Route | B1GCRM Status | Notes |
| --- | --- | --- | --- |
| WhatsApp Forms | `whatsapp-forms` | 🔲 Both Placeholder | Falls back to dashboard on reference |
| Instagram DM Bot | `insta-dm-bot` | 🔲 Both Placeholder | Falls back to dashboard on reference |
| Instagram Comment DM | `insta-comment-dm` | 🔲 Both Placeholder | Falls back to dashboard on reference |
| WhatsApp Warmer | `whatsapp-warmer` | 🔲 Both Placeholder | Falls back to dashboard on reference |
| Setup WA Calls | `setup-wa-calls` | 🔲 Both Placeholder | Falls back to dashboard on reference |
| Web Notification (User) | `web-notification` | 🔲 Both Placeholder | Falls back to dashboard on reference |

---

## Module 18: B1GCRM-Exclusive Features (Not in Reference)

| Feature | Component | Size | Description |
| --- | --- | --- | --- |
| **Lead Pipeline** | `CrmPipeline.jsx` | 23KB | Drag-and-drop sales pipeline board |
| **AI Providers** | `AiProviderSettings.jsx` | 9KB | Multi-AI provider configuration |
| **Knowledge Base** | `KnowledgeBase.jsx` | 9KB | AI-powered knowledge document management |
| **Websites Manager** | `WebsiteManager.jsx` | 15KB | Multi-website management panel |
| **Supervisor Dashboard** | `SupervisorDashboard.jsx` | 10KB | Real-time agent supervision metrics |

---

## Module 19: Meta Template Type Gap (June 20, 2026 Discovery)

| Feature | Reference | B1GCRM Implementation | Evidence |
| --- | --- | --- | --- |
| Standard template type | ✅ | ✅ Complete | `MetaTemplates.jsx` |
| **Carousel template type** | ✅ | ❌ Missing | Reference shows "Carousel" as second template type option |
| **Catalog template type** | ✅ | ❌ Missing | Reference shows "Catalog" as third template type option |

---

## Summary Statistics

| Metric | Count |
| --- | --- |
| **Total reference features audited** | 145 |
| **✅ Complete** | 88 (61%) |
| **⚠️ Partial** | 10 (7%) |
| **❌ Missing (real gaps)** | 30 (21%) |
| **🔲 Both Placeholder** | 6 (4%) |
| **🆕 B1GCRM Exclusive** | 5 |
| **Frontend pages (User)** | 15 implemented + 11 placeholder |
| **Frontend pages (Admin)** | 5 implemented + 8 placeholder |
| **Frontend pages (Agent)** | 2 implemented |
| **Backend route files** | 13 (14,300 lines) |
| **Total frontend LOC** | ~6,200 (user) + ~1,200 (admin) + ~200 (agent) |
| **Last full crawl** | June 20, 2026 |

