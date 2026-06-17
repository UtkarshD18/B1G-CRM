# Reference Page Audit — Chatbot Diagnostics

- **Page Purpose:** Manage auto-reply WhatsApp bot settings and view real-time diagnostics.
- **Page Layout:** Dashboard containing active chatbot triggers list, chatbot diagnostics log grid, and trigger details panel.
- **Navigation Structure:** User portal `/user?page=wa-chatbot`.
- **Tables & Lists:** Chatbot triggers table, Chatbot logs table (Time, Incoming Message, Matched Rule, Bot Response, Delivery Status).
- **Filters & Search:** Filter diagnostics by chatbot ID, filter logs by status (matched, unmatched, failed).
- **Forms & Inputs:** Chatbot CRUD form (title, trigger words input, target phonebook dropdown, automation flow dropdown, status toggle).
- **Actions:** Toggle bot active state, create trigger, delete trigger, view execution logs details.
- **Workflows:** Meta Webhook ingest → chatbot processor reads active flow → evaluates keywords → triggers automatic response → writes database row in `chatbot_log`.
- **API Expectations:**
  - `GET /api/chatbot/get_bots`: Fetch tenant bots
  - `GET /api/chatbot/get_logs`: Fetch bot diagnostic history
  - `POST /api/chatbot/add`: Save chatbot rule
