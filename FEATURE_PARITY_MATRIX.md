# Feature Parity Matrix (FEATURE_PARITY_MATRIX.md)

This matrix compares the features of the live reference CRM against B1GCRM, indicating files involved, implementation priority, and integration details.

---

## Parity Table

| Reference Feature | Current Status | Files Involved | Priority | Notes |
| --- | --- | --- | --- | --- |
| **Marketing Landing & Pricing** | Partial | [PublicSite.jsx](file:///home/shadow/projects/B1GCRM/client/src/pages/PublicSite.jsx) | High | Static layouts exist; needs integration with Stripe pricing checkouts. |
| **User Portal Registration** | Complete | [UserSignupPage.jsx](file:///home/shadow/projects/B1GCRM/client/src/pages/auth/UserSignupPage.jsx), [routes/user.js](file:///home/shadow/projects/B1GCRM/routes/user.js) | High | Sign-up form inserts database rows correctly. |
| **Unified Portal Logins** | Complete | [LoginPage.jsx](file:///home/shadow/projects/B1GCRM/client/src/pages/auth/LoginPage.jsx), [routes/user.js](file:///home/shadow/projects/B1GCRM/routes/user.js), [routes/admin.js](file:///home/shadow/projects/B1GCRM/routes/admin.js) | High | Authenticates admin, user, and agent staff credentials. |
| **Tenant Dashboard** | Complete | [Dashboard.jsx](file:///home/shadow/projects/B1GCRM/client/src/pages/user/Dashboard.jsx) | High | Loads active chats, tasks, WA accounts metrics correctly. |
| **Inbox & Messaging Console** | Complete | [Inbox.jsx](file:///home/shadow/projects/B1GCRM/client/src/pages/user/Inbox.jsx), [socket.js](file:///home/shadow/projects/B1GCRM/socket.js), [routes/inbox.js](file:///home/shadow/projects/B1GCRM/routes/inbox.js) | High | Real-time text chat, notes, tags selector. |
| **Inbox Media Uploads** | Missing | [socket.js](file:///home/shadow/projects/B1GCRM/socket.js) | High | Outbound and inbound media attachments storage and serving is not implemented. |
| **Contacts & Phonebooks** | Complete | [Contacts.jsx](file:///home/shadow/projects/B1GCRM/client/src/pages/user/Contacts.jsx), [routes/phonebook.js](file:///home/shadow/projects/B1GCRM/routes/phonebook.js) | High | Phonebooks creation, bulk contacts deletion, CSV streaming imports. |
| **Kanban Inbox** | Complete | [Kanban.jsx](file:///home/shadow/projects/B1GCRM/client/src/pages/user/Kanban.jsx) | Medium | Group chats visually by active labels. |
| **Campaign Broadcasting** | Complete | [Campaigns.jsx](file:///home/shadow/projects/B1GCRM/client/src/pages/user/Campaigns.jsx), [loops/campaignLoop.js](file:///home/shadow/projects/B1GCRM/loops/campaignLoop.js), [routes/broadcast.js](file:///home/shadow/projects/B1GCRM/routes/broadcast.js) | High | Broadcast campaigns creation, list, scheduler, loops runner. |
| **Flowbuilder Designer Canvas** | Complete | [AutomationFlows.jsx](file:///home/shadow/projects/B1GCRM/client/src/pages/user/AutomationFlows.jsx), [routes/chatFlow.js](file:///home/shadow/projects/B1GCRM/routes/chatFlow.js) | High | React Flow builder, node properties, save node/edge JSON configs. |
| **Chatbot & Auto-replies** | Complete | [ChatBot.jsx](file:///home/shadow/projects/B1GCRM/client/src/pages/user/ChatBot.jsx), [functions/chatbot.js](file:///home/shadow/projects/B1GCRM/functions/chatbot.js), [routes/chatbot.js](file:///home/shadow/projects/B1GCRM/routes/chatbot.js) | High | Keyword chatbot CRUD and auto-reply diagnostic logs. |
| **Meta WhatsApp Link** | Complete | [Integrations.jsx](file:///home/shadow/projects/B1GCRM/client/src/pages/user/Integrations.jsx), [routes/user.js](file:///home/shadow/projects/B1GCRM/routes/user.js) | High | Saves Meta app credentials and retrieves profile tokens. |
| **WhatsApp QR Connection** | Broken | [helper/addon/qr/index.js](file:///home/shadow/projects/B1GCRM/helper/addon/qr/index.js), [routes/qr.js](file:///home/shadow/projects/B1GCRM/routes/qr.js) | High | Baileys helper exports stubs/no-ops; UI form does not connect. |
| **Agent Accounts & Auto-Login** | Complete | [AgentLogin.jsx](file:///home/shadow/projects/B1GCRM/client/src/pages/user/AgentLogin.jsx), [routes/agent.js](file:///home/shadow/projects/B1GCRM/routes/agent.js), [routes/user.js](file:///home/shadow/projects/B1GCRM/routes/user.js) | High | Agent creation, token impersonation bypass, restricted dashboard. |
| **Agent Tasks Manager** | Complete | [AgentTask.jsx](file:///home/shadow/projects/B1GCRM/client/src/pages/user/AgentTask.jsx), [routes/user.js](file:///home/shadow/projects/B1GCRM/routes/user.js) | Medium | Create task cards, assign agents, agent updates status. |
| **Chat Widget Configurator** | Complete | [ChatWidget.jsx](file:///home/shadow/projects/B1GCRM/client/src/pages/user/ChatWidget.jsx), [routes/user.js](file:///home/shadow/projects/B1GCRM/routes/user.js) | Medium | Customize bubble position, generate JS snippet. |
| **Billing Subscriptions Upgrade** | Partial | [Billing.jsx](file:///home/shadow/projects/B1GCRM/client/src/pages/user/Billing.jsx), [routes/user.js](file:///home/shadow/projects/B1GCRM/routes/user.js) | High | Pricing layout renders; upgrading depends on checkout webhooks. |
| **Developer API secret keys** | Complete | [DeveloperApi.jsx](file:///home/shadow/projects/B1GCRM/client/src/pages/user/DeveloperApi.jsx), [routes/apiv2.js](file:///home/shadow/projects/B1GCRM/routes/apiv2.js) | High | Generates REST keys, displays code snippet samples. |
| **Developer Webhook Rules** | Complete | [DeveloperApi.jsx](file:///home/shadow/projects/B1GCRM/client/src/pages/user/DeveloperApi.jsx), [routes/webhooks.js](file:///home/shadow/projects/B1GCRM/routes/webhooks.js) | High | Webhook CRUD rules are fully working. |
| **Developer Webhook Logs** | Missing | [routes/webhooks.js](file:///home/shadow/projects/B1GCRM/routes/webhooks.js) | Medium | Backend does not log webhook dispatches; UI page is missing. |
| **Meta Template Builder** | Complete | [MetaTemplates.jsx](file:///home/shadow/projects/B1GCRM/client/src/pages/user/MetaTemplates.jsx) | High | Renders templates layout, interfaces with Meta components. |
| **Admin Plans Management** | Complete | [Plans.jsx](file:///home/shadow/projects/B1GCRM/client/src/pages/admin/Plans.jsx), [routes/admin.js](file:///home/shadow/projects/B1GCRM/routes/admin.js) | High | Super-admin dashboard CRUD for subscription plans. |
| **Admin Users Override** | Complete | [Users.jsx](file:///home/shadow/projects/B1GCRM/client/src/pages/admin/Users.jsx), [routes/admin.js](file:///home/shadow/projects/B1GCRM/routes/admin.js) | High | Lists tenants, provides auto-login impersonation bypass. |
| **Admin Settings Settings** | Complete | [Settings.jsx](file:///home/shadow/projects/B1GCRM/client/src/pages/admin/Settings.jsx), [routes/admin.js](file:///home/shadow/projects/B1GCRM/routes/admin.js) | High | Gateway configs, logo file upload, SMTP setup. |
| **Other Channels (Instagram/Telegram)** | Missing | UI placeholders only | High/Med | Reference app menus exist; missing backend/provider hooks. |
| **AI Voice Calling** | Missing | UI placeholders only | Med | Reference app menus exist; missing Twilio integrations. |
| **WhatsApp Forms** | Missing | UI placeholders only | Med | Reference app menus exist; missing form builders. |
| **WhatsApp Warmer** | Missing | UI placeholders only | Med | Reference app menus exist; missing warmup scheduler loops. |
