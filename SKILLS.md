# SKILLS.md: B1GCRM AI OPERATING MANUAL

This document serves as the permanent institutional knowledge base and operational guide for all AI agents working on the B1GCRM repository. Every agent must read this manual in conjunction with [CLAUDE.md](file:///home/shadow/projects/B1GCRM/CLAUDE.md) before undertaking any task.

---

## 1. Project Overview

B1GCRM is a multi-tenant WhatsApp CRM and marketing automation SaaS platform. The product is structured into four primary interactive surfaces:
1.  **Super-Admin Portal (`/admin`)**: Central system settings, payment order history, billing plans configuration, tenant user accounts management, CMS content, translation dictionaries, SMTP controls.
2.  **Tenant-User Portal (`/user`)**: Operator inbox dashboard, phonebook contacts CRUD, campaign broadcasting, visual flow builder canvas, chatbots keywords mapper, widgets configuration, integrations console, developer REST APIs & webhooks rules.
3.  **Agent Portal (`/agent`)**: Workspace interface for support agents assigned to a tenant user. Handles active chat thread processing, notes, assignments, and tasks queue comments.
4.  **Public Site (`/`)**: Product showcase landing pages, registration/signup flows, pricing tiers view, and embeddable live chat widget scripts.

---

## 2. Architecture

B1GCRM is designed around a modern three-tier decoupled runtime layout:

```mermaid
graph TD
    A[React Client (SPA - Port 3010)] -->|HTTP Request / JSON| B[Express Backend (Node.js - Port 3010)]
    A -->|Socket.IO Events| C[Socket.IO Server (Port 3010 / 3002)]
    B -->|SQL Queries| D[PostgreSQL Database (Port 5432)]
    C -->|SQL Queries| D
    B -->|JSON/Media I/O| E[Container Volumes File Storage]
```

*   **Frontend**: Single Page Application built using Vite, React 19, TailwindCSS, and custom Vanilla CSS layout structures. Routes are gated via client-side role definitions in `client/src/routes/AppRoutes.jsx`.
*   **Backend**: Node.js CommonJS server using Express.js for REST APIs. Server entry point is [server.js](file:///home/shadow/projects/B1GCRM/server.js). Custom middlewares handle authentication (`middlewares/user.js`, `middlewares/admin.js`, `middlewares/agent.js`) and subscription levels check (`middlewares/plan.js`).
*   **Real-time Layer**: Active Socket.IO namespace listeners managed in [socket.js](file:///home/shadow/projects/B1GCRM/socket.js) and [helper/socket/index.js](file:///home/shadow/projects/B1GCRM/helper/socket/index.js) handling inbox message loops, agent assignments, and online statuses.
*   **Background Jobs**: Campaign broadcast scheduler running as an in-process daemon initialized on startup via [loops/campaignLoop.js](file:///home/shadow/projects/B1GCRM/loops/campaignLoop.js).
*   **Storage**: Hybrid data storage system:
    -   *Relational metadata* is stored in PostgreSQL tables.
    -   *Conversations histories* and *visual flow graphs* are saved directly to disk directories (`conversations/inbox/` and `flow-json/` respectively).

---

## 3. Database Strategy

*   **Database Engine**: PostgreSQL 16. Host connections are managed via [database/dbpromise.js](file:///home/shadow/projects/B1GCRM/database/dbpromise.js).
*   **Migration Pipeline**: Schema state is managed chronologically via SQL files in `database/migrations/` (from `000_...` to `009_...`) and executed by `database/migrate.js`. Run migrations with `npm run db:migrate`.
*   **No Database Foreign Keys**: Referential integrity is **not** enforced by the SQL schema. Data relationships are scoped programmatically inside express controllers.
*   **Tenant Isolation**: Enforced query-by-query by matching `uid` or `owner_uid` columns. Every SELECT, UPDATE, and DELETE query on user-owned assets **must** contain parameter checks against the authenticated user token UID:
    ```javascript
    await query("SELECT * FROM phonebook WHERE id = ? AND uid = ?", [id, req.decode.uid]);
    ```

---

## 4. Deployment Strategy

*   **Containerization**: Standard Docker Compose orchestration using [docker-compose.yml](file:///home/shadow/projects/B1GCRM/docker-compose.yml) hosting two containers:
    -   `b1gcrm-app-1`: Node app running on port `3010`.
    -   `b1gcrm-postgres-1`: PostgreSQL server running on port `5432`.
*   **Production Volume Mounts**: Core dynamic assets must be mounted to persistent volumes in the host machine to survive container deployments. The following directories are isolated:
    -   `/app/logs` (Container execution records)
    -   `/app/sessions` (API login sessions data)
    -   `/app/conversations` (Inbox customer JSON logs)
    -   `/app/flow-json` (ReactFlow serialized templates)
    -   `/app/client/public/media` (Static images, videos, audio, documents uploads)

---

## 5. Product Vision

The goal of B1GCRM is to serve as a high-fidelity WhatsApp marketing and manual support console:
1.  **Manual Communications**: Enabling customer success reps to open customer threads, send manual replies, and review attachments directly in the browser console.
2.  **Marketing Automation**: Empowering managers to build conditional chatbot keywords rules, design flow canvas sequences, and broadcast campaigns to phonebook segments.
3.  **SaaS Operations**: Standard Super-Admin capabilities for defining subscription packages, enforcing usage limits, and reviewing payment orders.

---

## 6. Reference CRM Rules

*   **Reference Coordinates**: The live reference CRM is hosted at `https://crm.oneoftheprojects.com`.
*   **Reference Sources**:
    -   [AUTHENTICATED_REFERENCE_SITEMAP.md](file:///home/shadow/projects/B1GCRM/AUTHENTICATED_REFERENCE_SITEMAP.md)
    -   [LIVE_REFERENCE_COMPONENT_LIBRARY.md](file:///home/shadow/projects/B1GCRM/LIVE_REFERENCE_COMPONENT_LIBRARY.md)
    -   [REFERENCE_GAP_REFINEMENT.md](file:///home/shadow/projects/B1GCRM/REFERENCE_GAP_REFINEMENT.md)
    -   `docs/reference-pages/*`
    -   `docs/reference-pages/live-crawl/*` (Puppeteer crawl markdown dumps)
*   **Compliance Rules**:
    -   **Rule**: Never build new UI without checking reference CRM behavior first. Use Puppeteer crawl artifacts whenever available.
    -   **UI Compliance**: Never deploy any new dashboard card, form control, or layout tab without validating the original workspace presentation and parameters in the reference crawl screenshots or text dumps. If a page exists as a placeholder layout in B1GCRM, map its routes to the corresponding reference page view (`?page=<slug>`).

---

## 7. Runtime Verification Rules

*   **Action over Inspection**: Never assume code works because it is present in the source files. Always prove implementation state at runtime.
*   **Evidence Collection**: Acceptable runtime evidence includes:
    1.  *API Responses*: Inspected using HTTP request tools or automated controller tests.
    2.  *Database States*: Direct PostgreSQL queries verifying row insertion, updates, and deletes.
    3.  *Browser Actions*: Playwright/Puppeteer automation, visual screenshots, and console logs.
    4.  *Static Media Audits*: Resolving media URLs with HTTP GET queries verifying file integrity.

---

## 8. CRUD Verification Rules

When auditing database CRUD operations, perform complete execution loops:
1.  **Create**: Call the API insertion route -> Verify that a row is successfully appended to the Postgres table -> Record the primary key ID.
2.  **Read**: Fetch the resource index -> Confirm the inserted properties match the payload parameters.
3.  **Update**: Call the update/edit route -> Query the table to ensure updatedAt changes and data fields match the updated schema.
4.  **Delete**: Call the delete API -> Verify the row has been removed from the database -> Confirm that cascade triggers or deletions remove all associated data (e.g. contacts deleted when a phonebook group is deleted).

---

## 9. Browser Verification Rules

*   **Navigational Checks**: Traverse portal interfaces using browser automation subagents.
*   **Log Diagnostics**: Review chrome devtools console logs to catch JavaScript warnings, unhandled promise rejections, or React components lifecycle crashes.
*   **Visual Evidence**: Capture and store screenshots of dashboards, modal forms, and routing state outcomes inside the conversation artifacts directory.

---

## 10. Inbox Rules

*   **Data Source**: Active conversations histories are read from and written to:
    `conversations/inbox/${uid}/${chatId}.json`
*   **Socket.IO Messaging**: All live chat actions are managed via socket listeners. Manual composers send messages by emitting the `send_chat_message` socket event.
*   **Media Ingress**: Express controller routes handle file uploads to the server public folder `/media`. The inbox component renders previews dynamically:
    -   `image`: Renders image elements using direct GET paths.
    -   `video` / `audio`: Renders HTML5 media player components.
    -   `document`: Serves download linkages with file icons.

---

## 11. WhatsApp Experience Rules

*   **Layout Structure**: The operator console is split into three fixed columns (Left: chat lists & filters, Center: message bubble list & composers, Right: client context, notes, and task allocations).
*   **Interaction Controls**: composers, media buttons, and notes saving must remain responsive, active, and accessible on the dashboard page layout.

---

## 12. Meta Dependency Rules

*   **API Validation Checks**: Creating campaigns and sending outbound WhatsApp messages invokes the Meta Graph API.
*   **Webhook Ingest Route**: Incoming message payloads enter the application via `POST /api/inbox/webhook/:uid`.
*   **Development Sandbox Bypass**: In development environments (`NODE_ENV === 'development'`), provide a mock sandbox option:
    -   Configure `MOCK_META_DELIVERY=true` in environment properties.
    -   Bypass Facebook Graph API phone-handshake request validations.
    -   Mark campaign states as `SENT` locally without dispatching live Axios requests to external Meta endpoints.

---

## 13. Campaign Rules

*   **Schedules**: Broadcast metadata is stored in the `broadcast` table, and recipient states are written to `broadcast_log` rows with status `'PENDING'`.
*   **Daemon Loop**: The runner script [loops/campaignLoop.js](file:///home/shadow/projects/B1GCRM/loops/campaignLoop.js) periodically scans database rows with status `'QUEUE'` and executes broadcasts.
*   **Test Isolation**: When writing campaign verification scripts, establish temporary phonebooks/contacts in PG, trigger API creation, and cleanly delete the test records post-audit.

---

## 14. Webhook Rules

*   **CRUD Schema**: Rules CRUD operations map directly to the `webhook_rules` table.
*   **Execution matchers**: The inbound message pipeline must trigger Webhook rules evaluation:
    -   Parse events (`message`, `incoming`).
    -   Check rule criteria (contains, starts_with, exists).
    -   Execute outbound target actions (e.g. dispatch post requests, apply tagging models).
*   **Audit Trail logs**: Outgoing dispatches should write records to a `webhook_logs` table tracking URL targets, payloads, response codes, and timestamps.

---

## 15. Automation Flow Rules

*   **Serialization**: Flow designs are managed as ReactFlow node/edge JSON structures stored on disk:
    `/app/flow-json/nodes/<uid>/<flowId>.json` and `/app/flow-json/edges/`
*   **Load / Save Validation**: Verify flow coordinate imports by ensuring canvas saves rewrite correctly on reload requests.

---

## 16. Agent Workflow Rules

*   **Scope Gateways**: Support agents are saved in the `agents` table. Login generates JWTs scoped to the parent tenant `owner_uid` limits.
*   **Assigned task queue**: Agent task profiles are kept in `agent_task`.
*   **Completeness Proof**: Verify task completions by checking if the task status in the database transitions to `'COMPLETED'` and notes text updates cleanly.

---

## 17. Documentation Governance

Whenever modifying routes, controller business logic, schemas, or migrations, execute these steps before ending a turn:
1.  Review and update relevant context documents inside the `docs/` folder (e.g. `docs/CURRENT_STATUS.md`, `docs/FEATURE_TRACKER.md`).
2.  Update the AI changelog files: `docs/CHANGELOG_AI.source.md`.
3.  Rebuild AI documentation using the script:
    `npm run docs:ai`
4.  Confirm `docs/PROJECT_CONTEXT.md` and `docs/CHANGELOG_AI.md` are refreshed.

---

## 18. Deployment Readiness Checklist

Prior to production staging transitions, confirm the following configurations:
- `[ ]` **relative API Base**: Ensure client AJAX calls target `''` to utilize current protocol origins.
- `[ ]` **dynamic Sockets**: Ensure client Socket.IO endpoints bind to `window.location.origin` inside built scripts.
- `[ ]` **unified uploads**: Confirm file uploads write to public media directories mounted on persistent Docker volumes.
- `[ ]` **CORS verification**: Verify CORS origins split arrays match target production staging domains.
- `[ ]` **secure credentials**: Confirm that no passwords, API tokens, or secrets are hardcoded in source modules.
- `[ ]` **DB migrations check**: Verify migrations run cleanly on fresh PG engines using `npm run db:migrate`.

---

## 19. Testing Checklist

- `[ ]` **PostgreSQL checks**: DB connection tests use direct host IP targets (e.g. `127.0.0.1:5432`) and check active rows states.
- `[ ]` **API controllers tests**: Express endpoints return matching statuses (`200 OK` or expected error JSONs).
- `[ ]` **Frontend tests suite**: Verify client configurations with `cd client && npm test`.
- `[ ]` **Clean test states**: Ensure verification scripts delete all temporary database records and files created during audits.

---

## 20. Sprint Execution Framework

Follow these structured stages during Sprints:
1.  **Planning**: Inspect codebases, draft implementation paths in `implementation_plan.md`, obtain user feedback/approvals.
2.  **Checklist**: Create `task.md` detailing TODO items. Use `[/]` for active tasks, `[x]` for completed tasks.
3.  **Development**: Edit code following clean, modular approaches. Only fix blockers required for target features.
4.  **Verification**: Write verification scripts to collect database and API proof. Capture browser screenshots.
5.  **Documentation**: Rebuild AI docs using `npm run docs:ai`, write the walkthrough reports, and finalize handoff logs.

---

## 21. Definition Of Done

> [!IMPORTANT]
> **No Code-Only Statuses**  
> A feature is only complete if it satisfies all of the following validations:
> 1.  **Browser Verified**: Checked via UI automation or browser subagents; no JS console crashes.
> 2.  **API Verified**: Controller endpoints respond with correct status codes and payloads.
> 3.  **Database Verified**: Postgres tables write corresponding states, matching data schema.
> 4.  **Persistence Verified**: Changes survive server restarts, page reloads, and container resets.
> 5.  **Documentation Updated**: Handoffs, feature trackers, and AI contexts are synced.

---

## 22. Current High Priority Areas

1.  **Admin Plan Config edit bug**: Repair collision naming issues in `routes/admin.js`.
2.  **Webhook Rules Matcher engine**: Build matching triggers and outbound client dispatchers.
3.  **Baileys QR Connector integration**: Link active Baileys socket hooks to message ingest flows.
4.  **Kanban card updates persistence**: Build updates API routes and sync UI board states to Postgres.
