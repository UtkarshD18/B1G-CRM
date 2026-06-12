# B2B SaaS CRM - Implementation & Architecture Roadmap

## 1. Project Overview
**Goal:** Build a complete industry-level WhatsApp/Omnichannel CRM SaaS capable of handling multiple tenants (Users) and their staff (Agents), monitored by a global super-admin. 
**Reference UI:** `crm.oneoftheprojects.com`

---

## 2. Architecture & Data Flow

### 2.1 The 3-Portal System
The CRM is divided into three distinct portal applications sharing one backend:
1. **Admin Portal (`/admin`):** Global SaaS configuration. Manages SaaS pricing plans, user accounts, orders, front-end CMS (pages, FAQs, testimonials), payment gateways, SMTP, and translation data.
2. **User Portal (`/user`):** The Tenant Workspace. Here, SaaS clients connect their WhatsApp/Instagram/Telegram, build Chatbot/Flowbuilder templates, send broadcast campaigns, manage contacts, and configure integrations (Webhooks, API keys).
3. **Agent Portal (`/agent`):** The Staff Workspace. Stripped-down interface where support/sales staff manage assigned chats and view tasks. 

### 2.2 Agent Module Integration & Permissions
Agents are deeply tied to the parent **User** (Tenant) via the `owner_uid`:
*   **Creation:** Created in the User Portal (`/api/agent/add_agent`).
*   **Impersonation (Auto-Login):** Users have an `auto_agent_login` function. The backend generates a valid Agent JWT on the fly, allowing the User to click to jump directly into the Agent's portal in a new tab without knowing their password.
*   **Permissions Engine:** Agent requests pass through the `validateAgent` middleware. It checks `is_active` and retrieves the `owner_uid` account. 
*   **Data Isolation:** `routes/agent.js` checks the `agent_chats` relational table. Agents only receive conversations explicitly assigned to their `uid` by the parent User.
*   **Real-time Socket Flow:** `socket.js` registers incoming connections with both `uid` and `owner_uid`. Incoming messages to the business trigger `sendToUid(owner_uid)`. The router naturally pushes the message to both the User and any Agent whose `owner_uid` matches.

---

## 3. Client Site Integration Strategies
How SaaS Users connect their external websites/systems to this CRM:
*   **Chat Widget:** Embed JS script injected into the client website. Opens a socket connection bridging website visitors to the User's inbox.
*   **Contact Forms / WhatsApp Forms:** Hosted iframes natively linked to the Flowbuilder.
*   **Webhooks:** External e-commerce sites (Shopify, WP) fire POST requests to `/api/inbox/webhook/:uid`.
*   **Conversational REST API:** Programmable API keys (`/generate_api_keys`) allowing users to script message triggers.

---

## 4. Work Breakdown & Implementation Phases

### Phase 1: Repository Foundation & Cleanup
*   Clean up `__MACOSX`, `.DS_Store`, and unnecessary generated template files from the current folder.
*   Structure the `./client` directory as a pure React SPA (React + Vite only). We will NOT use Next.js or other SSR frameworks.
*   Setup environment variable handling for frontend (`VITE_API_URL`).
*   Establish frontend engineering guardrails: Jest, React Testing Library, baseline tests, and an opt-in React Profiler workflow for local performance checks.

### Phase 2: Frontend App Shell & Auth (Figma Execution)
*   **UI/UX Reference:** Exact match to the corporate B2B SaaS aesthetics and UX of `https://crm.oneoftheprojects.com`. 
*   **Design Tokens:** Dark Mode default (`Background: #0F172A`, `Surface: #1E293B`, `Primary Brand: #00A389`, `Warning: #F59E0B`).
*   **Layout Component:** Global Sidebar (collapsible) + Topbar (Language, Theme Toggle, Profile).
*   **Routing:** 
    *   `/admin/login` -> Admin App Shell
    *   `/user/login` -> User App Shell
    *   `/agent/login` -> Agent App Shell
*   **Auth State Management:** Zustand/Redux or React Context storing the decoded JWT role and routing unauthorized users away.

