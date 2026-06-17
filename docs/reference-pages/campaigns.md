# Reference Page Audit — Campaigns & Broadcasting

- **Page Purpose:** Orchestrate and monitor automated WhatsApp broadcast message campaigns.
- **Page Layout:** Master-detail list of campaigns with status cards (Sent, Pending, Failed), campaign scheduler form, and target audience selector.
- **Navigation Structure:** User portal `/user?page=campaign-dashboard` (for analytics) and `/user?page=send-campaign` (for setup).
- **Tables & Lists:** Historical campaigns table (ID, Title, Target Group, Status, Created At, Action buttons), campaign delivery log table.
- **Filters & Search:** Filter campaigns by status (QUEUE, PROCESSING, COMPLETED, FAILED), search by campaign title.
- **Forms & Inputs:** Campaign Title input, Phonebook Target selector dropdown, Meta Template selector, Scheduling datetime-picker, Timezone selector dropdown.
- **Actions:** Start campaign, pause/cancel campaign, delete campaign records, download campaign delivery analytics.
- **Workflows:** User submits broadcast schedule → loops/campaignLoop processes target phonebook contacts in chunks → invokes Meta Template API → registers delivery logs.
- **API Expectations:**
  - `GET /api/broadcast/get_broadcasts`: List historical campaigns
  - `POST /api/broadcast/add_broadcast`: Schedule a new campaign
  - `DELETE /api/broadcast/delete_broadcast`: Delete campaign record
