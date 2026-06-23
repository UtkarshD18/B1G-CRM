# Reference CRM Crawling Plan

This document outlines the login flow, role discovery, route discovery, page capture, screenshot, and markdown export strategies used to automate the crawl of the reference CRM at `https://crm.oneoftheprojects.com`.

---

## 1. Login Flow Strategy

The reference CRM uses cookie/localStorage based JWT token authentication for three portals:
*   **User Portal:** Log in at `/user/login` using `user@example.com` / `<DEMO_PASSWORD>`.
*   **Admin Portal:** Log in at `/admin/login` using `admin@example.com` / `<DEMO_PASSWORD>`.
*   **Agent Portal:** Click the **AUTO LOGIN** button next to any agent under `/user?page=agent-login`. This retrieves an impersonation token and logs into `/agent/login?token=<token>`.

### Puppeteer Automation Implementation:
1.  Launch Puppeteer with the system Google Chrome binary.
2.  Navigate to the login pages.
3.  Inject credentials using React-compatible input event simulation (manually dispatching `'input'` bubble events so React registers the values).
4.  Trigger submit buttons.
5.  Wait for navigation and store the session.

---

## 2. Role Discovery Strategy

Portals are structured around three distinct user roles:
1.  `admin`: Global super-admin dashboard with configuration panels.
2.  `user`: Multi-tenant workspace owner with WhatsApp integrations, broadcasts, chatbots, and settings.
3.  `agent`: Restricted customer support representative who can only access assigned chats and tasks.

Portals use different base path prefixes: `/admin`, `/user`, and `/agent`.

---

## 3. Route Discovery Strategy

We compile target routes from sitemaps defined in the React router configuration (`client/src/routes/AppRoutes.jsx`) and verified against the live environment.

### Target Page Slugs:
*   **Admin Pages:** `dashboard`, `manage-plans`, `manage-users`, `orders`, `front-partner`, `faq`, `manage-page`, `testimonial`, `contact-form`, `payment-gateways`, `smtp`, `web-theme`, `social-login`, `site-settings`, `translation`, `update-web`, and planned placeholders.
*   **User Pages:** `dashboard`, `inbox`, `kanban`, `phonebook`, `campaign-dashboard`, `automation-flows`, `wa-chatbot`, `integrations`, `add-whatsapp-qr`, `agent-login`, `agent-task`, `chat-widget`, `billing`, `api-dashboard`, `manage-webhooks`, `create-meta-template`, `settings`, and planned placeholders.
*   **Agent Pages:** `dashboard`, `inbox`, `chats`.

---

## 4. Page Capture Strategy

To ensure content is fully loaded and capture components correctly:
1.  Navigate to `https://crm.oneoftheprojects.com/<role>?page=<slug>`.
2.  Introduce a **3.5-second render delay** to wait for async AJAX requests and React client rendering to complete.
3.  Extract DOM metadata using `page.evaluate()` to identify headers, buttons, inputs, tables, cards, and text content.

---

## 5. Screenshot Strategy

*   Set viewports consistently (e.g., `1440x900` pixels) to ensure consistent dashboard layout rendering.
*   Capture viewport-based screenshots (`page.screenshot()`) rather than full-page screenshots for tables and scrollable layout panels to prevent rendering artifacts or clipping.
*   Store screenshots in `docs/reference-pages/live-crawl/<role>/<page-name>.png`.

---

## 6. Markdown Export Strategy

*   Rather than doing a raw HTML conversion, extract structured sections (headings, buttons, cards, forms, and tables) from the DOM and compile them into a readable summary document.
*   Include the raw text contents of the page up to 5KB.
*   Store markdown dumps under `docs/reference-pages/live-crawl/<role>/<page-name>.md`.
