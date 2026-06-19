# RUNTIME_ISSUE_REPORT.md

This report details the functional issues identified during runtime testing of the B1GCRM application and the corresponding resolutions implemented in Sprint 11.

---

## Issue 1: Nodemon Watch Restart Loop / Process Abortion during Database Seeding and Visual Flow Operations

*   **Type**: Backend Configuration / Developer Flow
*   **Reproduction Steps (Before Fix)**:
    1. Start the server using the standard development command: `npm run dev` (which executes `nodemon server.js`).
    2. Log in as a tenant and click the **"Generate Demo CRM Data"** button on the dashboard, OR create and save a new flow in the **Automation Flows** canvas.
    3. Observe that the HTTP request fails with a `502 Bad Gateway` (or proxy crash) in the browser.
*   **Console Output**:
    ```
    [nodemon] restarting due to changes...
    [nodemon] starting `node server.js`
    ```
*   **Network Evidence**:
    *   `POST /api/user/seed_demo_data` -> Status: Network connection closed mid-flight (No response received / 502 Bad Gateway).
*   **Backend Evidence**:
    *   The server process writes JSON assets for visual flows to `flow-json/nodes/` and `flow-json/edges/` and conversation logs to `conversations/inbox/`.
    *   Because these folders reside within the watched root directory, nodemon detects the file modifications and immediately terminates the server process to reboot it.
*   **Database Evidence**:
    *   The database is left in a corrupt, partially seeded state. Contacts/phonebooks exist, but agents, tasks, and conversations are never created because the thread was terminated.
*   **Root Cause**:
    Nodemon watches the entire project root recursively by default. Writing operational JSON files in-process during requests triggers automatic server reboots, cutting database seeding and flow saves short.
*   **Resolution Implemented**:
    Created a `nodemon.json` configuration file in the project root to explicitly ignore directories containing runtime file writes:
    ```json
    {
      "ignore": [
        "flow-json/*",
        "conversations/*",
        "sessions/*",
        "logs/*",
        "client/*"
      ]
    }
    ```

---

## Issue 2: Contacts Success Notification Immediately Cleared (Flash Message Bug)

*   **Type**: Frontend UI / UX
*   **Reproduction Steps (Before Fix)**:
    1. Navigate to `/user/contacts`.
    2. Enter a name in the "Create phonebook" form and click "Add phonebook", OR add a single contact.
    3. Observe that the status line text does not show the success message (e.g., `Phonebook created.`) or only flashes it for a millisecond before it disappears.
*   **Console Output**: None.
*   **Network Evidence**:
    1. `POST /api/phonebook/add` -> returns `200 OK` with `{"success":true,"msg":"Phonebook was addedd"}`.
    2. `GET /api/phonebook/get_by_uid` -> returns `200 OK` (reload list).
*   **Backend Evidence**:
    *   Row added to `phonebook` table: `INSERT INTO phonebook (name, uid) VALUES ('Test Phonebook', 'local-user-uid')`.
*   **Database Evidence**:
    *   A row is successfully written to the database.
*   **Root Cause**:
    In `Contacts.jsx`, when phonebook creation returns success, the status is set:
    ```javascript
    setStatus('Phonebook created.')
    loadContactsData()
    ```
    However, `loadContactsData()` immediately sets the status back to `'Loading contacts...'` and, upon successful query completion, clears it to `''`. This renders the success message invisible to the user.
*   **Resolution Implemented**:
    Decoupled the transient operations notification status from the data-loading status. Used a separate `tableLoading` state for table refreshing, allowing the status notifications (`Phonebook created.`, `Contact created.`) to persist for 3 seconds.

---

## Issue 3: Campaign Creation - Success Status Masked by Missing Meta Keys Validation Warning

*   **Type**: Frontend UI / UX
*   **Reproduction Steps (Before Fix)**:
    1. Navigate to `/user/campaigns` and go to the "Send campaign" tab.
    2. Enter a campaign title, select a template and phonebook, and click "Create campaign".
    3. Observe that even if the campaign is successfully created in the database, the status text reads: `"Please check your meta API keys"`.
*   **Console Output**: None.
*   **Network Evidence**:
    1. `POST /api/broadcast/add_new` -> returns `200 OK` with `{"success":true}`.
    2. `GET /api/user/get_my_meta_templets` -> returns `200 OK` with `{"success":false,"msg":"Please check your meta API keys"}`.
*   **Backend Evidence**:
    *   The backend database successfully inserts a campaign into the `broadcast` table.
*   **Database Evidence**:
    *   Row inserted into `broadcast` table (`Demo Launch Campaign`, Status `COMPLETED`).
*   **Root Cause**:
    In `Campaigns.jsx`, upon successful campaign creation, `loadData({ silent: true, finalStatus: 'Campaign created.' })` is called.
    However, the `loadData()` function fetches Meta templates. When this check returns `success: false` due to missing credentials, the status is overwritten:
    ```javascript
    setStatus(
      finalStatus ||
      (mode === 'send' && !templateResult?.success
        ? templateResult?.msg || 'Unable to load Meta templates'
        : ''),
    )
    ```
    Since `finalStatus` is `'Campaign created.'` but `mode === 'send'` and `!templateResult?.success` is true, the condition evaluates to `templateResult?.msg` (i.e. `"Please check your meta API keys"`), which overwrites the success message.
*   **Resolution Implemented**:
    Modified the status evaluation logic inside `loadData()` to preserve the passed `finalStatus` parameter rather than overriding it when template retrieval fails:
    ```javascript
    if (finalStatus) {
      setStatus(finalStatus);
    } else {
      setStatus(
        mode === 'send' && !templateResult?.success
          ? templateResult?.msg || 'Unable to load Meta templates'
          : ''
      );
    }
    ```

