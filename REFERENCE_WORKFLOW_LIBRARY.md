# Reference CRM Workflow Library

This document compiles the interactive workflows, associated UI components, required backend API endpoints, and implementation notes extracted from the live reference CRM.

---

## 1. Definitive Workflow Directory

| Page / Route | Workflow | Components Used | Required Backend API | Notes |
| :--- | :--- | :--- | :--- | :--- |
| `/user/login` | User Authentication | Login Card, Email Input, Password Input, "Autofill" Button, Submit Button | `POST /api/user/login` | Populates demo user session on click of Autofill. |
| `/admin/login` | Super-Admin Authentication | Login Card, Email Input, Password Input, "Autofill" Button, Submit Button | `POST /api/admin/login` | Restricts access to global admin panels. |
| `/agent/login` | Agent Authentication | Token URL Parameter Checker, Direct Login Card | `POST /api/agent/login` | Supports JWT token-based direct entry. |
| `/admin?page=manage-users` | Tenant Impersonation (Auto-Login) | Users Data Grid, "Auto Login" Button | `POST /api/admin/auto_login` (custom sign) | Generates JWT for tenant UID and redirects to `/user`. |
| `/user?page=agent-login` | Agent Impersonation (Auto-Login) | Agent Table Grid, "Auto Login" Button | `POST /api/user/auto_agent_login` | signs agent JWT and opens `/agent/login?token=<jwt>` in new tab. |
| `/user?page=phonebook` | Contact CSV Import | Phonebook Dropdown, File Upload Picker, Parse Dialog | `POST /api/phonebook/import_csv` | Parses CSV rows, cleans phone number strings, checks duplicates. |
| `/user?page=phonebook` | Individual Contact CRUD | Add Contact Button, Dialog Form, Phone Input | `POST /api/phonebook/add_contact` | Binds custom variables `var1` through `var5` per record. |
| `/user?page=add-whatsapp-qr` | WhatsApp QR Pairing | Card Container, SVG QR Image element, Socket Event Listener | `/api/qr/create`, WebSockets | Pairs WhatsApp session using Baileys QR sync. |
| `/user?page=wa-chatbot` | Chatbot Trigger Binding | Trigger Words Input, Flow Select Dropdown, Active State Switch | `POST /api/chatbot/add_rule` | Maps matching incoming words to visual automation flows. |
| `/user?page=automation-flows` | Flow Design & Export | Canvas Area (ReactFlow), Node Editor Panel, Save Button | `POST /api/chat_flow/save_flow` | Serializes node/edge coordinates and rules as JSON on disk. |
| `/user?page=campaign-dashboard` | Campaign Scheduling | Name Input, Phonebook Selector, Template Selector, Date/Time Scheduler | `POST /api/broadcast/schedule` | Adds campaign dispatch job to loops database runner. |
| `/user?page=chat-widget` | Web Chat Widget Configurator | Color Pickers, Position Selector, Text Inputs, Script Snippet Visualizer | `POST /api/user/update_widget` | Exposes a raw embeddable script pointing to local socket bridge. |
| `/user?page=manage-webhooks` | Webhook Rule Setup | Target URL Input, Event Dropdown, operator matches | `POST /api/webhooks/add_rule` | Triggers POST dispatches on matching realtime socket payloads. |
| `/user?page=billing` | Paid Plan Upgrade | Plan Cards, Quota Indicators, Stripe/PayPal Checkout Buttons | `POST /api/user/checkout_session` | Redirects to third-party secure payment gateway portals. |
| `/agent?page=dashboard` | Support Inbox Management | Chat List, Assigned Threads, Text Area, Attachment Buttons | `POST /api/inbox/send_chat_message` | Displays unassigned or agent-assigned realtime chats. |

---

## 2. Global Navigation & Layout Architecture

*   **Structure:** Standard Two-Pane SaaS Portal. Left: Navigation Drawer Sidebar. Right: Central Main Canvas Container with a top Header (containing profile menus, language switchers, and quick action icons).
*   **Routing Mechanism:** Query-parameter based portal navigation. The React app handles central routing by detecting the `?page=<slug>` parameter and dynamically rendering the corresponding subpage component.
*   **Impersonation Design:** Both Admin-to-User and User-to-Agent flows are designed as single-click operations that generate short-lived JWT payloads which bypass standard username/password forms on direct URL entry.
