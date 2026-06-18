# SPRINT 5 EXECUTION PLAN

**Audit Reference**: [SPRINT4_MASTER_REPORT.md](SPRINT4_MASTER_REPORT.md)  
**Goal**: Resolve core bugs, implement the webhook trigger engine, connect persistent states, and achieve functional reference CRM parity.

---

## 1. Broken Functionality

### 1.1 Fix Admin Manage Plans Edit Route Collision
*   **Problem**: `POST /api/admin/update_plan` is mapped to assign plans to users instead of modifying plan definitions.
*   **Resolution**: Update [routes/admin.js](routes/admin.js) to isolate definitions updates under `POST /api/admin/edit_plan_config` and edit [client/src/pages/admin/Plans.jsx](client/src/pages/admin/Plans.jsx) to target the updated endpoint.

### 1.2 Prevent Chat Widget Configuration Database Overflows
*   **Problem**: Styling payload config strings lack length limits, causing database overflows.
*   **Resolution**: Add express-validator controls to verify length bounds on widget configs inside `routes/widget.js`.

### 1.3 Catch Campaign Handshake Exception loops
*   **Problem**: Missing Meta API parameters trigger exceptions during campaign registration.
*   **Resolution**: Update [routes/broadcast.js](routes/broadcast.js) with try-catch enclosures mapping empty metadata states gracefully.

---

## 2. Inbox Usability

### 2.1 Kanban Column Drag-and-Drop Sync
*   **Problem**: Moving chat cards across status columns is visual-only and does not persist.
*   **Resolution**: 
    1. Expose `POST /api/inbox/update_kanban_status` in [routes/inbox.js](routes/inbox.js).
    2. Add status column mappings in PostgreSQL `chats` table.
    3. Update [client/src/pages/user/Kanban.jsx](client/src/pages/user/Kanban.jsx) to invoke the update endpoint on drops.

### 2.2 Inbox Real-time Filtering Tabs
*   **Problem**: R Reps cannot filter conversations by ownership.
*   **Resolution**: Add checkboxes in the inbox view to filter by "Assigned to Me", "Assigned to Others", and "Unassigned".

### 2.3 Drag-and-Drop File Uploads
*   **Problem**: Attaching files requires browser navigation dialog triggers.
*   **Resolution**: Update [client/src/pages/user/Inbox.jsx](client/src/pages/user/Inbox.jsx) thread container to intercept window drop events, queuing files automatically in the media composer.

---

## 3. Media Uploads

### 3.1 Upload Progress Indicators
*   **Resolution**: Update Axios configurations inside `apiFormRequest` to dispatch progress updates, and hook a linear HTML5 `<progress>` bar to the media composer.

### 3.2 Secure Upload Validations
*   **Resolution**: Validate file extensions and enforce limits (e.g. max 10MB) both in the frontend composer UI and inside the express upload controllers.

---

## 4. WhatsApp Conversation Workflow

### 4.1 Activate WhatsApp QR Baileys Linker
*   **Problem**: Baileys connector and QR generation code are currently stubs.
*   **Resolution**: Integrate a real Baileys connection scheduler thread. Hook callbacks to save session files, output QR base64 strings to target pages, and initialize listeners.

### 4.2 QR Webhook Ingest Pipeline
*   **Problem**: Messages arriving via QR channels bypass keyword checks.
*   **Resolution**: Link Baileys message events callbacks to [helper/inbox/inbox.js](helper/inbox/inbox.js) `processMessage`.

### 4.3 Composer Quick Templates Picker
*   **Resolution**: Query local templates via REST, rendering a picker dropdown in the composer to inject text.

---

## 5. Agent Workflow

### 5.1 Multi-Agent Chat Reassignment
*   **Problem**: Inbox only supports assigning chats to agents, not transferring them.
*   **Resolution**: Emit Socket events notifying changes when reps re-assign active threads.

### 5.2 Assigned Chat Backups
*   **Problem**: Deleting agents orphans chat assignments.
*   **Resolution**: Record historical assignments in a logs table upon deletion.

---

## 6. Webhook Execution Engine

### 6.1 Implement Webhook Rules Matcher Loop
*   **Resolution**: Update the incoming message ingest loop in [helper/inbox/inbox.js](helper/inbox/inbox.js) to query active rules from `webhook_rules` table and evaluate event matches.

### 6.2 Outbound Webhook Dispatch Client
*   **Resolution**: Write a background dispatcher helper (`helper/webhooks/dispatcher.js`) sending POST requests to registered URL targets when conditions match.

### 6.3 Webhook Request Delivery Logging
*   **Resolution**: Create the `webhook_logs` table schema in the database and save dispatch outputs (response status, payload body, timestamp).

---

## 7. Campaign Blockers

### 7.1 Sandbox Mode Campaign Emulation
*   **Resolution**: Update `getMetaNumberDetail` under [functions/function.js](functions/function.js) to return mock numbers details if `MOCK_META_DELIVERY=true` is enabled.
*   **Campaign Loop Bypass**: Update [loops/campaignLoop.js](loops/campaignLoop.js) to simulate successful broadcast loops and write logs locally without calling Graph API.

### 7.2 Campaign List Statistics Cards
*   **Resolution**: Display sent/delivered ratios on each campaign card using logs aggregates.

---

## 8. UX Parity Improvements

### 8.1 Create Local Templates Page UI
*   **Problem**: Local templates have CRUD APIs, but lack a client user interface page.
*   **Resolution**: Add React page `LocalTemplates.jsx` to list, create, and delete local text templates, and register it in `AppRoutes.jsx`.

### 8.2 Chatbot Trigger Words UI Editor
*   **Resolution**: Add inline edit panels inside chatbot settings view to modify keyword sets.

---

## 9. Missing CRM Workflows

### 9.1 Update Phonebook lists API
*   **Resolution**: Add `POST /api/phonebook/update` to support renaming list groups.

### 9.2 Update Contact details API
*   **Resolution**: Add `POST /api/phonebook/update_contact` to edit contact parameters in the DB.

### 9.3 Payment Gateways credentials setup
*   **Resolution**: Add fields in Admin settings form to manage keys.

---

## 10. Cosmetic Polish

### 10.1 Correct Success Response spelling typos
*   **Resolution**: Clean up response messages (e.g. replace `"addedd"` with `"added"`).

### 10.2 Custom Styled Toggle Switches
*   **Resolution**: Replace native checkbox controls with custom CSS slide toggles on connection settings cards.
