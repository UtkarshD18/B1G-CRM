# Next 10 Features Queue (NEXT_10_FEATURES.md)

This list defines the prioritized development queue of features to achieve parity with the reference CRM, ranked by Business Value, Implementation Effort, Readiness, and Product Importance.

---

## Prioritized Feature Queue

### 1. WhatsApp QR Connection Engine (Baileys)
- **Priority:** High
- **Business Value:** High (Provides sandbox WhatsApp number linking without needing Meta Cloud apps).
- **Effort:** 5 days
- **Dependencies:** Ready (existing \`instance\` database table).
- **Action:** Wires Baileys library connection sockets inside [helper/addon/qr/index.js](file:///home/shadow/projects/B1GCRM/helper/addon/qr/index.js).

### 2. Stripe Webhook checkout Verification
- **Priority:** High
- **Business Value:** High (Enables paid subscriptions checkout upgrades).
- **Effort:** 2 days
- **Dependencies:** Stripe SDK integration.
- **Action:** Verifies callback signature and triggers the \`updateUserPlan()\` limits updater.

### 3. Outbound Webhook execution pipeline & Logs
- **Priority:** High
- **Business Value:** High (Links external visitor platforms to WhatsCRM).
- **Effort:** 3 days
- **Dependencies:** Ready (existing \`webhook_rules\` table).
- **Action:** Adds dispatch trigger on message save and exposes logs database viewer page.

### 4. JWT Expiry & Security Hardening
- **Priority:** High
- **Business Value:** High (Protects tenant API resources and prevents credential breaches).
- **Effort:** 2 days
- **Dependencies:** None.
- **Action:** Implements JWT token expiry limits and masks password hashes.

### 5. Inbox Media Attachments Serving
- **Priority:** Medium
- **Business Value:** High (Enables image, document, and audio exchange).
- **Effort:** 3 days
- **Dependencies:** Local filesystem mapping.
- **Action:** Saves media files from Socket.IO upload streams and webhook downloads.

### 6. Admin CMS settings Sub-pages CRUD (FAQ & Testimonials)
- **Priority:** Medium
- **Business Value:** Medium (Allows super-admin to edit landing pages).
- **Effort:** 4 days
- **Dependencies:** Ready (existing setting tables).
- **Action:** Expands [Settings.jsx](file:///home/shadow/projects/B1GCRM/client/src/pages/admin/Settings.jsx) with listing tables and modals.

### 7. Plan resource limits Enforcement
- **Priority:** High
- **Business Value:** High (Restricts usage according to plan quotas).
- **Effort:** 2 days
- **Dependencies:** None.
- **Action:** Implements contacts/chatbot count checking in the `checkPlan` middleware.

### 8. Web Push notifications & browser subscription
- **Priority:** Medium
- **Business Value:** Medium (Alerts agents/tenants of incoming messages).
- **Effort:** 4 days
- **Dependencies:** VAPID keys setup.
- **Action:** Registers service worker to stream browser alert notifications.

### 9. WhatsApp Number Warmer
- **Priority:** Medium
- **Business Value:** Medium (Prevents number suspension by Meta).
- **Effort:** 5 days
- **Dependencies:** Functional QR/Meta channels.
- **Action:** Automates simulated dialogue loops between linked warm-up numbers.

### 10. WhatsApp Form builder
- **Priority:** Low
- **Business Value:** Medium (Embeds capture grids for external landing pages).
- **Effort:** 5 days
- **Dependencies:** React Flow builder nodes extensions.
- **Action:** Renders custom form builders and maps submission parameters to contacts.
