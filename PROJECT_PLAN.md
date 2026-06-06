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

- **Creation:** Created in the User Portal (`/api/agent/add_agent`).
- **Impersonation (Auto-Login):** Users have an `auto_agent_login` function. The backend generates a valid Agent JWT on the fly, allowing the User to click to jump directly into the Agent's portal in a new tab without knowing their password.
- **Permissions Engine:** Agent requests pass through the `validateAgent` middleware. It checks `is_active` and retrieves the `owner_uid` account.
- **Data Isolation:** `routes/agent.js` checks the `agent_chats` relational table. Agents only receive conversations explicitly assigned to their `uid` by the parent User.
- **Real-time Socket Flow:** `socket.js` registers incoming connections with both `uid` and `owner_uid`. Incoming messages to the business trigger `sendToUid(owner_uid)`. The router naturally pushes the message to both the User and any Agent whose `owner_uid` matches.

---

## 3. Client Site Integration Strategies

How SaaS Users connect their external websites/systems to this CRM:

- **Chat Widget:** Embed JS script injected into the client website. Opens a socket connection bridging website visitors to the User's inbox.
- **Contact Forms / WhatsApp Forms:** Hosted iframes natively linked to the Flowbuilder.
- **Webhooks:** External e-commerce sites (Shopify, WP) fire POST requests to `/api/inbox/webhook/:uid`.
- **Conversational REST API:** Programmable API keys (`/generate_api_keys`) allowing users to script message triggers.

---

## 4. Work Breakdown & Implementation Phases

### Phase 1: Repository Foundation & Cleanup

- Clean up `__MACOSX`, `.DS_Store`, and unnecessary generated template files from the current folder.
- Structure the `./client` directory as a pure React SPA (React + Vite only). We will NOT use Next.js or other SSR frameworks.
- Setup environment variable handling for frontend (`VITE_API_URL`).

### Phase 2: Frontend App Shell & Auth (Figma Execution)

- **UI/UX Reference:** Exact match to the corporate B2B SaaS aesthetics and UX of `https://crm.oneoftheprojects.com`.
- **Design Tokens:** Dark Mode default (`Background: #0F172A`, `Surface: #1E293B`, `Primary Brand: #00A389`, `Warning: #F59E0B`).
- **Layout Component:** Global Sidebar (collapsible) + Topbar (Language, Theme Toggle, Profile).
- **Routing:**
  - `/admin/login` -> Admin App Shell
  - `/user/login` -> User App Shell
  - `/agent/login` -> Agent App Shell
- **Auth State Management:** Zustand/Redux or React Context storing the decoded JWT role and routing unauthorized users away.

### Phase 3: High-Priority Module Integration

- **SaaS Core (Admin):** Plans, Users list, SMTP config, and Theme updates (wiring `routes/admin.js`).
- **Connections (User):** WhatsApp QR linking, Meta Cloud API hookup.
- **Inbox (User/Agent):** 3-panel chat interface fetching `routes/inbox.js` and pushing through `socket.js`.

### Phase 4: Operational Automation

- Build the React Flow (Node-based) UI for Chatbot/Flowbuilder (`/api/chat_flow`).
- Broadcast Campaigns & Meta Templates list.
- Phonebook and Contact Management.

---

## 5. Team Distribution & Sprint Allocation (3 Developers)

To run this parallelly across a 3-person team, the workload is distributed as follows:

### Dev 1: Lead Frontend Engineer (UI/UX & React)

**Focus:** Visuals, App Shell, Routing, and Components.

- Setup Vite + React architecture in the `/client` directory.
- Build the global UI component library based on the Figma guidelines (Dark mode, Teal accents, exact button/input states).
- Create the 3 core Application Shell layouts (Admin, User, Agent sidebars and topbars).
- Build the data tables (Users, Orders, Campaigns) and the Kanban board UI.

### Dev 2: Backend Software Engineer (Integrations & Core API)

**Focus:** External APIs, Payments, Database logic.

- Finalize and stabilize the REST API routes (`admin.js`, `user.js`).
- Handle WhatsApp QR code pairing logic and Meta Official API endpoints.
- Integrate Payment Gateways (Stripe, Razorpay, PayPal).
- Handle SMTP email pipelines and external Webhook catching logic.

### Dev 3: Full-Stack / Systems Engineer (Real-time & Auth)

