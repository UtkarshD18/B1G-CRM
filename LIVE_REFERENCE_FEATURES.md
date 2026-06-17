# Live Reference Features Index (LIVE_REFERENCE_FEATURES.md)

This index inventories the exact interactive components, database object models, workflows, forms, and analytical widgets extracted from the live reference CRM.

---

## 1. CRM Objects & Entities

* **Admin:** SaaS Super-Admin accounts.
* **User (Tenant):** Core subscriber accounts (represents a business workspace).
* **Agent:** Staff accounts created by and associated with a tenant.
* **Plan:** Subscription plans containing price, pricing model, and feature gates.
* **Phonebook:** A group folder segment containing contacts.
* **Contact:** Core client record (Name, Mobile, customized variables `var1` through `var5`).
* **Campaign (Broadcast):** An scheduled/immediate message dispatch task.
* **Campaign Log:** Delivery status updates for each recipient.
* **Chat (Conversation):** A linked thread between a tenant/agent and a client.
* **Chatbot:** Keyword trigger rule matching incoming messages.
* **Chatbot Log:** Real-time log tracking chatbot trigger evaluations.
* **Flow:** React Flow node-and-edge configuration JSON.
* **Webhook Rule:** Webhook dispatch rule (triggers post request on event match).
* **Order (Invoice):** Transaction log recording paid plans purchases.
* **Widget:** Chat widget JS embed settings configuration.

---

## 2. Forms & Inputs Inventory

* **Login Form:** Email input, Password input (with visibility toggle), Autofill button, Google/Facebook login buttons.
* **Signup Form:** Email input, Password input, Full Name input, Mobile input with helper, Privacy agreement checkbox.
* **Plan Manager Form:** Title input, description editor, price number input, trial duration input, max contacts limit, API/Chatbot/Notes checkboxes.
* **User Override Form:** Active Plan dropdown, expiry date-picker.
* **Phonebook Form:** Name input.
* **Add Contact Form:** Target Phonebook dropdown, Contact Name input, Mobile input, `var1`-`var5` custom text inputs.
* **Import CSV Form:** Target Phonebook dropdown, CSV file picker.
* **Broadcast Scheduler Form:** Campaign title, target Phonebook dropdown, Meta message template selector, date-time scheduler picker, timezone dropdown.
* **Flow Properties Form:** Trigger node inputs, action message template select, variable mappings.
* **Chatbot Rule Form:** Bot title, trigger words input, active state toggle, target phonebook dropdown, flow JSON select.
* **Chat Widget Settings Form:** Title, WhatsApp number, logo file upload, size input, screen position dropdown.
* **Webhook Rules Form:** Name, Event select (message, socket connection), Match field, Match operator, Target Action dropdown, Action Payload editor.

---

## 3. Tables & Data Grids

* **Admin Users Grid:** UID, Name, Email, Active Plan, Expiry, Impersonate action.
* **Admin Plans Grid:** Title, Price, Max Contacts, Actions.
* **Admin Orders Grid:** Order ID, Tenant Name, Plan Name, Amount, Gateway, Date, Status.
* **Contacts Datatable:** Checkbox row, Contact Name, Mobile, Phonebook Name, Variables list.
* **Phonebooks List:** Name, Contacts Count, Delete action.
* **Campaigns History Table:** ID, Campaign Title, Target Phonebook, Status, Created At, Action buttons.
* **Chat List Panel:** Contact Name, Last Message text, Unread dot, Tag badges, Assigned Agent status.
* **Chatbot Log Grid:** Time, Incoming message, Matched Rule, Bot Response status, Details text.
* **Agent Logins Grid:** Name, Email, Chats count, status toggle, Impersonation button.
* **Webhook Rules Grid:** Name, Target URL, Event, Status toggle.

---

## 4. Filters & Search Controls

* **User Search:** Search by name/email (Admin Users).
* **Inbox Search & Filters:**
  - Search by client name/number.
  - Filter by label/tag.
  - Filter by assigned agent (Unassigned, Assigned to Me, Assigned to Others).
* **Contacts Search:** Search by contact name/number.
* **Campaign Filters:** Filter by status (QUEUE, PROCESSING, COMPLETED, FAILED).
* **Chatbot Logs Filters:** Search trigger logs by match status.

---

## 5. Workflows & Automations

* **User Signup Workflow:** Fill details → check terms → submit → creates empty tenant workspace → registers default trial plan.
* **Auto-Login (Admin to Tenant):** Admin clicks "Auto Login" → system signs tenant JWT → opens `/user?page=dashboard` in new tab.
* **Auto-Login (User to Agent):** Tenant clicks "Auto Login" on Agent list → system signs agent JWT → opens `/agent?page=dashboard` in new tab.
* **CSV Import Workflow:** User uploads CSV file → system streams parser → validates duplicate phone numbers → imports rows into database.
* **Broadcast Scheduling Workflow:** User schedules campaign → looped cron evaluates time → queries contacts → calls Meta APIs → logs delivery statuses.
* **Message Ingestion & Chatbot Reply:** Webhook intercepts message → saves to disk conversation JSON → evaluates chatbot triggers in database → if match, runs flow builder nodes → sends automated reply → logs execution to `chatbot_log` table.
* **Website Chat Widget Workflow:** Visitor opens widget → socket handshakes with backend → adds contact to CRM inbox → sends messages in real-time.
