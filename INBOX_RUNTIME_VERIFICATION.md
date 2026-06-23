# INBOX_RUNTIME_VERIFICATION.md

**Audit Date**: 2026-06-18  
**Audit Method**: Real-time Socket.IO and HTTP API verification, file upload execution, message history persistence testing, and UI gap analysis.

---

## 1. Inbox Feature Matrix

| Feature | Works | Evidence | Database Persistence | UI Quality | Notes |
| :--- | :---: | :--- | :--- | :--- | :--- |
| **Send Text** | ⚠️ **Blocked** | Socket listener `send_chat_message` delegates to `sendMetaMsg`/`sendQrMsg`. Returns error when credentials are not configured. | ✅ Updates `chats.last_message` and conversation JSON history when keys are present. | Premium (WhatsApp-like layout and bubble styling). | Blocks outgoing chat flow when Meta/QR keys are missing. |
| **Upload Image** | ✅ **Works** | `POST /api/user/return_media_url` returns upload payload `{"success":true,"url":"http://.../media/..."}`. | ✅ Writes file to public media dir `/app/client/public/media/` or S3. | Excellent (Upload picker is integrated). | Upload works locally without Meta. Outgoing dispatch is blocked. |
| **Upload Video** | ✅ **Works** | Upload handles `.mp4`/`.webm` files, returns static URL. | ✅ Media file successfully saved to public files directory. | Excellent (Visual file picker constraints). | Same as image upload. |
| **Upload Document** | ✅ **Works** | Upload saves documents (PDF, DOCX, TXT), returns static download link. | ✅ File written to local filesystem volume. | Good. | Same as above. |
| **Refresh** | ✅ **Works** | Page reload triggers Socket.IO `get_chat` event, fetching chat list. | ✅ Fetches from PG `chats` and `contact` tables. | High (Smooth state refresh). | Preserves open chat state if reloaded. |
| **Persistence** | ✅ **Works** | Conversation history reads from `/app/conversations/inbox/${uid}/${chatId}.json`. | ✅ File system JSON persistence within Docker volumes. | N/A (Backend) | Files persist reliably across backend restarts. |
| **Image Preview** | ✅ **Works** | Frontend `Inbox.jsx` checks `message.type === 'image'` and renders `<img src={...} />`. | N/A (UI layer) | High (Auto-scaled inside bubble). | Local previews work fine. |
| **Video Playback** | ✅ **Works** | Frontend checks `message.type === 'video'` and renders `<video controls src={...} />`. | N/A (UI layer) | High (Native HTML5 playback controller). | Works with standard media streams. |
| **Audio Playback** | ✅ **Works** | Frontend checks `message.type === 'audio'` and renders `<audio controls src={...} />`. | N/A (UI layer) | High (Native HTML5 audio control bar). | Works with standard MP3/WAV uploads. |
| **Doc Download** | ✅ **Works** | Frontend renders `📄 Download Document` link pointing to uploaded static path. | N/A (UI layer) | Good (Underlined green link text). | Opens download in new tab. |
| **Message History** | ✅ **Works** | Renders incoming/outgoing bubbles chronologically with avatars and names. | ✅ Loaded via `readJSONFile()` from JSON disk store. | Excellent (Clear bubble separation). | Chronological sequence preserved. |

---

## 2. Comparison Against Live Reference CRM Inbox

We compared B1GCRM’s local React inbox page (`/user/inbox`) against the live reference CRM page (`https://crm.oneoftheprojects.com/user?page=inbox`).

### A. Missing UI & UX Features
*   **Channels Parity**: The live reference CRM features a sidebar displaying icons and tags for **Telegram** and **Instagram Comment** channels. B1GCRM has tab filters for *WhatsApp, Instagram, and Website*, but Telegram and Instagram Comment rows do not render or feed into the lists.
*   **Initials Avatar Palette**: The reference CRM applies distinct background HSL colors to avatars based on the contact name hash. B1GCRM uses a single default solid gray background.
*   **Tag Management Panel**: The reference CRM has a tag creator panel inline inside the inbox to quickly type and assign tags with hex color selectors. B1GCRM displays tags but lacks an inline tag editor inside the inbox view.

### B. Missing Workflows
*   **Template Direct Selection**: The reference CRM allows users to select Meta and local templates from a dropdown picker directly in the composer bar to send them as quick replies. B1GCRM restricts template dispatches to the distinct `Meta Templates` or `Campaigns` page.
*   **Impersonation Workspace Integration**: The reference CRM automatically loads agent workspace chat allocations inside the main panel, allowing admins to toggle between "My Chats" and "Agent Chats" dynamically. B1GCRM relies on logging out and logging in as an agent to verify agent assigned chats.

### C. Missing Controls
*   **Chat Assignment Logs**: The reference CRM lists a log of assignment actions in the right sidebar (e.g., *"Assigned to Agent X by Admin"*). B1GCRM only shows the current assignee dropdown value and lacks history tracking.
*   **Custom Tags Rules Evaluation**: The reference CRM allows webhooks to tag chats automatically, changing their priority status in the inbox. In B1GCRM, webhook rule tags are saved to DB but not evaluated, so they do not impact the live inbox view.