**Focus:** Authentication, Sockets, and Complex state.

- Implement JWT role-based Auth matching and the `validateUser` / `validateAgent` middleware.
- Build the Socket.IO layer (`socket.js`), ensuring messages route properly to `uid` and `owner_uid` securely.
- Connect the React Flow node-builder frontend to the backend JSON storage for custom workflows.
- Implement the `auto_agent_login` system and oversee tenant architecture.

---

## 6. Development Guidelines for AI Context

- **Backend:** Already heavily built-out (Express/MySQL). Focus on matching missing fields and verifying foreign keys.
- **Frontend:** The current `/client/public/index.html` is a redirect. A complete new frontend must replace it.
- **APIs:** Rely on `routes/user.js`, `routes/admin.js`, and `routes/agent.js` as the source of truth for available operations.

---

## 7. Core Database Schema & Entity Relationships

### 7.1 Key Tables & Relationships

```
┌─────────────────────────────────────────────────────────────────────┐
│ CORE ENTITIES                                                       │
├─────────────────────────────────────────────────────────────────────┤
│ user (SaaS Tenants)                                                 │
│ ├─ uid, email, phone, password, plan_id (FK → plans)              │
│ ├─ stripe_customer_id, is_active, created_at, updated_at          │
│ └─ smtp_config, api_keys[], webhook_urls[]                        │
│                                                                     │
│ agent (Staff Members assigned to users)                            │
│ ├─ uid, email, password, owner_uid (FK → user)                    │
│ ├─ is_active, role (enum: admin, agent, manager)                  │
│ └─ assigned_chats (referenced via agent_chats table)              │
│                                                                     │
│ admin (SaaS Super-Admins)                                          │
│ ├─ uid, email, password, role (super_admin, moderator)           │
│ └─ permissions[]                                                   │
│                                                                     │
│ plans (SaaS Pricing Tiers)                                         │
│ ├─ id, name, price, billing_cycle (monthly/yearly)               │
│ ├─ features_json (list of enabled features)                       │
│ ├─ max_agents, max_contacts, max_api_calls                       │
│ └─ active, created_at                                             │
│                                                                     │
│ contacts (CRM Contact Database per user)                           │
│ ├─ id, uid (FK → user), phone, name, email                        │
│ ├─ tags[], metadata {}, created_at, last_message_at              │
│ └─ source (whatsapp, instagram, telegram, form_submission)       │
│                                                                     │
│ conversations / inbox (Chat threads)                               │
│ ├─ id, uid (FK → user), contact_id (FK → contacts)               │
│ ├─ platform (whatsapp, instagram, telegram, web_chat)             │
│ ├─ latest_message, unread_count, assigned_agent_uid              │
│ └─ status (open, archived, closed), updated_at                   │
│                                                                     │
│ messages (Individual Chat Messages)                                │
│ ├─ id, conversation_id (FK → conversations)                       │
│ ├─ sender_type (user, agent, contact), sender_uid/name            │
│ ├─ type (text, image, file, video, location)                      │
│ ├─ content (text/url), media_url, caption                         │
│ ├─ meta_message_id (external platform id)                         │
│ ├─ status (sent, delivered, read, failed)                         │
│ └─ timestamp, reaction, star                                       │
│                                                                     │
│ agent_chats (Junction table for agent ↔ conversation)             │
│ ├─ agent_uid (FK → agent)                                         │
│ ├─ conversation_id (FK → conversations)                           │
│ └─ assigned_at, is_primary_assignee                              │
│                                                                     │
│ chat_flow / flowbuilder (Chatbot Templates)                        │
│ ├─ id, uid (FK → user), name, description                         │
│ ├─ trigger_keywords, nodes_json (React Flow structure)            │
│ ├─ edges_json, variables                                          │
│ ├─ active, version, created_at                                    │
│ └─ template_type (chatbot, form, survey)                         │
│                                                                     │
│ broadcast_campaign (Bulk Message Campaigns)                        │
│ ├─ id, uid (FK → user), name, template                            │
│ ├─ target_contacts_count, scheduled_at, sent_at                   │
│ ├─ status (draft, scheduled, sending, completed, failed)          │
│ ├─ delivery_stats {sent, delivered, failed, clicked}              │
│ └─ created_at, updated_at                                         │
│                                                                     │
│ meta_template (WhatsApp/Instagram Approved Templates)             │
│ ├─ id, uid (FK → user), name, category                            │
│ ├─ template_content, variables, languages[]                       │
│ ├─ approval_status (approved, pending, rejected)                  │
│ └─ created_at, meta_template_id (external)                       │
│                                                                     │
│ settings (SaaS Configuration per User)                             │
│ ├─ uid (FK → user), key, value, type (string/json/number)         │
│ ├─ whatsapp_phone_number_id, whatsapp_business_account_id        │
│ ├─ instagram_account_id, default_response_time                    │
│ └─ theme_config {primary, secondary, accent colors}              │
│                                                                     │
│ payment_order (Transaction Records)                                │
│ ├─ id, uid (FK → user), plan_id (FK → plans)                      │
│ ├─ amount, currency, billing_cycle                                │
│ ├─ status (pending, success, failed, refunded)                    │
│ ├─ stripe_payment_id, razorpay_order_id                           │
│ └─ created_at, completed_at, next_billing_date                    │
│                                                                     │
│ page (CMS Pages for Admin Portal)                                  │
│ ├─ id, slug, title, content, image_url                            │
│ ├─ permanent (read-only system pages)                              │
│ └─ created_at, updated_at                                         │
│                                                                     │
│ faq (Frequently Asked Questions)                                   │
│ ├─ id, question, answer, category                                 │
│ ├─ order, active                                                   │
│ └─ created_at, updated_at                                         │
│                                                                     │
│ partners (Brand/Partner Logos for SaaS)                            │
│ ├─ id, filename, uploaded_by (FK → admin)                         │
│ └─ created_at                                                      │
│                                                                     │
│ language_translation (Multi-language Support)                      │
│ ├─ id, language_code (en, es, fr, etc.)                           │
│ ├─ key, translation_value                                         │
│ └─ last_updated                                                    │
│                                                                     │
│ task / agent_task (Task Assignment for Agents)                     │
│ ├─ id, uid (FK → user), agent_uid (FK → agent)                    │
│ ├─ title, description, due_date                                   │
│ ├─ priority (high, medium, low), status (open, in_progress, done) │
│ ├─ contact_id (optional FK → contacts)                            │
│ └─ created_at, completed_at                                       │
│                                                                     │
│ api_key (Programmatic Access)                                      │
│ ├─ id, uid (FK → user), key_hash, name                            │
│ ├─ permissions[], rate_limit, last_used_at                        │
│ ├─ active, created_at, expires_at                                 │
│ └─ rotated_at                                                      │
│                                                                     │
│ webhook_subscription (User-Defined Webhooks)                       │
│ ├─ id, uid (FK → user), url, event_type (message.sent, etc.)     │
│ ├─ active, retry_count, last_triggered_at                         │
│ └─ created_at, updated_at                                         │
└─────────────────────────────────────────────────────────────────────┘
```

