# Instagram DM Bot E2E Verification Report

This report presents the runtime evidence, database checks, and JSON file structure validations for the Instagram channel integrations. All checks were verified using mock providers inside the active Docker containers.

---

## 1. Webhook Verification

**Test Script**: `verify-instagram-webhooks.js`

This script validates OAuth storage, webhook GET handshake subscription, signature-validated POST message delivery, database updates, thread creation, and chatbot trigger actions:

### Executed Steps & Results
1. **Link Mock Instagram Account Keys**:
   - Status: Connected successfully (`{ success: true }`)
   - DB Verification: Row successfully persisted in `instagram_api` table.
2. **GET Handshake Verification**:
   - Endpoint: `/api/instagram/webhook/local-user-uid`
   - Response Code: `200`
   - Challenge verification returned identical challenge value: `insta-challenge-token-123`
3. **Chatbot Flow Setup**:
   - Flow created: `insta-flow` with a text response node triggered by keyword `"trigger"`.
   - Active chatbot rule bound to the `INSTAGRAM` origin successfully added to the database.
4. **Mock POST Message Delivery**:
   - Signature validation computed with `X-Hub-Signature-256` header using HMAC SHA-256 and the mock app secret.
   - Webhook POST request returned status code `200`.
5. **Thread & History Checks**:
   - **PostgreSQL**: A new chat thread was automatically created with `chat_id = sender-psid-1781816530770` and `origin = 'instagram'`.
   - **File System**: Conversation history JSON file correctly created at `conversations/inbox/local-user-uid/sender-psid-1781816530770.json` with message text `"trigger"` and route `"INCOMING"`.
6. **Chatbot Event Trigger**:
   - `chatbot_log` recorded a trigger status of `"matched"` for keyword `"trigger"`.
7. **Clean up**:
   - Bot rule, flow, and Instagram api links successfully deleted (`instagram_api` cleared).

### Execution Summary
```json
{
  "linkAccount": { "success": true, "msg": "Instagram credentials connected successfully." },
  "dbKeysPersisted": true,
  "getHandshake": { "status": 200, "bodyMatchesChallenge": true },
  "createChatbot": { "success": true, "msg": "Chatbot was added" },
  "webhookPostStatus": 200,
  "chatPersisted": true,
  "fileHistoryPersisted": true,
  "incomingMessageText": "trigger",
  "chatbotTriggered": true,
  "cleanupDisconnectSuccess": true
}
```

---

## 2. Inbox Integration & Media Persistence

**Test Script**: `verify-instagram-inbox.js`

This script verifies that Instagram conversations display in the unified inbox, that text/image/video/document replies are normalizable, and survive browser/page refreshes (history persistence).

### Executed Steps & Results
1. **Unified Inbox List**:
   - Querying `/api/inbox/get_chats` returns the Instagram chat card, correctly identifying the origin property: `instagram`.
2. **Outgoing Replies**:
   - **Text**: Outgoing reply sent. (Mock Message ID: `mock-insta-msg-id-kLjggNPuZljBRHyh`)
   - **Image**: Outgoing image sent with caption. (Mock Message ID: `mock-insta-msg-id-m576YDRsplJQHGur`)
   - **Video**: Outgoing video sent with caption. (Mock Message ID: `mock-insta-msg-id-glw1h4WD8NFXXTSr`)
   - **Document**: Outgoing document sent. (Mock Message ID: `mock-insta-msg-id-MqSQWZkzbIG6RHgv`)
3. **Persistence Verification (`get_convo`)**:
   - Conversation history JSON file persists a total of 5 messages (1 initial incoming + 4 outgoing replies).
   - Reload verification confirms that media links render correctly.
   - Database `chats` table updates `last_message` column to point to the last sent document.

### Execution Summary
```json
{
  "getChats": { "success": true, "foundTargetChat": true, "originProperty": "instagram" },
  "sendText": { "success": true, "id": "mock-insta-msg-id-kLjggNPuZljBRHyh" },
  "sendImage": { "success": true, "id": "mock-insta-msg-id-m576YDRsplJQHGur" },
  "sendVideo": { "success": true, "id": "mock-insta-msg-id-glw1h4WD8NFXXTSr" },
  "sendDoc": { "success": true, "id": "mock-insta-msg-id-MqSQWZkzbIG6RHgv" },
  "persistenceVerification": {
    "messageCount": 5,
    "initialMessageText": "Hello inbox test",
    "textReplyText": "Hello, this is an outgoing reply to Instagram!",
    "imageReplyUrl": "http://localhost:3010/static/logo.png",
    "imageCaption": "Outgoing image reply",
    "videoReplyUrl": "http://localhost:3010/static/video.mp4",
    "docReplyUrl": "http://localhost:3010/static/document.pdf"
  },
  "lastDbMessagePersisted": true
}
```

---

## 3. Agent Assignment & Workflow

**Test Script**: `verify-instagram-agent-workflow.js`

This script verifies restricted inbox visibility, chat assignment updates, and that assigned agents can save notes and reply to Instagram threads:

### Executed Steps & Results
1. **Restricted Visibility (Before Assignment)**:
   - Logging in as `agent@example.com` and fetching assigned chats returns a count of `1` (Instagram thread `test-agent-insta-chat-888` is **hidden**).
2. **Assign Chat to Agent**:
   - The tenant owner assigns the chat `test-agent-insta-chat-888` to `local-agent-uid`.
   - DB Verification: Row inserted in `agent_chats` table.
3. **Visibility (After Assignment)**:
   - Agent requests assigned chats, which now returns a count of `2` (Instagram chat is **visible**).
4. **Agent Note**:
   - Agent saves note: `"This is an agent note on Instagram chat!"`.
   - DB Verification: `chats.chat_note` is populated with the note.
5. **Agent Reply**:
   - Agent sends text reply: `"Agent reply from restricted workspace!"`.
   - Message is successfully written to the JSON conversation history, tracking `agent: 'agent@example.com'`.

### Execution Summary
```json
{
  "visibilityBeforeAssignment": { "isVisible": false, "chatsCount": 1 },
  "assignmentResponse": { "msg": "Updated", "success": true },
  "dbAssignmentPersisted": true,
  "visibilityAfterAssignment": { "isVisible": true, "chatsCount": 2 },
  "notePersisted": true,
  "agentReply": { "success": true, "id": "mock-insta-msg-id-No6k3L53ezZyB1Ln" },
  "replyPersisted": true
}
```
