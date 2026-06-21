# TOP_50_PARITY_IMPROVEMENTS.md

Definitive checklist of 50 targeted engineering improvements for B1GCRM, organized in strict priority order.

---

## 1. Broken Functionality (Items 1-10)

1.  **Fix Admin Manage Plans Edit Route**: Resolve the route naming collision in `routes/admin.js` where `POST /api/admin/update_plan` assigns a plan to a user instead of updating the properties of the plan definition.
2.  **Activate WhatsApp QR Baileys Linker**: Replace the stub methods in `helper/addon/qr` with a fully functional Baileys connection manager to allow session generation via QR.
3.  **Prevent Chat Widget Schema Overflows**: Add maximum string length validation on styling configuration properties in the Widget setup form before inserting into the `chat_widget` table.
4.  **Implement Webhook Rules Execution Loop**: Write the event parser in the message webhook processor (`helper/inbox/inbox.js`) to evaluate user-configured webhook rules and execute corresponding matches.
5.  **Graceful Fallback on Missing Meta Keys**: Update `GET /api/user/get_my_meta_templets` to return an empty array instead of a backend exception when no credentials exist in `meta_api`.
6.  **Catch Campaign Handshake Connection Failures**: Catch connection timeouts and DNS resolution errors inside the campaign creation validator (`routes/broadcast.js`) when calling the Meta Graph API.
7.  **Fallback Default Timezones**: Assign a default timezone (e.g. `UTC` or `Asia/Kolkata`) on the backend user registration route when the client request fails to send a timezone parameter.
8.  **Vite Build Dependency Audits**: Update the Docker multi-stage build script to verify server dependency checks prior to compiling frontend client bundles.
9.  **Socket.IO Room Cleanup on Disconnect**: Update the socket listener disconnect handler to delete inactive socket room mappings from the `rooms` table to prevent connection leaks.
10. **Bypass Cascade Deletion Risks**: Verify that deleting a phonebook row cascades cleanly to remove contacts in PostgreSQL without causing transaction lock issues.

---

## 2. Missing Persistence (Items 11-18)

11. **Kanban Status Column Sync**: Write database columns and endpoints to store and update Kanban card column states.
12. **Persistent Storage for Conversations**: Implement AWS S3 or MinIO file storage drivers for conversation JSON logs.
13. **Assigned Chat Backups**: Create a transaction log table to record historical chat assignments when agents are deleted.
14. **Chat Widget Impression Logging**: Create a DB table (`widget_stats`) and endpoints to track widget impressions, clicks, and WhatsApp launch actions.
15. **CSV Import Error Logging**: Persist failed CSV rows to a DB table so users can download files showing which records had invalid mobile numbers.
16. **Webhook Request Delivery Logging**: Create a `webhook_logs` database table to record outgoing webhook URLs, request payloads, response codes, and timestamps.
17. **Refreshed Sidebar State Persistence**: Save active sidebar navigation items to browser `localStorage` to prevent returning to dashboards on page reloads.
18. **Campaign State Backup**: Save execution state flags (`PAUSED`, `STOPPED`, `RUNNING`) to the database to ensure campaigns resume correctly after server restarts.

---

## 3. Missing CRUD (Items 19-25)

19. **Update Phonebook API**: Add `POST /api/phonebook/update` to support renaming phonebook lists.
20. **Update Contact Details API**: Add `POST /api/phonebook/update_contact` to edit contact properties and variables.
21. **Update Local Templates API**: Add `POST /api/templet/update` to modify local text message templates.
22. **Chatbot Trigger Words UI Editor**: Create form controls in `ChatBot.jsx` to update chatbot trigger keywords without having to delete and recreate rules.
23. **Admin User Plan Override Controls**: Add date selectors in `admin/Users.jsx` to modify the plan expiration date for specific tenants.
24. **Payment Gateway Credentials Form**: Add CRUD fields in Admin Settings to configure credentials for payment gateways.
25. **Webhook Rule Action Configurator**: Add form controls in Developer API to edit actions and payloads for webhook rules.

---

## 4. Missing Workflows (Items 26-35)

26. **QR Webhook Ingest Pipeline**: Connect Baileys message listener callbacks to `processMessage` to enable chatbot matching for QR channels.
27. **Webhook Action Dispatcher**: Write the HTTP client request loop to send outbound POST payloads when webhook rules match incoming messages.
28. **Composer Quick Templates**: Add a template picker dropdown inside the Inbox composer to select and send messages quickly.
29. **CSV Importer Column Mapper**: Add a mapper screen during CSV imports to match column headers to fields.
30. **Mock Campaign Developer Loop**: Create an offline mock mode that simulates campaigns and updates logs without calling the Meta API.
31. **Mock Gateway Checkout Emulator**: Add a developer sandbox switch to simulate payment gateway checkouts locally.
32. **Chatbot Support for QR Sessions**: Enable chatbot triggers to reply to messages arriving via the WhatsApp QR channel.
33. **Multi-Agent Chat Reassignment**: Implement reassignment logic to allow agents to transfer chats between active team members.
34. **Twilio Voice Call Flow Integration**: Connect voice flow editor coordinates to the backend Twilio calling webhook.
35. **WhatsApp Number Warmer Engine**: Write an automation loop to schedule message exchanges between internal numbers.

---

## 5. Missing UX (Items 36-45)

36. **Upload Progress Indicators**: Display upload progress percentages when attaching files in the Inbox composer.
37. **Dynamic Avatar Initials Coloring**: Implement a hash function in the UI to assign random colors to avatars in the chat list.
38. **Inbox Filter Tabs**: Add checkboxes to filter the chat list by "Assigned to Me", "Assigned to Others", or "Unassigned".
39. **Drag-and-Drop File Attachments**: Allow users to drag and drop files directly onto the Inbox conversation thread.
40. **CSV Import Pre-check Validator**: Validate file sizes and headers in the UI before initiating CSV uploads.
41. **Agent Active Status Badges**: Display active/inactive status badges in the Agent roster view.
42. **QR Flow Content Alerts**: Warn users in the Flow Builder if they add buttons or lists that are unsupported on QR channels.
43. **Campaign List Micro-Statistics**: Display sent/delivered ratios on each item card in the campaigns list.
44. **Failed Campaign Delivery Tooltips**: Add hover tooltips in campaign logs to show the error reason when status is `FAILED`.
45. **Inline API Code Generators**: Display PHP, Node.js, and curl code snippets on the REST API pages.

---

## 6. Missing Polish (Items 46-50)

46. **Fix Spelling Typos in Success Responses**: Correct typos in success messages, such as changing `"addedd"` to `"added"` and `"Templet"` to `"Template"`.
47. **Standardize Layout Transitions**: Apply consistent border-radius rules and transition animations to all buttons.
48. **Custom styled switches**: Replace standard HTML checkbox inputs with custom styled toggle switches on Integrations pages.
49. **Modal Auto-Focus**: Set focus on the first input field automatically when opening modal forms.
50. **Clean container size**: Remove unused packages and dev dependencies from `package.json` to reduce Docker container image sizes.