### 7.2 Data Integrity Constraints

- **Foreign Key Enforcement:** All `FK` relationships must have `ON DELETE CASCADE` or `ON DELETE RESTRICT` as applicable.
- **Unique Constraints:** `user.email`, `agent.email`, `admin.email`, `api_key.key_hash`, `plans.name`.
- **Indexes for Performance:**
  - `conversations(uid, platform)` - for user's platform-specific chats
  - `messages(conversation_id, timestamp)` - for message timeline
  - `contacts(uid, phone)` - for phone lookup
  - `broadcast_campaign(uid, created_at)` - for campaign listing
  - `agent_chats(agent_uid, assigned_at)` - for agent's workload

---

## 8. API Endpoints Reference

### 8.1 Admin Portal Routes (`/api/admin/*`)

| Endpoint                        | Method | Auth  | Purpose                                       |
| ------------------------------- | ------ | ----- | --------------------------------------------- |
| `/api/admin/login`              | POST   | None  | Admin authentication                          |
| `/api/admin/plans`              | GET    | Admin | List all SaaS plans                           |
| `/api/admin/plans`              | POST   | Admin | Create new plan                               |
| `/api/admin/plans/:id`          | PUT    | Admin | Update plan pricing/features                  |
| `/api/admin/plans/:id`          | DELETE | Admin | Deactivate plan                               |
| `/api/admin/users`              | GET    | Admin | List all SaaS users with pagination           |
| `/api/admin/users/:uid`         | GET    | Admin | User detail + usage metrics                   |
| `/api/admin/users/:uid/disable` | POST   | Admin | Deactivate user account                       |
| `/api/admin/orders`             | GET    | Admin | Payment orders + revenue analytics            |
| `/api/admin/smtp_config`        | GET    | Admin | Get SMTP settings                             |
| `/api/admin/smtp_config`        | PUT    | Admin | Update SMTP server details                    |
| `/api/admin/theme`              | GET    | Admin | Get SaaS frontend theme colors                |
| `/api/admin/theme`              | PUT    | Admin | Update design tokens                          |
| `/api/admin/pages`              | GET    | Admin | List CMS pages                                |
| `/api/admin/pages`              | POST   | Admin | Create new CMS page                           |
| `/api/admin/pages/:id`          | DELETE | Admin | Delete custom page                            |
| `/api/admin/faq`                | GET    | None  | Fetch public FAQs                             |
| `/api/admin/faq`                | POST   | Admin | Add FAQ                                       |
| `/api/admin/faq/:id`            | DELETE | Admin | Delete FAQ                                    |
| `/api/admin/add_brand_image`    | POST   | Admin | Upload partner logo                           |
| `/api/admin/get_brands`         | GET    | Admin | List all partner logos                        |
| `/api/admin/del_brand_logo`     | POST   | Admin | Delete partner logo                           |
| `/api/admin/auto_login`         | POST   | Admin | Generate user session token for impersonation |

