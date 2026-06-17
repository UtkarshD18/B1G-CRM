# Reference Page Audit — Integrations & API Keys

- **Page Purpose:** Expose developer credentials, REST API keys, and webhook endpoints to link third-party apps.
- **Page Layout:** Cards layout showing API Secret token panel, Webhook URL destination configuration form, and webhook rule settings.
- **Navigation Structure:** User portal `/user?page=api-dashboard` and `/user?page=manage-webhooks`.
- **Tables & Lists:** Webhook automation rules list (Rule Name, Event, Trigger Condition, Action Payload, Status).
- **Filters & Search:** None.
- **Forms & Inputs:** Generate API Key form, Webhook rules CRUD form (Name, Event Type, Match Field, Operator, Action Type, Payload).
- **Actions:** Generate new API key, copy webhook destination URL, add webhook rule, delete rule, toggle rule active.
- **Workflows:** System registers incoming webhook/message → evaluates webhook rules in database → triggers payload to registered target endpoint.
- **API Expectations:**
  - `GET /api/user/generate_api_keys`: Generate/refresh API secret
  - `POST /api/webhooks/rules`: Add webhook rule
