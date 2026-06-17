# Reference Page Audit — Chat Widget

- **Page Purpose:** Configure the JavaScript chat widget for external customer embedding.
- **Page Layout:** Widget configurations settings panel with visual widget preview mock.
- **Navigation Structure:** User portal `/user?page=chat-widget`.
- **Tables & Lists:** Registered widgets list.
- **Filters & Search:** None.
- **Forms & Inputs:** Title input, WhatsApp Number input, Logo upload input, Layout alignment dropdown, Widget size number input.
- **Actions:** Create widget config, upload logo, generate JS embed script copy.
- **Workflows:** User embeds JS snippet → snippet connects to backend sockets → exposes customer support chat portal.
- **API Expectations:**
  - `POST /api/user/add_chat_widget`: Save widget config
  - `GET /api/user/get_widgets`: List configurations