### 8.2 User Portal Routes (`/api/user/*` & `/api/inbox/*`)

| Endpoint                                   | Method | Auth       | Purpose                                                               |
| ------------------------------------------ | ------ | ---------- | --------------------------------------------------------------------- |
| `/api/user/login`                          | POST   | None       | User (Tenant) authentication                                          |
| `/api/user/register`                       | POST   | None       | Sign up new SaaS user                                                 |
| `/api/user/profile`                        | GET    | User       | Get user profile & settings                                           |
| `/api/user/profile`                        | PUT    | User       | Update profile (name, phone, etc.)                                    |
| `/api/user/change_password`                | POST   | User       | Password change                                                       |
| `/api/user/settings`                       | GET    | User       | WhatsApp config, API keys, webhooks                                   |
| `/api/user/settings/whatsapp`              | POST   | User       | Store WhatsApp phone_number_id & access_token                         |
| `/api/user/settings/instagram`             | POST   | User       | Link Instagram business account                                       |
| `/api/user/generate_api_keys`              | POST   | User       | Create new programmatic API key                                       |
| `/api/user/api_keys`                       | GET    | User       | List active API keys                                                  |
| `/api/user/api_keys/:id`                   | DELETE | User       | Revoke API key                                                        |
| `/api/user/register_webhook`               | POST   | User       | Add webhook URL for events                                            |
| `/api/user/webhooks`                       | GET    | User       | List registered webhooks                                              |
| `/api/user/webhooks/:id`                   | DELETE | User       | Unregister webhook                                                    |
| `/api/inbox/get_contacts`                  | GET    | User/Agent | List contacts with pagination & search                                |
| `/api/inbox/create_contact`                | POST   | User/Agent | Add manual contact                                                    |
| `/api/inbox/update_contact/:id`            | PUT    | User/Agent | Edit contact info/tags                                                |
| `/api/inbox/delete_contact/:id`            | DELETE | User       | Remove contact                                                        |
| `/api/inbox/get_conversations`             | GET    | User/Agent | Fetch inbox conversations (filters: platform, unread, assigned_agent) |
| `/api/inbox/get_conversation/:id`          | GET    | User/Agent | Fetch single conversation with message history                        |
| `/api/inbox/send_message`                  | POST   | User/Agent | Send text message via WhatsApp/Instagram/Telegram                     |
| `/api/inbox/send_image`                    | POST   | User/Agent | Send image with caption                                               |
| `/api/inbox/send_file`                     | POST   | User/Agent | Upload and send file/document                                         |
| `/api/inbox/get_messages/:conversation_id` | GET    | User/Agent | Fetch paginated message history                                       |
| `/api/inbox/mark_read`                     | POST   | User/Agent | Mark conversation as read                                             |
| `/api/inbox/archive_conversation`          | POST   | User/Agent | Archive conversation                                                  |
| `/api/inbox/assign_agent`                  | POST   | User       | Assign/reassign conversation to agent                                 |
| `/api/inbox/close_conversation`            | POST   | User/Agent | Close conversation                                                    |
| `/api/inbox/webhook/:uid`                  | POST   | Public     | Receive messages from external platforms (Shopify, WP, etc.)          |
| `/api/broadcast/list`                      | GET    | User       | List all campaigns                                                    |
| `/api/broadcast/create`                    | POST   | User       | Create broadcast campaign                                             |
| `/api/broadcast/:id`                       | PUT    | User       | Edit draft campaign                                                   |
| `/api/broadcast/:id/schedule`              | POST   | User       | Schedule campaign for later                                           |
| `/api/broadcast/:id/send`                  | POST   | User       | Send campaign immediately                                             |
| `/api/broadcast/:id`                       | DELETE | User       | Delete campaign                                                       |
| `/api/broadcast/:id/analytics`             | GET    | User       | Campaign performance stats (delivery, open rate, clicks)              |
| `/api/chat_flow/list`                      | GET    | User       | List flowbuilder chatbots                                             |
| `/api/chat_flow/create`                    | POST   | User       | Create new chatbot                                                    |
| `/api/chat_flow/:id`                       | GET    | User       | Get chatbot nodes & edges JSON                                        |
| `/api/chat_flow/:id`                       | PUT    | User       | Save flowbuilder design (nodes/edges)                                 |
| `/api/chat_flow/:id/publish`               | POST   | User       | Activate chatbot                                                      |
| `/api/chat_flow/:id/unpublish`             | POST   | User       | Deactivate chatbot                                                    |
| `/api/chat_flow/:id`                       | DELETE | User       | Delete chatbot                                                        |
| `/api/chat_flow/:id/preview`               | GET    | User       | Test chatbot interaction                                              |
| `/api/template/list_templates`             | GET    | User       | Get approved WhatsApp templates                                       |
| `/api/template/upload_template`            | POST   | User       | Submit new template for approval                                      |
| `/api/template/:id/approve`                | POST   | Admin      | Approve pending template                                              |
| `/api/phonebook`                           | GET    | User/Agent | List contacts/groups                                                  |
| `/api/phonebook/create_group`              | POST   | User       | Create contact group                                                  |
| `/api/phonebook/add_to_group`              | POST   | User       | Add contact to group                                                  |
| `/api/agent/add_agent`                     | POST   | User       | Create staff member                                                   |
| `/api/agent/list`                          | GET    | User       | Get all agents for user                                               |
| `/api/agent/:id/deactivate`                | POST   | User       | Disable agent account                                                 |

