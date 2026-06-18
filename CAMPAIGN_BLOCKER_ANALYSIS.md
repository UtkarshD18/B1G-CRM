# CAMPAIGN_BLOCKER_ANALYSIS.md

**Audit Date**: 2026-06-18  
**Audit Method**: API codebase review of `routes/broadcast.js` and database validation tracing.

---

## 1. Blocker Classification Summary

Campaign creation in B1GCRM fails unless strict Facebook Graph API integration conditions are met. Below is the classification of these blockers:

*   **Blocker 1: Missing Meta API Keys in Database**
    *   **Classification:** B. Missing credentials & A. Meta dependency.
    *   **Root Cause:** The endpoint checks if the user has saved credentials in the `meta_api` table. If no credentials exist, it returns `{"success":false,"msg":"We could not find your meta API keys"}`.
    *   **Evidence:** `routes/broadcast.js` lines 265-274:
        ```javascript
        const getMetaAPI = await query(`SELECT * FROM meta_api WHERE uid = ?`, [
          req.decode.uid,
        ]);
        if (getMetaAPI.length < 1) {
          return res.json({
            success: false,
            msg: "We could not find your meta API keys",
          });
        }
        ```
    *   **Required Fix:** Configure real Meta credentials in the portal or implement a simulated local broadcast fallback bypass when `NODE_ENV === 'development'`.

*   **Blocker 2: Meta Token/Mobile ID Validation Handshake Failure**
    *   **Classification:** A. Meta dependency.
    *   **Root Cause:** The endpoint makes a live HTTP request to Facebook's Graph API (`v18.0`) to fetch phone number details. If the token is invalid, expired, or blocked, Facebook returns an error object, and B1GCRM returns `{"success":false,"msg":"Either your meta API are invalid or your access token has been expired"}`.
    *   **Evidence:** `routes/broadcast.js` lines 288-299:
        ```javascript
        const getMetaMobileDetails = await getMetaNumberDetail(
          "v18.0",
          getMetaAPI[0]?.business_phone_number_id,
          getMetaAPI[0]?.access_token
        );
        if (getMetaMobileDetails.error) {
          return res.json({
            success: false,
            msg: "Either your meta API are invalid or your access token has been expired",
          });
        }
        ```
    *   **Required Fix:** The application must utilize valid Meta access tokens. In development mode, the check should bypass the live API validation call if dummy credentials (e.g., `mock-token`) are provided.

---

## 2. In-Process Loop Engine Analysis

The backend contains a background campaign runner loop (`loops/campaignLoop.js`) that runs periodically. However, its execution is bound by these blockers:
1.  **Strict Transaction Dependencies**: It queries `broadcast` table rows where status is `'QUEUE'` and executes them using the stored `access_token` and `business_phone_number_id`.
2.  **No Live Output Offline**: Since the delivery loops execute real Facebook Graph API calls, even if database records are bypassed, campaign dispatches fail with Axios connection or authentication errors on offline testing.
3.  **No Sandbox / Dry-Run Mode**: The loop doesn't have a dry-run flag to simulate delivery status updates (`SENT`, `DELIVERED`, `READ`) locally.

---

## 3. Recommended Remediation Plan

To enable campaign testing without live Meta dependencies:
1.  **Add Sandbox Flag**: Add a boolean environment variable `MOCK_META_DELIVERY=true` in `env.js`.
2.  **Mock Handshake**: Update `getMetaNumberDetail()` in `functions/function.js` to return a fake phone details object if the sandbox flag is enabled.
3.  **Mock Dispatch**: Update the campaign loop to skip Axios posts to `graph.facebook.com` and directly update the `broadcast_log` statuses to `delivered` or `read` automatically after 5 seconds to simulate real-time campaigns.
