# Top 20 Real Gaps

These gaps are verified through runtime code inspection and direct comparison with the reference CRM.

## Top 20 Functional & Parity Gaps

### Inbox & Chats (Module 2)
1. **Quick Reply Templates Dropdown**: Missing a selector in the chat composer to insert canned reply templates.
2. **Emoji Picker Integration**: Composer lacks an emoji picker popup.
3. **Delivery & Read Receipts (Ticks)**: Chat thread does not display single/double delivery checkmarks.
4. **Message Reactions**: Thread does not support message reactions (e.g. thumbs up, heart).
5. **Media Preview Bubbles**: Incoming/outgoing images and videos render as plain text links rather than visual media cards inside the message bubble.
6. **Chat Tag/Label Creator**: Users cannot create or delete tag labels from the chat context sidebar.

### Kanban Board (Module 3)
7. **Drag-and-Drop Columns**: Kanban cards cannot be dragged between Open, Pending, and Solved columns. Status updates are triggered by click actions only.

### Contacts & Phonebooks (Module 4)
8. **Contact Search Input**: The phonebook contacts grid lacks a search input to filter contacts by name or number.
9. **Contact Detail Drawer**: Lacks a slide-out drawer or detailed modal to inspect single contact variables, tags, and histories.
10. **Duplicate Contact Detection**: No utility to scan, flag, or merge duplicate contact records during CSV import.

### Integrations (Module 9)
11. **Functional Baileys QR Sync**: The `/user/add-whatsapp-qr` route is broken because the backend Baileys connection handler is stubbed and does not instantiate a real session manager to keep connections alive.
12. **Instagram DM Bot**: Route `/user/insta-dm-bot` renders a reference placeholder card instead of active API integrations.
13. **Telegram Sessions**: Route `/user/telegram-sessions` is a mock placeholder.

### Developer API & Webhooks (Module 10)
14. **Webhook Execution Logs**: Lacks an audit table to view status codes and response bodies of triggered webhook events.
15. **API Rate Limiting**: The REST API endpoints do not utilize rate limiters, leaving the application vulnerable to credential stuffing and resource exhaustion.

### Portal Settings & Configuration (Module 14)
16. **Stripe Webhook Authentication**: Webhook validation signature checks are incomplete, causing payment status callbacks to be ignored.
17. **Social OAuth Logins**: Frontend buttons exist for Google/Facebook login but backend redirect/callback endpoints are incomplete.
18. **Chat Widget Live Preview**: The Chat Widget configuration page lacks a visual sandbox rendering of the widget style during editing.

### Dashboards (Module 1)
19. **Admin Portal Revenue Chart**: Admin dashboard displays total counts but lacks currency/revenue tracking aggregates.
20. **Agent Self-Service Settings**: Agents cannot modify their own profile details or passwords from the Agent Portal.