### 8.3 Agent Portal Routes (`/api/agent/*`)

| Endpoint                        | Method | Auth         | Purpose                                                           |
| ------------------------------- | ------ | ------------ | ----------------------------------------------------------------- |
| `/api/agent/login`              | POST   | None         | Agent authentication                                              |
| `/api/agent/profile`            | GET    | Agent        | Get own profile                                                   |
| `/api/agent/profile`            | PUT    | Agent        | Update profile (name, avatar)                                     |
| `/api/agent/change_password`    | POST   | Agent        | Change password                                                   |
| `/api/agent/assigned_chats`     | GET    | Agent        | Get conversations assigned to this agent                          |
| `/api/agent/assigned_chats/:id` | GET    | Agent        | Get conversation detail + message history                         |
| `/api/agent/send_message`       | POST   | Agent        | Send text reply via WhatsApp/Instagram                            |
| `/api/agent/send_image`         | POST   | Agent        | Send image message                                                |
| `/api/agent/send_file`          | POST   | Agent        | Send file attachment                                              |
| `/api/agent/mark_read`          | POST   | Agent        | Mark conversation read                                            |
| `/api/agent/close_chat`         | POST   | Agent        | Close conversation                                                |
| `/api/agent/get_my_task`        | GET    | Agent        | Fetch assigned tasks                                              |
| `/api/agent/task/:id/complete`  | POST   | Agent        | Mark task complete                                                |
| `/api/agent/auto_agent_login`   | POST   | User → Agent | Generate short-lived Agent JWT (called by User for impersonation) |

### 8.4 Public/Unauthenticated Routes

