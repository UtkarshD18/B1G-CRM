# Reference Page Audit — Inbox

- **Page Purpose:** Core workspace for real-time customer chat management, supporting text, attachments, and quick response flows.
- **Page Layout:** 3-panel dynamic layout (Left: Chat list with tenant filter & tags; Middle: Active chat bubble thread, composer, attachments; Right: Contact meta-details, tags assignment, comments).
- **Navigation Structure:** Mounted under user portal `/user?page=inbox` and restricted agent portal `/agent?page=inbox`.
- **Tables & Lists:** Chat conversation thread list, agent assignments list, quick-reply templates list.
- **Filters & Search:** Search by contact name/number, filter by tag/label, filter by assigned agent (Unassigned, Assigned to Me, Assigned to Others).
- **Forms & Inputs:** Message composer input (textarea), quick reply selector dropdown, tag creation input, agent selector dropdown, chat note text field.
- **Actions:** Send text message, upload attachment (image/video/pdf), assign chat to agent, set chat labels/tags, save/delete chat notes.
- **Workflows:** Message ingest via Meta Cloud API webhook → Socket.IO broadcast to online tenant/assigned agent → dynamic layout update.
- **API Expectations:**
  - `GET /api/inbox/get_chat`: Load active chat thread list
  - `POST /api/inbox/send_chat_message`: Send WhatsApp text/media payload
  - `POST /api/agent/update_agent_in_chat`: Assign agent to chat
