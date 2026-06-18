# INBOX_RUNTIME_PROOF.md

**Audit Date**: 2026-06-18  
**Verification Method**: Automated Puppeteer traversals, HTTP upload payload execution (`verify-inbox-e2e.js`), Docker container audits, and API validations.

---

## 1. Inbox End-to-End Verification Checklist

| Step / Action | Works | Evidence | Notes |
| :--- | :---: | :--- | :--- |
| **1. Inbox Page Loads** | ✅ **Works** | Renders React component structure cleanly on `/user/inbox`. | No blank screens or console failures. |
| **2. Conversation List Loads** | ✅ **Works** | Client emits `get_chat` on connect. Server returns rows from `chats` table. | Loads active customer threads. |
| **3. Customer Detail Panel** | ✅ **Works** | Right sidebar loads contact name, tags list, internal chat notes form. | Connects to `POST /api/user/save_note`. |
| **4. Message Panel Loads** | ✅ **Works** | Central bubble container displays outgoing/incoming chat history. | Reads from conversation JSON files on disk. |
| **5. Send Text Message** | ⚠️ **Blocked** | Socket listener `send_chat_message` delegates to Facebook Graph API. | Fails without active Meta WABA keys. |
| **6. Upload Image** | ✅ **Works** | `POST /api/user/return_media_url` returns `{"success":true,"url":"http://.../media/..."}`. | Upload completes locally without Meta. |
| **7. Upload Video** | ✅ **Works** | Same endpoint saves video file (MP4/WebM), returns URL. | File is saved locally. |
| **8. Upload Document** | ✅ **Works** | Same endpoint saves document, returns URL. | Content-type checks resolve statically. |
| **9. Refresh Page** | ✅ **Works** | Page reload triggers Socket.IO reconnect, preserving chat state. | Fetches recent details. |
| **10. Media Persistence / Previews** | ✅ **Works** | Renders using dynamic HTML5 `<img/>`, `<video/>`, `<audio/>` players. | Prevents broken links on refreshes. |

---

## 2. Technical Diagnostics & Trace

### A. File Upload Endpoint & Code Verification
The client uploads files to:
*   **API Route**: `POST /api/user/return_media_url`
*   **Controller Execution**: Evaluates file parameter `file`, generates UUID filename, maps path using:
    `file.mv(`${__dirname}/../client/public/media/${filename}`)`
*   **Result Payload**:
    ```json
    {
      "success": true,
      "url": "http://localhost:3010/media/2W8SKWgSd5PBdEMm3V5B8RQn2C0DWd5S.txt"
    }
    ```

### B. Storage & Reachability Verification
*   **Host Path**: Files do not exist under host `/home/shadow/projects/B1GCRM/client/public/media/` because Docker uses named volumes.
*   **Container Disk Path**: Verified file is saved in the app container:
    `docker exec b1gcrm-app-1 ls -l /app/client/public/media/2W8SKWgSd5PBdEMm3V5B8RQn2C0DWd5S.txt`
    `-rw-r--r-- 1 root root 30 Jun 18 09:08 /app/client/public/media/2W8SKWgSd5PBdEMm3V5B8RQn2C0DWd5S.txt`
*   **Named Volume Mapping**: Managed by `app-media` volume in `docker-compose.yml`:
    `- app-media:/app/client/public/media`
*   **Static Asset URL Resolution**: The Express server serves `/media` requests by mapping:
    `server.js`: `app.use('/media', express.static(path.join(__dirname, 'client/public/media')))`
    An Axios GET request to `http://localhost:3010/media/2W8SKWgSd5PBdEMm3V5B8RQn2C0DWd5S.txt` returned status `200 OK` and the exact text content: *"Audit file upload text content"*.

### C. Database & Logs Tracing
*   **Real-time logs**: Message logs are stored in conversation files:
    `/app/conversations/inbox/${uid}/${chatId}.json`
*   **PostgreSQL**: The `chats` table persists metadata: `last_message`, `last_message_came`, and `is_opened`.

---

## 3. Discovered Gaps & Root Cause Analysis

*   **Inbox Layout**: The layout is functional in terms of structural flex/grid. However, it requires responsive layout review to ensure narrow viewports do not squash text input and media selectors.
*   **Mixed Ports/URLs in Dev**: In local docker compose, `env.js` might map media URLs to port 5173 (Vite dev) if `FRONTEND_URL` is set to `http://localhost:5173`. In production, the unified port 3010 resolves static files.