| Endpoint                         | Method | Purpose                                               |
| -------------------------------- | ------ | ----------------------------------------------------- |
| `/api/auth/register`             | POST   | SaaS user sign-up                                     |
| `/api/auth/login`                | POST   | User/Admin/Agent login                                |
| `/api/auth/refresh_token`        | POST   | Refresh expired JWT                                   |
| `/api/public/chat/:uid/:flow_id` | GET    | Web chat widget endpoint (public conversation bridge) |
| `/api/webhook/:uid`              | POST   | External system webhooks (Shopify, WP, etc.)          |
| `/api/health`                    | GET    | Service health check                                  |

---

## 9. Installation & Setup Instructions

### 9.1 Prerequisites

- **Node.js:** v18+ LTS
- **MySQL:** v8.0+ (MariaDB 10.5+ compatible)
- **npm or yarn:** For package management
- **Redis:** (Optional) For session caching and real-time features
- **Git:** For version control

### 9.2 Backend Setup

```bash
# 1. Clone repository
git clone <repo-url>
cd B1G-CRM

# 2. Install dependencies
npm install

# 3. Setup environment variables
cp env.example.js env.js
# Edit env.js with:
# - DATABASE credentials (host, user, password, database)
# - JWT_SECRET key
# - STRIPE_API_KEY, RAZORPAY_KEY (payment gateways)
# - TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN (optional for SMS)
# - SMTP credentials (for email)
# - WHATSAPP_API_TOKEN, META_WEBHOOK_TOKEN (for Meta integration)
# - REDIS_URL (if using Redis)
# - NODE_ENV (development, staging, production)

# 4. Initialize database
mysql -u root -p < database/schema.sql
# Or run migrations if using migration tool

# 5. Start backend server
npm start
# Server runs on http://localhost:3001 (or PORT in env.js)

# 6. Start Socket.IO server (in separate terminal)
node socket.js
# Socket server on ws://localhost:3002
```

### 9.3 Frontend Setup

```bash
# 1. Navigate to client directory
cd client

# 2. Install dependencies
npm install

# 3. Setup environment variables
cp .env.example .env.local
# Edit with:
# VITE_API_URL=http://localhost:3001/api
# VITE_SOCKET_URL=ws://localhost:3002

# 4. Start development server
npm run dev
# Frontend on http://localhost:5173

# 5. Build for production
npm run build
# Output in dist/ folder
```

### 9.4 Database Initialization

Run SQL schema creation (ensure database exists):

```sql
-- Example structure (use actual schema from database/schema.sql)
CREATE TABLE IF NOT EXISTS user (
  uid VARCHAR(36) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  plan_id INT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (plan_id) REFERENCES plans(id)
);

-- Repeat for all tables defined in Section 7.1
```

---

## 10. Testing Strategy

### 10.1 Unit Testing

- **Backend:** Jest + Supertest for API endpoint testing
- **Frontend:** React Testing Library + Vitest for component testing
- **Coverage Target:** Minimum 70% code coverage
- **Test Command:**
  ```bash
  npm run test                 # Run all tests
  npm run test:coverage       # Generate coverage report
  npm run test:watch          # Watch mode
  ```

### 10.2 Integration Testing

- **E2E Tests:** Playwright or Cypress for full user workflows
  - User login → Create contact → Send message → Verify in inbox
  - Admin login → Create plan → Assign user to plan → Verify billing
  - Agent login → View assigned chats → Send reply → Mark read
- **Database Tests:** Verify foreign key constraints, indexes, triggers
- **Socket Testing:** Real-time message delivery, multi-user scenarios

### 10.3 Load Testing

- Use Apache JMeter or k6 to simulate concurrent users
- Target: 500+ concurrent connections without performance degradation
- Monitor: Response time, error rate, database query performance

### 10.4 Security Testing

- **OWASP Top 10:** SQL injection, XSS, CSRF, broken authentication
- **JWT Validation:** Verify token expiry, role-based access control
- **Rate Limiting:** Test API throttling to prevent brute-force attacks
- **HTTPS Enforcement:** Verify all endpoints use TLS in production

---

## 11. Deployment & DevOps

### 11.1 Staging Environment

- Replicate production setup with lower resource constraints
- Run automated test suites before merging to production
- Use staging database with anonymized production data for QA testing
- Validate third-party integrations (Stripe, Meta, SMTP)

### 11.2 Production Deployment