### Phase 3: High-Priority Module Integration
*   **SaaS Core (Admin):** Plans, Users list, SMTP config, and Theme updates (wiring `routes/admin.js`).
*   **Connections (User):** WhatsApp QR linking, Meta Cloud API hookup.
*   **Inbox (User/Agent):** 3-panel chat interface fetching `routes/inbox.js` and pushing through `socket.js`.

### Phase 4: Operational Automation
*   Build the React Flow (Node-based) UI for Chatbot/Flowbuilder (`/api/chat_flow`).
*   Broadcast Campaigns & Meta Templates list.
*   Phonebook and Contact Management.

---

## 5. Team Distribution & Sprint Allocation (3 Developers)
To run this parallelly across a 3-person team, the workload is distributed as follows:

### Dev 1: Lead Frontend Engineer (UI/UX & React)
**Focus:** Visuals, App Shell, Routing, and Components.
*   Setup Vite + React architecture in the `/client` directory.
*   Build the global UI component library based on the Figma guidelines (Dark mode, Teal accents, exact button/input states).
*   Create the 3 core Application Shell layouts (Admin, User, Agent sidebars and topbars).
*   Build the data tables (Users, Orders, Campaigns) and the Kanban board UI.

### Dev 2: Backend Software Engineer (Integrations & Core API)
**Focus:** External APIs, Payments, Database logic.
*   Finalize and stabilize the REST API routes (`admin.js`, `user.js`).
*   Handle WhatsApp QR code pairing logic and Meta Official API endpoints.
*   Integrate Payment Gateways (Stripe, Razorpay, PayPal).
*   Handle SMTP email pipelines and external Webhook catching logic.

### Dev 3: Full-Stack / Systems Engineer (Real-time & Auth)
**Focus:** Authentication, Sockets, and Complex state.
*   Implement JWT role-based Auth matching and the `validateUser` / `validateAgent` middleware.
*   Build the Socket.IO layer (`socket.js`), ensuring messages route properly to `uid` and `owner_uid` securely.
*   Connect the React Flow node-builder frontend to the backend JSON storage for custom workflows.
*   Implement the `auto_agent_login` system and oversee tenant architecture.

---

## 6. Development Guidelines for AI Context
*   **Backend:** Express with PostgreSQL as the single supported database. Focus on matching missing fields and verifying foreign keys.
*   **Frontend:** The current `/client/public/index.html` is a redirect. A complete new frontend must replace it.
*   **APIs:** Rely on `routes/user.js`, `routes/admin.js`, and `routes/agent.js` as the source of truth for available operations.

---

## 7. Current Repository Snapshot

### Backend
*   `server.js` boots the Express app.
*   `socket.js` and `websocket.js` handle real-time message transport.
*   `routes/` contains the main feature APIs, including `admin`, `user`, `agent`, `inbox`, `chatFlow`, `broadcast`, `phonebook`, and QR flows.
*   `/api/chat_flow` now tenant-scopes flow save/detail/activity operations and persists bot-ready node/edge JSON for WA Chatbot handoff.
*   WA Chatbot runtime diagnostics are stored in PostgreSQL and exposed through `/api/chatbot/get_logs`.
*   `middlewares/` contains auth and plan validation middleware.
*   `database/`, `functions/`, `helper/`, `helpers/`, and `loops/` support persistence, business logic, utilities, and recurring jobs.

### Frontend
*   `client/` is a Vite React SPA with a modular portal structure under `src/routes`, `src/layouts`, `src/pages`, `src/components`, and `src/shared`.
*   Jest and React Testing Library are now the baseline frontend test stack.
*   User Automation Flows includes a bot-ready template generator, JSON editor, save/load/delete, activity inspection, and RTL coverage.
*   User WA Chatbot includes CRUD targeting, all-chat/selected-chat mode, status controls, and runtime diagnostics.
*   `client/src/profiler.jsx` provides opt-in React Profiler logging controlled by `VITE_ENABLE_REACT_PROFILER=true`.
*   `REFERENCE_APP_AUDIT.md` now captures the confirmed live sitemap, commercial flow, and parity gaps versus this repo.

### Documentation and Tracking
*   `FEATURE_TRACKER.md` remains the product-feature checklist.
*   `ENGINEERING_TRACKER.md` tracks engineering enablement, completed tooling work, and remaining setup tasks.
