# Instagram DM Bot Implementation Report

This report outlines the design, schema additions, and routing flows implemented to establish complete parity between the Instagram DM Bot and the existing WhatsApp inbox workflow.

---

## 1. Schema & Account Connection

### Database Schema
A new table `instagram_api` has been created in PostgreSQL 16 to store the tenant credentials and metadata:

```sql
CREATE TABLE IF NOT EXISTS instagram_api (
  id SERIAL PRIMARY KEY,
  uid VARCHAR(191) NOT NULL UNIQUE,
  instagram_business_account_id VARCHAR(255),
  access_token TEXT,
  username VARCHAR(255),
  name VARCHAR(255),
  app_id VARCHAR(255),
  createdAt TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_instagram_api_uid ON instagram_api(uid);
```

### Account Connection Flow
- **Connect (`POST /api/instagram/save_keys`)**: Persists credentials linked to the tenant's user session (`uid`), ensuring strong tenant isolation.
- **OAuth Simulation**: A frontend simulator allows linking a mock Instagram account instantly to verify and test workflows in local development.
- **Disconnect (`POST /api/instagram/disconnect`)**: Deletes the tenant credentials, wiping active links.
- **Status/Retrieve (`GET /api/instagram/get_keys`)**: Serves credentials to the frontend connection panel.

---

## 2. Webhook Receiver

The webhook receiver resides at `/api/instagram/webhook/:uid`, ensuring tenant isolation out of the box:

- **Subscription Handshake (`GET`)**: Verifies `hub.mode === 'subscribe'` and validates that `hub.verify_token` matches the tenant's `uid`, returning the requested challenge string.
- **Payload Receiver (`POST`)**:
  - Validates signatures using the `X-Hub-Signature-256` header (HMAC SHA256 using the app secret).
  - Normalizes incoming DMs (text, image, video, file attachments) into the standard B1GCRM message structure.
  - Automatically creates a new thread in the `chats` table with `origin = 'instagram'` if it is a new contact.
  - Appends incoming messages to the JSON file at `conversations/inbox/{uid}/{sender_psid}.json`.
  - Dispatches WebSocket events (`update_chat_list` and `update_conversation`) to active sessions.
  - Triggers the Chatbot engine (`metaChatbotInit`) and Webhook forwarding rules (`processWebhookRules`).

---

## 3. Unified Inbox Integration

- **Platform Icon**: The sidebar checks `chat.origin`. If it is `'instagram'`, the unified inbox renders the native HSL-colored Instagram icon.
- **Media Support**:normalizes media structures so that text, images, videos, and PDF document downloads render correctly inside the inbox message bubble system.
- **Agent Assignment & Restricted Visibility**:
  - Leverages the existing `agent_chats` table.
  - Agents can only view Instagram threads assigned to them by the tenant owner.
  - Assigned agents can save thread notes (persisted to `chats.chat_note`) and compose replies.
  - Agent replies update history JSON files and the database `chats` table.

---

## 4. Chatbot Engine Parity

- The `runChatbot` workflow has been extended to check the chatbot's configuration origin.
- If a keyword matches and the chatbot is bound to the `INSTAGRAM` origin, it formats and forwards the reply to `sendInstagramMsgChatbot`, executing the mock/real Graph API call and appending the reply to the conversation JSON.