- **Hosting Options:**
  - AWS (EC2 + RDS MySQL + S3 for media uploads)
  - DigitalOcean (Droplets + Managed Databases)
  - Google Cloud Platform (Compute Engine + Cloud SQL)
  - Azure (VMs + Database for MySQL)
- **Docker Containerization:**
  ```dockerfile
  # Dockerfile for backend
  FROM node:18-alpine
  WORKDIR /app
  COPY package*.json ./
  RUN npm ci --only=production
  COPY . .
  EXPOSE 3001
  CMD ["node", "server.js"]
  ```
- **Kubernetes Orchestration (Optional):** For scaling across multiple instances
- **CI/CD Pipeline:** GitHub Actions, GitLab CI, or Jenkins for automated testing & deployment

### 11.3 Database Management

- **Backup Strategy:** Daily automated backups to S3/GCS with 30-day retention
- **Replication:** Master-slave MySQL replication for high availability
- **Monitoring:** CloudWatch, Datadog, or New Relic for DB performance metrics

### 11.4 CDN & Media Storage

- **Static Assets:** CloudFlare or Cloudfront for fast global delivery
- **Media Files:** S3 with signed URLs for secure image/file access
- **Image Optimization:** AWS Lambda + Thumbor for on-the-fly image resizing

### 11.5 Monitoring & Alerting

- **Uptime Monitoring:** Pingdom, Uptime Robot
- **Error Tracking:** Sentry for JavaScript/Node.js error aggregation
- **Log Aggregation:** ELK Stack (Elasticsearch, Logstash, Kibana) or Datadog
- **Performance Metrics:** New Relic, DataDog APM
- **Alert Conditions:**
  - API response time > 2 seconds
  - Error rate > 1%
  - Database connection pool exhaustion
  - Disk space < 10%

---

## 12. Success Criteria & Key Metrics

### 12.1 Functional Success Criteria

- [ ] All 3 portals (Admin, User, Agent) fully functional with login & role-based access
- [ ] Inbox chat interface supports text, image, file, and emoji messages
- [ ] WhatsApp/Instagram message sending & receiving working end-to-end
- [ ] Broadcast campaigns send to 1000+ contacts without errors
- [ ] Flowbuilder chatbot creation and deployment functional
- [ ] Payment processing (Stripe/Razorpay) integrated with recurring billing
- [ ] Real-time notifications via Socket.IO without message loss
- [ ] API key-based programmatic access working for third-party integrations

### 12.2 Performance Targets

- **API Response Time:** < 500ms (p99)
- **Page Load Time:** < 2 seconds (frontend)
- **Socket Latency:** < 100ms for message delivery
- **Database Query Time:** < 100ms (p99)
- **Concurrent Users:** 1000+ simultaneous WebSocket connections

### 12.3 Business Metrics

- **User Acquisition:** Target 50+ SaaS signups in first month
- **Monthly Recurring Revenue (MRR):** Target $5,000+ by month 3
- **Churn Rate:** < 5% monthly
- **Customer Satisfaction:** Net Promoter Score (NPS) > 50
- **Platform Uptime:** 99.9% SLA compliance

### 12.4 Code Quality Metrics

- **Test Coverage:** ≥ 70%
- **Code Review:** 100% of PRs reviewed before merge
- **Security:** Zero high-severity vulnerabilities in dependencies
- **Tech Debt:** Tracked and reduced quarterly

---

## 13. Risk Management & Mitigation

| Risk                                      | Probability | Impact   | Mitigation Strategy                                                                                |
| ----------------------------------------- | ----------- | -------- | -------------------------------------------------------------------------------------------------- |
| Delayed WhatsApp/Meta API approval        | Medium      | High     | Start integration early; maintain relationship with Meta; have fallback SMS option                 |
| Database performance degradation at scale | Medium      | High     | Implement proper indexing; use read replicas; consider sharding for large user bases               |
| Real-time socket connection drops         | Low         | Medium   | Implement auto-reconnection with exponential backoff; message queue for offline events             |
| Payment gateway integration issues        | Low         | High     | Use well-maintained libraries (Stripe/Razorpay SDKs); extensive integration testing                |
| Security breach / data leak               | Low         | Critical | Regular security audits; penetration testing; GDPR/CCPA compliance; encrypt sensitive data at rest |
| Team member departure mid-project         | Low         | Medium   | Document all processes; maintain modular code structure; knowledge transfer sessions               |
| Third-party service outage (AWS, Stripe)  | Low         | High     | Multi-region deployment; graceful degradation; status page communication                           |
| Scope creep / feature bloat               | Medium      | High     | Maintain strict feature backlog; use MoSCoW prioritization; bi-weekly sprint reviews               |