---

## Issue 4: Campaign Creation and Processing Blocked without Meta API Keys (Missing Sandbox Fallback)

*   **Type**: Backend / Configuration / UX Blocker
*   **Reproduction Steps (Before Fix)**:
    1. Navigate to `/user/campaigns` and go to the "Send campaign" tab.
    2. Submit the form to create a campaign.
    3. Observe that creation is blocked with the message `"We could not find your meta API keys"` or `"Either your meta API are invalid..."`.
*   **Console Output**: None.
*   **Network Evidence**:
    *   `POST /api/broadcast/add_new` -> returns `{"success":false,"msg":"We could not find your meta API keys"}`.
*   **Backend Evidence**:
    *   `routes/broadcast.js` queries `meta_api` table. Since it is empty, it returns the error.
*   **Database Evidence**:
    *   No row is inserted into the `broadcast` table.
*   **Root Cause**:
    New tenant accounts do not have Meta keys configured. Without configuring `MOCK_META_DELIVERY=true` in `.env`, the system requires live Meta credentials to perform campaign validations.
*   **Resolution Implemented**:
    Defined `MOCK_META_DELIVERY=true` in `.env` for local testing. This triggers the auto-insertion of mock credentials (`mock-phone-id` / `mock-token`) and bypasses live Graph API requests.

---

## Issue 5: Demo Workspace Seeder Fails to Populate Templates Table

*   **Type**: Backend / Database / Seeder Bug
*   **Reproduction Steps (Before Fix)**:
    1. Trigger the "Generate Demo CRM Data" button on the dashboard.
    2. Run a query directly against the database: `SELECT COUNT(*) FROM templets;`.
    3. Observe that the returned count is `0`.
*   **Console Output**: None.
*   **Network Evidence**:
    *   `POST /api/user/seed_demo_data` -> returns `{"success":true,"msg":"Demo CRM workspace successfully seeded!"}`.
*   **Backend Evidence**:
    *   `routes/user.js` inserts records for phonebooks, contacts, campaigns, logs, chatbots, chatbot logs, agents, tasks, and conversations, but does not perform any inserts on the `templets` table.
*   **Database Evidence**:
    *   Table `templets` is empty (`count: 0`).
*   **Root Cause**:
    The seeder definition under `routes/user.js` lacks any code blocks or queries targeting the `templets` database table. It relies on the UI fetching templates via the Graph API, leaving the database local templates database table empty.
*   **Resolution Implemented**:
    Updated the seeder code in `routes/user.js` to insert default templates (`demo_welcome_template` and `order_update`) directly into the `templets` table:
    ```javascript
    const existingTemplates = await query(`SELECT * FROM templets WHERE uid = ?`, [req.decode.uid]);
    if (existingTemplates.length === 0) {
      await query(
        `INSERT INTO templets (uid, title, content, type) VALUES 
         (?, 'demo_welcome_template', 'Hello {{1}}, welcome to our CRM service!', 'text'),
         (?, 'order_update', 'Hello {{1}}, your order {{2}} has been shipped!', 'text')`,
        [req.decode.uid, req.decode.uid]
      );
    }
    ```

---

## Issue 6: Webhook Rules Evaluation Engine Missing

*   **Type**: Backend / Missing Logic
*   **Reproduction Steps (Before Fix)**:
    1. Navigate to `/user/manage-webhooks` (Webhook Rules) and create a rule (e.g., action `tag_chat` or `assign_agent` when message body contains a word).
    2. Send an incoming webhook payload to the ingest endpoint: `POST /api/inbox/webhook/:uid`.
    3. Inspect database logs and tags, and observe that no rule execution takes place (no chat tags are set, no agent is assigned, and no rules logs are written to `webhook_logs`).
*   **Console Output**: None.
*   **Network Evidence**: None.
*   **Backend Evidence**:
    *   A codebase-wide search confirms that the table `webhook_rules` is only queried for CRUD inside `routes/webhooks.js`.
    *   The incoming message parser in `routes/inbox.js` and `helper/inbox/inbox.js` completely lacks any query or matching logic to process rules.
*   **Database Evidence**:
    *   Rules are correctly stored in the `webhook_rules` table, but `webhook_logs` remains empty.
*   **Root Cause**:
    The webhook rules feature was partially implemented. While the database schema and CRUD API endpoints existed, the execution engine that connects rules to the incoming message lifecycle was missing.
*   **Resolution Implemented**:
    Integrated the rules matcher evaluation logic (`processWebhookRules`) inside the message ingestion controller `helper/inbox/inbox.js`. Active rules are queried from the database, matched against message body strings, and corresponding actions are executed with logs saved to `webhook_logs`.

---

## Issue 7: Spelling Typo in Phonebook Success Response

*   **Type**: Backend / User Interface Typo
*   **Reproduction Steps (Before Fix)**:
    1. Create a new phonebook.
    2. Observe the raw network response JSON in developer tools.
*   **Console Output**: None.
*   **Network Evidence**:
    *   `POST /api/phonebook/add` -> returns `{"success":true,"msg":"Phonebook was addedd"}`.
*   **Backend Evidence**:
    *   `routes/phonebook.js` contains the string `"Phonebook was addedd"`.
*   **Root Cause**:
    Spelling typo in `routes/phonebook.js` where "added" is spelled as "addedd".
*   **Resolution Implemented**:
    Corrected the success message in `routes/phonebook.js` to `"Phonebook was added"`.
