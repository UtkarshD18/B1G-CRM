# AUDIT_CONFIDENCE_REVIEW.md

**Audit Date**: 2026-06-18  
**Audit Purpose**: Verify and grade the reliability of B1GCRM functionality findings from Sprint 1 through Sprint 4 audits, defining evidence types and identifying items requiring future runtime reverification.

---

## 1. Audit Confidence Matrix

| Finding | Source | Evidence Type | Confidence | Needs Reverification |
| :--- | :--- | :--- | :---: | :---: |
| **Admin, User, Agent Auth Persistence** | [verify-role-logins.js](file:///home/shadow/projects/B1GCRM/verify-role-logins.js) | Programmatic Axios API tokens exchange & JWT payload analysis. | **High** | No |
| **22 Portal Subpage Routes Loads** | [verify-local-pages.js](file:///home/shadow/projects/B1GCRM/verify-local-pages.js) | Automated headless browser traversal & React runtime console logs scan. | **High** | No |
| **Contacts & Phonebooks CRUD** | [verify-contacts-phonebooks.js](file:///home/shadow/projects/B1GCRM/verify-contacts-phonebooks.js) | Direct PG client queries and row cascade deletion check. | **High** | No |
| **Local Templates API insertion** | [verify-local-templates.js](file:///home/shadow/projects/B1GCRM/verify-local-templates.js) | PostgreSQL table `templets` row creation validation. | **High** | No |
| **Lack of Local Templates UI page** | Workspace check / route trace | Frontend sitemap inspection of SPA pages. | **High** | No |
| **Inbox Media Upload (Images/Video/Doc)** | [verify-inbox-e2e.js](file:///home/shadow/projects/B1GCRM/verify-inbox-e2e.js) | File upload controller checks, container filesystem scans, GET requests status 200. | **High** | No |
| **Blocked Inbox Message Dispatch** | [verify-inbox-e2e.js](file:///home/shadow/projects/B1GCRM/verify-inbox-e2e.js) | Programmatic verification of Socket callback errors on message sending. | **High** | No |
| **Automation Flow Serialization** | [verify-automation-flows.js](file:///home/shadow/projects/B1GCRM/verify-automation-flows.js) | Nodes/edges JSON file system I/O confirmation inside volume directory. | **High** | No |
| **Chatbot triggers & flows binding** | [verify-chatbot.js](file:///home/shadow/projects/B1GCRM/verify-chatbot.js) | PG queries validating `chatbot` table rows creation and active toggles. | **High** | No |
| **Agent tasks & comments submission** | [verify-agent-lifecycle.js](file:///home/shadow/projects/B1GCRM/verify-agent-lifecycle.js) | PG queries verifying `agent_task` comment strings and status transitions. | **High** | No |
| **Webhook Rules CRUD** | [verify-webhooks.js](file:///home/shadow/projects/B1GCRM/verify-webhooks.js) | Axios CRUD endpoint validations and PostgreSQL rule records verification. | **High** | No |
| **Lack of Webhook Rules execution engine**| [verify-webhooks.js](file:///home/shadow/projects/B1GCRM/verify-webhooks.js) / code trace | Source code analysis of incoming pipelines (`routes/inbox.js`, `helper/inbox/inbox.js`). | **High** | No |
| **Campaign creation fails without keys** | [verify-campaigns.js](file:///home/shadow/projects/B1GCRM/verify-campaigns.js) | API execution returning "We could not find your meta API keys". | **High** | No |
| **Campaign creation fails with expired keys**| [verify-campaigns.js](file:///home/shadow/projects/B1GCRM/verify-campaigns.js) | API execution returning Graph API handshake error response. | **High** | No |
| **Campaign Background Dispatch Loops** | [loops/campaignLoop.js](file:///home/shadow/projects/B1GCRM/loops/campaignLoop.js) | Code inspection of pending campaign query loops. | **Medium** | **Yes** (Requires validation with mock loops sandbox). |
| **Deployment Readiness Configuration** | [env.js](file:///home/shadow/projects/B1GCRM/env.js) / code inspection | Checking client Socket connection origins (`window.location.origin`) and API fetch URLs. | **High** | No |
| **Stubbed WhatsApp QR Generation** | [helper/addon/qr/processThings.js](file:///home/shadow/projects/B1GCRM/helper/addon/qr/processThings.js) | Code inspection of Baileys integration hooks. | **High** | No |
| **Stubbed Instagram/Telegram controls** | Visual layouts review | Sidebar route inspection and button class checks. | **High** | No |
| **Stripe / PayPal Checkout Failures** | [routes/billing.js](file:///home/shadow/projects/B1GCRM/routes/billing.js) | Code inspection of Stripe redirect controller functions. | **Medium** | **Yes** (Needs local sandbox checkout emulator checks). |

---

## 2. Reverification Action Plan

For findings graded as **Medium** confidence, the following steps are required during future sprints to establish absolute runtime proof:
1.  **Campaign Dispatch Loop Verification**: Add `MOCK_META_DELIVERY=true` flag. Verify that the loop successfully pulls campaigns in `'QUEUE'` status, iterates over `broadcast_log` rows, and transitions their statuses to `delivered` or `failed` in the database without throwing Axios socket exceptions.
2.  **Stripe Billing Checkout Verification**: Implement a dev-mode stripe webhook emulator to trigger plan activations locally and confirm order records are successfully populated in the `orders` database table.
