# Implementation Plan - B1GCRM Production Hardening & Stabilization

This plan details the code changes, visual improvements, and security hardening required to stabilize the B1GCRM application. It integrates the findings from the Sprint 11 stabilization and Sprint 12 production hardening phases.

---

## 1. Goal Description
The core objective is to move B1GCRM from a development prototype to a production-ready, tenant-isolated, and secure SaaS platform. This includes eliminating backend crashes during file operations, completing missing update endpoints and UI modals, implementing the Webhook Rules engine, removing plain text password hashes from customer-held JWT tokens, and preventing Insecure Direct Object Reference (IDOR) vulnerabilities across workspace resources.

---

## 2. Proposed Changes

### A. Dev & Stability Improvements (Sprint 11)
*   **Created [nodemon.json](file:///home/sagaragrawal/Desktop/B1G-CRM/nodemon.json)**: Prevents dev server restarts when writing visual flows, inbox logs, or session credentials.
*   **Enabled Mock Mode in [.env](file:///home/sagaragrawal/Desktop/B1G-CRM/.env)**: Set `MOCK_META_DELIVERY=true` to bypass live Meta Graph API calls.

### B. Contacts & Phonebooks Refactoring (Sprint 11)
*   **Decoupled Loading Statuses**: Splitting UI loader indicator from notification messages in `Contacts.jsx` to preserve transient alerts.
*   **Update UI Forms**: Added modals for editing contacts and renaming phonebooks.
*   **Backend Validation Corrections**: Corrected response typo inside `routes/phonebook.js`.

### C. Webhook Rules Execution Engine (Sprint 11)
*   **Ingest rules matcher**: Connected the webhook rules evaluation matcher (`processWebhookRules`) inside message ingestion controllers.

### D. Token Security Hardening (Sprint 12)
*   **Exclude password hashes from JWT**: Cleaned JWT signing logic in standard logins, signups, recovery links, and agent impersonations to exclude plain text password hashes from token payloads.
*   **Authorization standardizations**: Updated `validateUser`, `validateAgent`, and `adminValidator` middlewares to verify token parameters using email and UID lookups.

### E. IDOR & Tenancy Boundary Hardening (Sprint 12)
*   **Webhook agent assignment verification**: Ensured that the webhook action executor verifies target agent ownership.
*   **WhatsApp presence updates verification**: Enforced tenant check constraints on the presence status changer endpoint `/api/qr/change_instance_status`.

---

## 3. Verification Plan

### Automated Verification
*   **Cross-Tenant Security Audit**: Run `node adversarial_security_test.js` to attempt IDOR attacks across all resource endpoints. All tests must return PASS.
*   **Database Integrity Check**: Run `node database_consistency_check.js` to ensure exactly 0 orphan mapping records are found.
*   **Puppeteer Integration Check**: Executing Puppeteer integration suite to verify login, seeding, CRUD, chatbots, campaign scheduling, and flow canvases.
