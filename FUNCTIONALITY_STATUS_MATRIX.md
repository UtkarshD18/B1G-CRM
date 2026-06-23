# Functionality Status Matrix

Page-level audit of data loading, forms, buttons, uploads, search, filters, pagination, and runtime grades.

| Page / Route | Role | Data Load | Form Submit | Upload | Search | Filters | Status | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `/user/dashboard` | User | Yes | N/A | N/A | N/A | N/A | **Fully Working** | KPI metrics and time-series charts load. |
| `/user/inbox` | User | Yes | Yes | **Partial** | Yes | Yes | **Partially Working** | Sockets work; upload files fail to render inline thumbnails in chat bubble. |
| `/user/kanban` | User | Yes | Yes | N/A | N/A | N/A | **Partially Working** | Board status changes via button clicks; drag-and-drop missing. |
| `/user/contacts` | User | Yes | Yes | Yes | **No** | **No** | **Partially Working** | Group creation, CSV uploads work; search/filters missing. |
| `/user/campaigns` | User | Yes | Yes | N/A | N/A | Yes | **Fully Working** | Mapped broadcast campaign constructor. |
| `/user/automation-flows` | User | Yes | Yes | N/A | N/A | N/A | **Fully Working** | ReactFlow interactive node canvas editor. |
| `/user/chatbot` | User | Yes | Yes | N/A | N/A | Yes | **Fully Working** | Target filters and logs load correctly. |
| `/user/integrations` | User | Yes | Yes | N/A | N/A | N/A | **Partially Working** | Meta config saves; Baileys QR sync is stubbed. |
| `/user/billing` | User | Yes | Yes | N/A | N/A | N/A | **Partially Working** | Checkout initializes; Webhook signature checks incomplete. |
| `/user/settings` | User | Yes | Yes | N/A | N/A | N/A | **Fully Working** | Profile and credentials changes save. |
| `/admin/dashboard` | Admin | Yes | N/A | N/A | N/A | N/A | **Fully Working** | Analytics metrics loads. |
| `/admin/manage-plans` | Admin | Yes | Yes | N/A | N/A | N/A | **Fully Working** | Plan package CRUD works. |
| `/admin/manage-users` | Admin | Yes | Yes | N/A | N/A | N/A | **Fully Working** | Impersonation, limits, deletion works. |
| `/admin/orders` | Admin | Yes | N/A | N/A | N/A | N/A | **Fully Working** | stripe checkout logs displays. |
| `/admin/settings` | Admin | Yes | Yes | Yes | N/A | N/A | **Fully Working** | SMTP, Brand logo upload, FAQ and Page CRUD works. |
| `/agent/dashboard` | Agent | Yes | Yes | N/A | N/A | N/A | **Fully Working** | Scoped chats and task updates work. |
