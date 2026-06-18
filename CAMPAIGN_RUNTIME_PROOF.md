# CAMPAIGN_RUNTIME_PROOF.md

**Audit Date**: 2026-06-18  
**Audit Method**: REST API endpoint execution, database schema state simulation, and source-code trace.

---

## 1. Failure Analysis & Classification

Campaign creation in B1GCRM fails unless active external Facebook Graph API credentials are configured in PostgreSQL. Below is the breakdown of these blockers:

### Blocker 1: Missing Meta API Credentials
*   **Classification**: **B. Missing credentials** & **A. Meta dependency**
*   **Evidence**: 
    - Calling `POST /api/broadcast/add_new` without credentials in the `meta_api` table returns:
      ```json
      { "success": false, "msg": "We could not find your meta API keys" }
      ```
    - Path: [routes/broadcast.js](file:///home/shadow/projects/B1GCRM/routes/broadcast.js#L265-L274)
      ```javascript
      const getMetaAPI = await query(`SELECT * FROM meta_api WHERE uid = ?`, [req.decode.uid]);
      if (getMetaAPI.length < 1) {
        return res.json({ success: false, msg: "We could not find your meta API keys" });
      }
      ```

### Blocker 2: Meta Graph API Handshake Failure
*   **Classification**: **A. Meta dependency** (External API Validation Call)
*   **Evidence**:
    - When mock/dummy credentials (`access_token = 'mock_token_123'`, `business_phone_number_id = 'mock_phone_id_123'`) are present in `meta_api`, the backend attempts to query the Graph API `v18.0` via `getMetaNumberDetail()`.
    - Because the mock credentials fail authentication with Meta, the endpoint returns:
      ```json
      { "success": false, "msg": "Either your meta API are invalid or your access token has been expired" }
      ```
    - Path: [routes/broadcast.js](file:///home/shadow/projects/B1GCRM/routes/broadcast.js#L288-L299)
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

---

## 2. Runtime Proof Logs

Audit run result (`campaign_audit_report.json` output):
```json
{
  "noMetaKeysTest": {
    "success": false,
    "msg": "We could not find your meta API keys",
    "classification": "B. Missing credentials & A. Meta dependency"
  },
  "invalidMetaKeysTest": {
    "success": false,
    "msg": "Either your meta API are invalid or your access token has been expired",
    "classification": "A. Meta dependency (External Handshake Failure)"
  }
}
```

---

## 3. Campaign Dispatcher Loop Analysis

*   **Loop Worker Location**: [loops/campaignLoop.js](file:///home/shadow/projects/B1GCRM/loops/campaignLoop.js) (runs in background to pull campaigns in `'QUEUE'` status).
*   **Execution Dependency**: Even if campaign records are inserted into the database, the dispatch process calls the Facebook Graph API to send WhatsApp messages. Without real credentials, loop items will transition to `'FAILED'` status, and outbound HTTP requests will fail with authentication or socket network errors.
