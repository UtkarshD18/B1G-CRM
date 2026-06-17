# B1GCRM Ranked Feature Gaps (TOP_20_GAPS.md)

This document maps out the top 20 implementation gaps between the current B1GCRM codebase and the live reference CRM. Gaps are ranked based on Business Value, User Impact, Code Readiness, and Dependency Complexity.

---

## Ranked Gap Inventory

### 1. WhatsApp QR Connection Engine (Baileys Integration)
- **Description:** Replace the stubbed helper/mock interfaces with a functional Baileys connection engine to allow number linking via QR.
- **Required Files:** [helper/addon/qr/index.js](file:///home/shadow/projects/B1GCRM/helper/addon/qr/index.js), [routes/qr.js](file:///home/shadow/projects/B1GCRM/routes/qr.js), [client/src/pages/user/Integrations.jsx](file:///home/shadow/projects/B1GCRM/client/src/pages/user/Integrations.jsx)
- **Backend Changes:** Setup real Baileys connection hooks, handle session serialization on disk, emit qrcode/status socket events.
- **Frontend Changes:** Listen to \`qr\` websocket events, render real-time QR code, display active socket link statuses.
- **Database Changes:** None (uses existing \`instance\` table).
- **Estimated Effort:** 5 days (Medium complexity)

### 2. Stripe Webhook Verification & Plan Upgrades
- **Description:** Implement robust payment callbacks verification and secure checkout logs updates.
- **Required Files:** [routes/user.js](file:///home/shadow/projects/B1GCRM/routes/user.js), [functions/function.js](file:///home/shadow/projects/B1GCRM/functions/function.js)
- **Backend Changes:** Parse raw Stripe webhook body, check signature, update user plan limits JSON and expiry in PostgreSQL.
- **Frontend Changes:** Billing pricing selection checkout handlers.
- **Database Changes:** None.
- **Estimated Effort:** 2 days (Low complexity)

### 3. Outbound Webhook Dispatch & Execution Engine
- **Description:** Execute custom webhook rules and dispatch JSON payloads to registered URLs when events occur.
- **Required Files:** [routes/webhooks.js](file:///home/shadow/projects/B1GCRM/routes/webhooks.js), [helper/inbox/inbox.js](file:///home/shadow/projects/B1GCRM/helper/inbox/inbox.js)
- **Backend Changes:** In message ingest path, query active rules, dispatch POST requests to URLs, log execution status.
- **Frontend Changes:** None.
- **Database Changes:** Add \`webhook_logs\` table for audit trails.
- **Estimated Effort:** 3 days (Medium complexity)

### 4. JWT Authentication Hardening & Expiry Enforcement
- **Description:** Secure user/admin/agent login routes by removing password hash materials from tokens and setting explicit expiry limits.
- **Required Files:** [routes/user.js](file:///home/shadow/projects/B1GCRM/routes/user.js), [routes/admin.js](file:///home/shadow/projects/B1GCRM/routes/admin.js), [routes/agent.js](file:///home/shadow/projects/B1GCRM/routes/agent.js), [middlewares/user.js](file:///home/shadow/projects/B1GCRM/middlewares/user.js)
- **Backend Changes:** Adjust jwt signing options, strip passwords from tokens, validate token expiry headers.
- **Frontend Changes:** Handle token refresh/logout state upon validation failures.
- **Database Changes:** None.
- **Estimated Effort:** 2 days (Low complexity)

### 5. Authentication Gating for Mutating Public Routes
- **Description:** Secure public update and install endpoints from unauthenticated writes.
- **Required Files:** [routes/web.js](file:///home/shadow/projects/B1GCRM/routes/web.js)
- **Backend Changes:** Add middleware auth guards to \`/api/web/install_app\` and \`/api/web/update_app\`.
- **Frontend Changes:** None.
- **Database Changes:** None.
- **Estimated Effort:** 1 day (Low complexity)

### 6. Inbox Media Attachments Storage Persistence
- **Description:** Store, map, and serve uploaded media attachments (images/video/pdf) securely in both inbound (webhook) and outbound (socket) paths.
- **Required Files:** [routes/inbox.js](file:///home/shadow/projects/B1GCRM/routes/inbox.js), [socket.js](file:///home/shadow/projects/B1GCRM/socket.js)
- **Backend Changes:** Save attachments locally on disk, map paths inside database or conversation JSON.
- **Frontend Changes:** Render media preview bubbles (image previews, audio players) inside the inbox conversation window.
- **Database Changes:** None.
- **Estimated Effort:** 3 days (Medium complexity)

### 7. Plan Feature Gates & Resource Limits Enforcement
- **Description:** Complete enforcement logic in \`checkPlan\` middleware to block campaign loops, API access, chatbot, and contact creation once limits are reached.
- **Required Files:** [middlewares/plan.js](file:///home/shadow/projects/B1GCRM/middlewares/plan.js), [routes/phonebook.js](file:///home/shadow/projects/B1GCRM/routes/phonebook.js)
- **Backend Changes:** Query count of contacts/chatbots in active queries, reject requests exceeding plan limits.
- **Frontend Changes:** Display quota progress bars and limit warning banners.
- **Database Changes:** None.
- **Estimated Effort:** 2 days (Low complexity)

### 8. Webhook Automation Rules Logs Viewer
- **Description:** Expose webhook execution logs grid to users to verify integration dispatches.
- **Required Files:** [client/src/pages/user/DeveloperApi.jsx](file:///home/shadow/projects/B1GCRM/client/src/pages/user/DeveloperApi.jsx), new routes
- **Backend Changes:** Add \`GET /api/webhooks/logs\` logs pagination endpoint.
- **Frontend Changes:** Render webhook logs grid table displaying timestamp, URL, rule triggered, status, response code.
- **Database Changes:** Setup \`webhook_logs\` table.
- **Estimated Effort:** 3 days (Low complexity)

### 9. Admin CMS settings (FAQ, Testimonial, Partners, Legal Pages)
- **Description:** Replace current placeholder forms under admin settings with robust CRUD operations for landing page content.
- **Required Files:** [routes/admin.js](file:///home/shadow/projects/B1GCRM/routes/admin.js), [client/src/pages/admin/Settings.jsx](file:///home/shadow/projects/B1GCRM/client/src/pages/admin/Settings.jsx)
- **Backend Changes:** Implement faq, testimonial, page edit, partner logo upload endpoints.
- **Frontend Changes:** Update sub-tab layouts to list items, add creation modals, and call APIs.
- **Database Changes:** None (uses existing tables).
- **Estimated Effort:** 4 days (Low complexity)

### 10. Database Foreign Keys Constraints Migration
- **Description:** Add explicit PostgreSQL foreign key constraints to secure data relationships.
- **Required Files:** New migration file, [database/schema.sql](file:///home/shadow/projects/B1GCRM/database/schema.sql)
- **Backend Changes:** None.
- **Frontend Changes:** None.
- **Database Changes:** Alter tables (e.g. \`contact\` references \`phonebook\`, \`agent_chats\` references \`agents\`) to add cascade rules.
- **Estimated Effort:** 2 days (Low complexity)

### 11. Instagram Messenger Connection Integration
- **Description:** Link Meta Instagram app credentials, ingest webhook DM payloads, and auto-reply.
- **Required Files:** [routes/inbox.js](file:///home/shadow/projects/B1GCRM/routes/inbox.js), [helper/inbox/inbox.js](file:///home/shadow/projects/B1GCRM/helper/inbox/inbox.js)
- **Backend Changes:** Add Instagram webhook validators, process message structures, map threads.
- **Frontend Changes:** Connect integrations Instagram settings panel.
- **Database Changes:** None.
- **Estimated Effort:** 7 days (High complexity)

### 12. Telegram Sessions Connection
- **Description:** Integrate Telegram session connection credentials to send and receive messages.
- **Required Files:** Telegram helper modules, [routes/user.js](file:///home/shadow/projects/B1GCRM/routes/user.js)
- **Backend Changes:** Connect Telegram API client, manage sessions database/file storage.
- **Frontend Changes:** Render session login details.
- **Database Changes:** Add \`telegram_sessions\` table.
- **Estimated Effort:** 7 days (High complexity)

### 13. Web Push Notifications Subsystem
- **Description:** Setup VAPID keys, collect browser subscriptions, and send push notices.
- **Required Files:** Service worker files, backend router
- **Backend Changes:** Store browser push tokens, dispatch push alerts on inbox message reception.
- **Frontend Changes:** Register service worker, ask push permission.
- **Database Changes:** Add \`push_subscriptions\` table.
- **Estimated Effort:** 4 days (Medium complexity)

### 14. WhatsApp Warmer (Automatic Warmup Sequencer)
- **Description:** Automated messaging warmup sequencer to prevent numbers from being flagged by Meta.
- **Required Files:** Warmer loops scheduler, UI route
- **Backend Changes:** Background task scheduler that sends simulated chats between linked warm-up numbers.
- **Frontend Changes:** Render configuration panel to set daily limits, interval timers.
- **Database Changes:** Add \`wa_warmer_configs\` table.
- **Estimated Effort:** 5 days (Medium complexity)

### 15. WhatsApp Form Builder and Hosted iframes
- **Description:** Builder allowing users to generate custom lead capture forms and embed them.
- **Required Files:** Form builder route, canvas frontend
- **Backend Changes:** Save form structures, capture submission payloads, map answers to CRM contacts variables.
- **Frontend Changes:** Form designer UI (drag fields, copy iframe code).
- **Database Changes:** Add \`whatsapp_forms\` and \`form_submissions\` tables.
- **Estimated Effort:** 5 days (Medium complexity)

### 16. AI WhatsApp Voice Calling (Twilio Integration)
- **Description:** Link Twilio account credentials, compile voice call trees, and log records.
- **Required Files:** Calling loops helper, calling dashboard
- **Backend Changes:** Integrate Twilio Voice API, handle TwiML routing callbacks, log call stats.
- **Frontend Changes:** Display audio logs, calling configs form.
- **Database Changes:** Add \`call_logs\` and \`call_trees\` tables.
- **Estimated Effort:** 8 days (High complexity)

### 17. Duplicate Number Merging Tools
- **Description:** Identify and merge duplicate contact numbers within phonebooks.
- **Required Files:** [routes/phonebook.js](file:///home/shadow/projects/B1GCRM/routes/phonebook.js), [client/src/pages/user/Contacts.jsx](file:///home/shadow/projects/B1GCRM/client/src/pages/user/Contacts.jsx)
- **Backend Changes:** Query matching numbers, merge associated custom fields, delete duplicate rows.
- **Frontend Changes:** Add "Find Duplicates" button and resolution modal.
- **Database Changes:** None.
- **Estimated Effort:** 2 days (Low complexity)

### 18. Inbox Messages Pagination (Infinite Scroll)
- **Description:** Support infinite scroll or chunk-based loading of message histories for high-volume tenants.
- **Required Files:** [routes/inbox.js](file:///home/shadow/projects/B1GCRM/routes/inbox.js), [client/src/pages/user/Inbox.jsx](file:///home/shadow/projects/B1GCRM/client/src/pages/user/Inbox.jsx)
- **Backend Changes:** Implement offset/cursor limits pagination query on conversations.
- **Frontend Changes:** Update message scroll containers to fetch next pages on top-scroll trigger.
- **Database Changes:** None.
- **Estimated Effort:** 3 days (Low complexity)

### 19. Encrypted Secrets Management
- **Description:** Cryptographically encrypt sensitive third-party API keys (Meta Graph, Stripe, PayPal) stored in database config tables.
- **Required Files:** [routes/admin.js](file:///home/shadow/projects/B1GCRM/routes/admin.js), encryption helper
- **Backend Changes:** Use aes-256-gcm to encrypt keys on write and decrypt on read.
- **Frontend Changes:** Mask keys with asterisks inside setting screens.
- **Database Changes:** None.
- **Estimated Effort:** 2 days (Medium complexity)

### 20. Horizontal Scaling Redis Socket Adapter
- **Description:** Integrate Redis adapter to allow running multiple container instances behind a load balancer without dropping Socket.IO state.
- **Required Files:** [socket.js](file:///home/shadow/projects/B1GCRM/socket.js)
- **Backend Changes:** Wires \`@socket.io/redis-adapter\` pool with env configuration.
- **Frontend Changes:** None.
- **Database Changes:** None.
- **Estimated Effort:** 3 days (Medium complexity)
