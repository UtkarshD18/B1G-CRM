# Feature Parity Matrix (FEATURE_PARITY_MATRIX.md)

This matrix compares the features of the live reference CRM against B1GCRM, indicating files involved, implementation priority, and integration details.

---

## Parity Table

| Reference Feature | Current Status | Files Involved | Priority | Notes |
| --- | --- | --- | --- | --- |
| **Marketing Landing & Pricing** | Partial | [PublicSite.jsx](client/src/pages/PublicSite.jsx) | High | Static layouts exist; needs integration with Stripe pricing checkouts. |
| **User Portal Registration** | Complete | [UserSignupPage.jsx](client/src/pages/auth/UserSignupPage.jsx), [routes/user.js](routes/user.js) | High | Sign-up form inserts database rows correctly. |
| **Unified Portal Logins** | Complete | [LoginPage.jsx](client/src/pages/auth/LoginPage.jsx), [routes/user.js](routes/user.js), [routes/admin.js](routes/admin.js) | High | Authenticates admin, user, and agent staff credentials. |
| **Tenant Dashboard** | Complete | [Dashboard.jsx](client/src/pages/user/Dashboard.jsx) | High | Loads active chats, tasks, WA accounts metrics correctly. |
| **Inbox & Messaging Console** | Complete | [Inbox.jsx](client/src/pages/user/Inbox.jsx), [socket.js](socket.js), [routes/inbox.js](routes/inbox.js) | High | Real-time text chat, notes, tags selector. |
| **Inbox Media Uploads** | Missing | [socket.js](socket.js) | High | Outbound and inbound media attachments storage and serving is not implemented. |
| **Contacts & Phonebooks** | Complete | [Contacts.jsx](client/src/pages/user/Contacts.jsx), [routes/phonebook.js](routes/phonebook.js) | High | Phonebooks creation, bulk contacts deletion, CSV streaming imports. |
| **Kanban Inbox** | Complete | [Kanban.jsx](client/src/pages/user/Kanban.jsx) | Medium | Group chats visually by active labels. |
| **Campaign Broadcasting** | Complete | [Campaigns.jsx](client/src/pages/user/Campaigns.jsx), [loops/campaignLoop.js](loops/campaignLoop.js), [routes/broadcast.js](routes/broadcast.js) | High | Broadcast campaigns creation, list, scheduler, loops runner. |
| **Flowbuilder Designer Canvas** | Complete | [AutomationFlows.jsx](client/src/pages/user/AutomationFlows.jsx), [routes/chatFlow.js](routes/chatFlow.js) | High | React Flow builder, node properties, save node/edge JSON configs. |
| **Chatbot & Auto-replies** | Complete | [ChatBot.jsx](client/src/pages/user/ChatBot.jsx), [functions/chatbot.js](functions/chatbot.js), [routes/chatbot.js](routes/chatbot.js) | High | Keyword chatbot CRUD and auto-reply diagnostic logs. |
| **Meta WhatsApp Link** | Complete | [Integrations.jsx](client/src/pages/user/Integrations.jsx), [routes/user.js](routes/user.js) | High | Saves Meta app credentials and retrieves profile tokens. |
| **WhatsApp QR Connection** | Broken | [helper/addon/qr/index.js](helper/addon/qr/index.js), [routes/qr.js](routes/qr.js) | High | Baileys helper exports stubs/no-ops; UI form does not connect. |
| **Agent Accounts & Auto-Login** | Complete | [AgentLogin.jsx](client/src/pages/user/AgentLogin.jsx), [routes/agent.js](routes/agent.js), [routes/user.js](routes/user.js) | High | Agent creation, token impersonation bypass, restricted dashboard. |
| **Agent Tasks Manager** | Complete | [AgentTask.jsx](client/src/pages/user/AgentTask.jsx), [routes/user.js](routes/user.js) | Medium | Create task cards, assign agents, agent updates status. |
| **Chat Widget Configurator** | Complete | [ChatWidget.jsx](client/src/pages/user/ChatWidget.jsx), [routes/user.js](routes/user.js) | Medium | Customize bubble position, generate JS snippet. |
| **Billing Subscriptions Upgrade** | Partial | [Billing.jsx](client/src/pages/user/Billing.jsx), [routes/user.js](routes/user.js) | High | Pricing layout renders; upgrading depends on checkout webhooks. |
| **Developer API secret keys** | Complete | [DeveloperApi.jsx](client/src/pages/user/DeveloperApi.jsx), [routes/apiv2.js](routes/apiv2.js) | High | Generates REST keys, displays code snippet samples. |
| **Developer Webhook Rules** | Complete | [DeveloperApi.jsx](client/src/pages/user/DeveloperApi.jsx), [routes/webhooks.js](routes/webhooks.js) | High | Webhook CRUD rules are fully working. |
| **Developer Webhook Logs** | Missing | [routes/webhooks.js](routes/webhooks.js) | Medium | Backend does not log webhook dispatches; UI page is missing. |
| **Meta Template Builder** | Complete | [MetaTemplates.jsx](client/src/pages/user/MetaTemplates.jsx) | High | Renders templates layout, interfaces with Meta components. |
| **Admin Plans Management** | Complete | [Plans.jsx](client/src/pages/admin/Plans.jsx), [routes/admin.js](routes/admin.js) | High | Super-admin dashboard CRUD for subscription plans. |
| **Admin Users Override** | Complete | [Users.jsx](client/src/pages/admin/Users.jsx), [routes/admin.js](routes/admin.js) | High | Lists tenants, provides auto-login impersonation bypass. |
| **Admin Settings Settings** | Complete | [Settings.jsx](client/src/pages/admin/Settings.jsx), [routes/admin.js](routes/admin.js) | High | Gateway configs, logo file upload, SMTP setup. |
| **Other Channels (Instagram/Telegram)** | Missing | UI placeholders only | High/Med | Reference app menus exist; missing backend/provider hooks. |
| **AI Voice Calling** | Missing | UI placeholders only | Med | Reference app menus exist; missing Twilio integrations. |
| **WhatsApp Forms** | Missing | UI placeholders only | Med | Reference app menus exist; missing form builders. |
| **WhatsApp Warmer** | Missing | UI placeholders only | Med | Reference app menus exist; missing warmup scheduler loops. |
