# Failure Root Cause Analysis

**Date:** 2026-06-23  
**Audited runs for PR #6 / Commit `b884dfd5c85302f31446e350551a36bf426dbe3f`:**  
*   GitGuardian Security Checks  
*   Pull Request Validation CI: `28012254895`  
*   Security CI (historical failures, e.g. `28012186401`)  

---

## 1. GitGuardian Security Check Failures

The GitGuardian check-run reported 4 active secrets detected in the commit `b884dfd5c85302f31446e350551a36bf426dbe3f`:

1.  **File:** [.github/workflows/security.yml](file:///.github/workflows/security.yml)
    *   **Line Number:** 18
    *   **Secret Type:** Generic Password
    *   **Secret Value:** `b1g...[REDACTED]...dev`
    *   **Status:** Present in the current branch code.

2.  **File:** [.github/workflows/build.yml](file:///.github/workflows/build.yml)
    *   **Line Number:** 18
    *   **Secret Type:** Generic Password
    *   **Secret Value:** `b1g...[REDACTED]...dev`
    *   **Status:** Present in the current branch code.

3.  **File:** [.github/workflows/pr.yml](file:///.github/workflows/pr.yml)
    *   **Line Number:** 18
    *   **Secret Type:** Generic Password
    *   **Secret Value:** `b1g...[REDACTED]...dev`
    *   **Status:** Present in the current branch code.

4.  **File:** [PRODUCTION_ENV_TEMPLATE.md](file:///PRODUCTION_ENV_TEMPLATE.md)
    *   **Line Number:** 119
    *   **Secret Type:** Company Email Password
    *   **Secret Value:** `CHA...[REDACTED]..._ME`
    *   **Status:** Present in the current branch code.

---

## 2. Pull Request Validation CI Failures

*   **Failing Step:** `Run Backend Integration & Parity Tests`
*   **Failing Command:** `npm test` (specifically running `node cross_module_integration_audit.js`)
*   **Error Output:**
    ```
    Total: 35  |  ✅ Passed: 32  |  ❌ Failed: 3  |  Score: 91%

    FAILURES:
      ❌ [FLOW→CHATBOT] Get flows: Found 0 flows
      ❌ [FLOW→CHATBOT] Flow existence: No flows exist
      ❌ [CONTACT→CAMPAIGN] Phonebook existence: No phonebooks — cannot test campaign
    ```
*   **Failing File and Line Numbers:**
    *   [cross_module_integration_audit.js](file:///cross_module_integration_audit.js) line 67: `log('FLOW→CHATBOT', 'Get flows', flows.success && flows.data?.length > 0, ...)`
    *   [cross_module_integration_audit.js](file:///cross_module_integration_audit.js) line 70: `log('FLOW→CHATBOT', 'Flow existence', false, 'No flows exist');`
    *   [cross_module_integration_audit.js](file:///cross_module_integration_audit.js) line 132: `log('CONTACT→CAMPAIGN', 'Phonebook existence', false, 'No phonebooks — cannot test campaign');`
*   **Root Cause:** The PostgreSQL service container starts empty. The integration tests require seeded flows and phonebooks to validate flows and campaigns, but the database seeding endpoint `/api/user/seed_demo_data` was never invoked during the test setup phase in GitHub Actions.

---

## 3. Security CI Failures (Historical)

*   **Failing Scan:** Gitleaks Secret Scan (in earlier runs e.g., `28012186401` / `28012119399`)
*   **Failing Files & Line Numbers:**
    *   [docs/reference-pages/live-crawl/user/conversational-api.md](file:///docs/reference-pages/live-crawl/user/conversational-api.md) line 120
    *   [docs/reference-pages/live-crawl/user/template-api.md](file:///docs/reference-pages/live-crawl/user/template-api.md) line 107
*   **Root Cause:** Hardcoded crawled JWT token was tracked in documentation. (Note: These files were cleaned and the history was squashed/pushed, causing `Security CI` to pass in the latest runs).
