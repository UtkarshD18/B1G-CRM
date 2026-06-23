# FEATURE_GAP_REPORT.md

This report analyzes the functional gaps between B1GCRM and a fully realized production-ready WhatsApp/Omnichannel CRM. It catalogs missing integrations, stubs, and partial implementations.

---

## 1. QR WhatsApp Integration (Baileys Session Connector)
*   **Current State**: 
    The user interface presents a page to generate a WhatsApp QR code, check connection status, and list active sessions. The API endpoint `/api/qr/gen_qr` is mapped, and database operations insert/query from the `instance` table.
*   **The Gap**: 
    The core daemon helper under `helper/addon/qr` (or `helper/qr/`) is stubbed out or returns static mock values. The actual WhatsApp web socket interface (typically built using the `@whiskeysockets/baileys` package) is missing or non-functional.
*   **Business Impact**: 
    Users cannot connect local WhatsApp devices via QR code. Outbound QR-based messages fail or are dropped, preventing the CRM from functioning as a WhatsApp gateway for local numbers.

---

## 2. Meta Instagram Business Account Integration
*   **Current State**: 
    UI panels show cards to configure Instagram Business accounts, and placeholders exist under the user settings and integrations views.
*   **The Gap**: 
    No backend controllers or webhook endpoints are wired up to parse incoming Instagram Direct Messages (DMs) or comments. The message ingestion loop is WhatsApp-centric.
*   **Business Impact**: 
    Omnichannel messaging is limited. Agents cannot receive or reply to Instagram messages from the central Inbox.

---

## 3. Telegram API Integration
*   **Current State**: 
    Integrations page lists "Telegram" as a potential channel with configuration fields.
*   **The Gap**: 
    The backend lacks the Telegram bot receiver logic and session configurations. The endpoints to send Telegram messages are unimplemented.
*   **Business Impact**: 
    Telegram customer inquiries cannot be routed to the CRM workspace.

---

## 4. Real-time Push Notifications
*   **Current State**: 
    User profile settings include toggles for desktop/web push notifications.
*   **The Gap**: 
    No Service Worker registration or Web Push (VAPID) keys exchange protocol is implemented on either the frontend or backend.
*   **Business Impact**: 
    Agents must keep the CRM tab open to see incoming chat updates; no background desktop notifications are sent when new messages arrive.

---

## 5. Webhook & API Key Analytics
*   **Current State**: 
    Integrations tab contains charts for API keys usage and incoming webhooks statistics.
*   **The Gap**: 
    The tracking of API/Webhook hits is either not logged in the database or does not have aggregated query routes. The charts display mock static data or empty panels.
*   **Business Impact**: 
    Administrators cannot monitor request volumes, error rates, or billing usage logs.

---

## 6. Local Template Modification
*   **Current State**: 
    Seeder successfully inserts template rows into the `templets` table.
*   **The Gap**: 
    While contacts/phonebooks can now be renamed/edited, there is no UI or backend route implemented to update local template contents (`templets` table rows). If a template content needs modification, it has to be deleted and recreated.
*   **Business Impact**: 
    Minor operational friction when adjusting campaign templates.
