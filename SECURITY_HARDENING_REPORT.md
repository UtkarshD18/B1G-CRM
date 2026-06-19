# SECURITY_HARDENING_REPORT.md

This report details the production-critical security vulnerabilities identified and resolved during Sprint 12.

---

## 1. Password Hashes Removal in JWT Payloads
*   **Vulnerability**: Previously, the signed JWT payloads (access, refresh, recovery, and agent impersonation tokens) encoded the bcrypt-hashed password field. If a token was intercepted or compromised, base64-decoding the token exposed the password hash.
*   **Resolution**: Modified all 11 authentication token signing points inside `routes/user.js`, `routes/admin.js`, and `routes/agent.js` to exclude the `password` field from payload payloads.
*   **Authentication & Authorization Preservation**:
    *   Updated `middlewares/user.js`, `middlewares/admin.js`, and `middlewares/agent.js` to check database existence using the verified `email` and `uid` fields, eliminating the dependency on password hashes while keeping session validity intact.
    *   Added the user's `uid` to password recovery tokens to enable middleware-driven verification of email/UID pairs without needing the password hash.

---

## 2. Cross-Tenant Webhook Agent Assignment Protection (IDOR Prevention)
*   **Vulnerability**: In `helper/webhooks/engine.js`, the rules matcher executed the `assign_agent` action using the raw `agentUid` from the user-configured rule payload without verifying that the agent belonged to that user. An attacker could configure a rule to assign their chats to another tenant's agent, leading to cross-tenant chat leakage.
*   **Resolution**: Added a strict ownership verification check:
    ```javascript
    const agentVerify = await query(`SELECT * FROM agents WHERE uid = ? AND owner_uid = ?`, [agentUid, uid]);
    if (agentVerify.length > 0) { ... }
    ```
    This blocks unauthorized mappings if the agent does not belong to the workspace owner (`uid`).

---

## 3. WhatsApp Session Presence Update Isolation (IDOR Prevention)
*   **Vulnerability**: The endpoint `/api/qr/change_instance_status` accepted an instance ID (`insId`) and mutated status and presence settings on that session without checking if the instance belonged to the caller (`req.decode.uid`). Any authenticated user could change another tenant's WhatsApp presence state.
*   **Resolution**: Enforced database validation constraints matching both instance ID and owner UID:
    ```javascript
    const [existing] = await query(`SELECT * FROM instance WHERE uniqueId = ? AND uid = ?`, [insId, req.decode.uid]);
    if (!existing) { return res.json({ success: false, msg: "Instance was not found or unauthorized" }); }
    ```
    Also locked the database update to use both:
    ```sql
    UPDATE instance SET other = ? WHERE uniqueId = ? AND uid = ?
    ```

---

## 4. Gating Public Debug and Setup Endpoints
*   **Vulnerability**: Leftover debug routes (`/api/qr/create`, `/api/qr/send`, and `/api/inbox/` root) and installer endpoints (`/api/web/install_app`) were publicly exposed without authentication, introducing remote file extraction/write and private session update risks.
*   **Resolution**:
    *   Applied `validateUser` to `/api/qr/create`, `/api/qr/send`, and `/api/inbox/` root, mapping UIDs dynamically.
    *   Applied `adminValidator` to `/api/web/` connection status check, mapping to admin UID.
    *   Added password verification to `/api/web/install_app` matching the seeded administrator password hash, preventing unauthenticated archive extraction.

---

## 5. Verification Results
Running the adversarial security testing tool (`node adversarial_security_test.js`) yields a **100% success rate** with all cross-tenant attacks blocked:
*   [PASS] Cross-Tenant Rule Update on `/webhooks/rules/update`
*   [PASS] Cross-Tenant Rule Delete on `/webhooks/rules/delete`
*   [PASS] Cross-Tenant Template Update on `/templet/update`
*   [PASS] Cross-Tenant Template Delete on `/templet/del_templets`
*   [PASS] Cross-Tenant Chatbot Update on `/chatbot/update_chatbot`
*   [PASS] Cross-Tenant Chatbot Delete on `/chatbot/del_chatbot`
*   [PASS] Cross-Tenant Flow Delete on `/chat_flow/del_flow`
*   [PASS] Cross-Tenant PB Rename on `/phonebook/update`
*   [PASS] Cross-Tenant Contact Edit on `/phonebook/update_contact`
*   [PASS] Cross-Tenant Contact Delete on `/phonebook/del_contacts`
*   [PASS] Cross-Tenant PB Delete on `/phonebook/del_phonebook`
*   [PASS] Cross-Tenant Agent Activeness Update on `/agent/change_agent_activeness`
*   [PASS] Cross-Tenant Agent Assignment update_agent_in_chat on `/agent/update_agent_in_chat`
*   [PASS] Cross-Tenant Agent Delete on `/agent/del_agent`
*   [PASS] Cross-Tenant Task Delete on `/user/del_task_for_agent`