---

## 14. Communication & Governance

### 14.1 Sprint Structure (2-week cycles)

- **Sprint Planning:** Monday 10:00 AM - Define stories & assign tasks
- **Daily Standup:** 9:30 AM (15 min) - Blockers, progress, plans
- **Mid-Sprint Review:** Wednesday - Check progress against commitments
- **Sprint Demo:** Friday 4:00 PM - Showcase completed features to stakeholders
- **Retrospective:** Friday 5:00 PM - Lessons learned, process improvements

### 14.2 Documentation Standards

- **Code Comments:** Inline comments for complex logic; JSDoc for functions
- **README Files:** Setup instructions, architecture diagrams in each directory
- **API Documentation:** OpenAPI/Swagger spec for all endpoints
- **Runbooks:** Operational procedures for deployments, rollbacks, incident response

### 14.3 Version Control Workflow

- **Branching Strategy:** Git Flow (main, develop, feature/_, release/_, hotfix/\*)
- **Commit Messages:** Conventional commits (feat:, fix:, docs:, refactor:, test:)
- **PR Reviews:** Minimum 2 approvals before merge; automated checks mandatory
- **Release Tags:** Semantic versioning (v1.0.0, v1.1.0, etc.)

---

## 15. Future Roadmap (Post-MVP)

### Phase 5: Advanced Analytics (Month 4-5)

- Dashboard with conversation trends, response time analytics
- Agent performance metrics (reply time, resolution rate, satisfaction)
- Revenue forecasting & churn prediction models

### Phase 6: AI-Powered Features (Month 6+)

- Sentiment analysis on customer messages
- Automated response suggestions using GPT/Anthropic Claude
- Smart contact segmentation for targeted campaigns
- Chatbot training from historical conversations

### Phase 7: Multi-Channel Expansion

- Facebook Messenger, Google Business Messages
- Email channel integration
- SMS gateway integration for OTP/alerts

### Phase 8: Mobile Applications

- Native iOS app (React Native)
- Native Android app (React Native)
- Push notifications for new messages

---

## Appendix A: Technology Stack Summary

| Layer                | Technology                                                   |
| -------------------- | ------------------------------------------------------------ |
| **Frontend**         | React 18, Vite, Zustand/Redux, TailwindCSS, Socket.io-client |
| **Backend**          | Node.js/Express, JWT authentication, Socket.io               |
| **Database**         | MySQL 8.0, Redis (caching/sessions)                          |
| **Real-time**        | Socket.IO, WebSockets                                        |
| **File Storage**     | AWS S3 / Local file system                                   |
| **Payment**          | Stripe API, Razorpay API                                     |
| **SMS/Voice**        | Twilio (optional)                                            |
| **Email**            | SMTP server (nodemailer)                                     |
| **External APIs**    | Meta (WhatsApp/Instagram), Shopify webhooks                  |
| **Monitoring**       | Sentry, DataDog, ELK Stack                                   |
| **CI/CD**            | GitHub Actions / GitLab CI                                   |
| **Containerization** | Docker, Docker Compose                                       |
| **IaC**              | Terraform (optional)                                         |

---

## Appendix B: Glossary

- **SaaS:** Software as a Service - Multi-tenant cloud application
- **Tenant:** Individual user/company using the SaaS platform
- **Agent:** Staff member assigned to a tenant for handling customer support
- **uid:** Unique identifier for user, agent, or admin
- **JWT:** JSON Web Token for stateless authentication
- **Socket.IO:** Real-time bidirectional communication library
- **Flowbuilder:** Visual chatbot/workflow creation tool
- **Meta:** Facebook/Instagram parent company (formerly Facebook Inc.)
- **WhatsApp Business API:** Official WhatsApp messaging gateway
- **Webhook:** HTTP callback mechanism for event-driven integrations
- **MRR:** Monthly Recurring Revenue
- **NPS:** Net Promoter Score

---

**Document Version:** 1.0  
**Last Updated:** June 6, 2026  
**Maintained By:** Development Team  
**Next Review Date:** July 6, 2026
