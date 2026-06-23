# FEATURE_REMOVAL_IMPACT_REPORT.md

This report identifies all files, imports, route registrations, and permissions referencing the features targeted for permanent scope removal:
*   Telegram Config & sessions
*   WA Call Logs & Voice calling builders

---

## 1. Files & Imports Referencing Features

### Frontend Navigation Constants
*   **File**: `client/src/shared/navigation.js`
    *   **Reference**: `Telegram Config` admin sidebar menu item (Line 30).
    *   **Action**: Remove sidebar navigation entry.

### Frontend Route Configurations
*   **File**: `client/src/routes/AppRoutes.jsx`
    *   **References**:
        *   `telegram-config` route registration (Line 74)
        *   `telegram-sessions` route registration (Line 114)
        *   `create-call-flow` route registration (Line 109)
        *   `wa-call-logs` route registration (Line 110)
        *   `setup-wa-calls` route registration (Line 111)
    *   **Action**: Delete these route entries from the reference/planned route matrices.

### Backend Feature Flags
*   **File**: `env.js`
    *   **Reference**: `ENABLE_TELEGRAM: envValue("ENABLE_TELEGRAM") !== "false"` feature flag (Line 121).
    *   **Action**: Remove feature flag configuration entry.

---

## 2. Safe-Keep Enclosure Check

*   **WhatsApp CRM**: Protected (No modifications).
*   **Meta / Instagram Integration**: Protected (No modifications).
*   **Inbox / Agent Workflows**: Protected (Only rendering helpers for legacy icons exist; active logic untouched).
