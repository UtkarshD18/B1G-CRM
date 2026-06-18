# Reference CRM Automation Capabilities

This document reports on the system's browser automation capabilities, verified login credentials, sitemaps, extension statuses, and architectural constraints on the reference CRM platform (`https://crm.oneoftheprojects.com`).

---

## 1. Available Browser Automation Tools

A comprehensive audit of the host environment shows the following automation tools and environments:

*   **Node.js Libraries:**
    *   **Puppeteer (v25.1.0):** Installed in this session. It uses the pre-installed system Google Chrome binary (`/usr/bin/google-chrome`) for stable and clean headless automation.
    *   **Playwright:** Not installed by default, but NPM and NPX are available for on-demand installation/execution.
*   **Browsers Installed:**
    *   **Google Chrome (v149.0.7827.155):** Located at `/usr/bin/google-chrome` and `/opt/google/chrome/google-chrome`.
    *   **Mozilla Firefox (v151.0.3):** Located at `/usr/bin/firefox`.
*   **Chrome DevTools Protocol (CDP):**
    *   Active debugging interface is running on `127.0.0.1:9222`. This allows any external Puppeteer or Playwright script to attach to the IDE's running browser session via `puppeteer.connect({ browserURL: 'http://127.0.0.1:9222' })`.
*   **Existing Browser Subagent:**
    *   The built-in IDE `browser_subagent` is fully functional and can perform interactive browsing tasks.

---

## 2. Capabilities Matrix of Available Tools

| Capability | Puppeteer (System Chrome) | IDE Browser Subagent | Playwright (On-Demand) |
| :--- | :---: | :---: | :---: |
| **Login** | Yes (Via input simulation / React state setters) | Yes (Pixel click & key-press) | Yes |
| **Navigate Authenticated Pages** | Yes (Session persistency via single browser instance) | Yes | Yes |
| **Capture Screenshots** | Yes (`page.screenshot()`) | Yes (`capture_browser_screenshot`) | Yes |
| **Extract DOM Structure** | Yes (`page.content()`, query selectors) | Yes (`browser_get_dom`) | Yes |
| **Export Content to Markdown** | Yes (Custom programmatic HTML-to-MD/traversal) | Yes | Yes |
| **Record Network Requests** | Yes (`page.on('request')` and Performance API) | Yes (`browser_list_network_requests`) | Yes |
| **Enumerate Routes** | Yes (Via sitemap arrays & program navigation) | Yes | Yes |

---

## 3. ".MD This Page" Browser Extension Verification

*   **Extension Status:** The `.MD This Page` extension (ID: `banfcmclfmmlbkhionmemhibbjedhikm`) is **NOT** installed by default in the IDE's browser profile directory (`/home/shadow/.gemini/antigravity-browser-profile/Default/Extensions`).
*   **Usage During Automation:**
    *   Can it be used? **Yes.** If we unzip the extension's unpacked files, we can load it into Puppeteer by passing launch flags:
        ```javascript
        puppeteer.launch({
          headless: 'new', // newer headless mode supports extensions
          args: [
            `--disable-extensions-except=${pathToExtension}`,
            `--load-extension=${pathToExtension}`
          ]
        });
        ```
    *   **Recommendation:** Programmatic extraction using Javascript traversal and custom conversion is preferred over loading the extension. It is faster, does not rely on third-party extension UI popups, and can be easily customized to format datatables, widgets, and form structures cleanly into Markdown.

---

## 4. Discovered Roles & Verified Credentials

A thorough check of the database seed templates and live app login forms confirmed the following active roles and credentials on the live CRM (`https://crm.oneoftheprojects.com`):

1.  **Super-Admin Role:**
    *   **Login URL:** `https://crm.oneoftheprojects.com/admin/login`
    *   **Demo Credentials:** `admin@admin.com` / `Password@123` (Verified working on the live system; populated via the "Autofill" button).
2.  **Tenant User Role:**
    *   **Login URL:** `https://crm.oneoftheprojects.com/user/login`
    *   **Demo Credentials:** `user@user.com` / `password` (Verified working on the live system; populated via the "Autofill" button).
3.  **Agent Role:**
    *   **Login URL:** `https://crm.oneoftheprojects.com/agent/login`
    *   **Impersonation Bypass:** Accessible from the User Portal under `More Options` -> `Agent Login` (`https://crm.oneoftheprojects.com/user?page=agent-login`). Clicking the **AUTO LOGIN** button next to an agent (e.g. `Paul` / `agent2@gmail.com`) generates a secure JWT token and opens `/agent/login?token=<token>` directly, authenticating the session.

---

## 5. Limitations & Challenges

During research and test script execution, the following limitations were observed:

*   **MUI / CSS Class Name Obfuscation:** The live CRM is built using React and Material UI (MUI). Input IDs and button classes are dynamically generated (e.g., `:r5:`, `css-1trfx3r`), making selectors fragile. To bypass this, we utilize text-content-based matching for buttons and relative traversal from label texts or table rows.
*   **AJAX-Heavy Rendering delay:** React page states load components asynchronously. When navigating between slugs, we must wait for elements (like grids/tables) to render by implementing explicit `setTimeout` delays (3-5 seconds) before DOM dumping or screenshot capture.
*   **Redirect Loops on Full Reload:** Direct page navigations via `page.goto('user?page=slug')` can sometimes force the React app to recheck authentication, causing momentary loading states or redirecting to the base dashboard. Internal programmatic sidebar clicking or state persistence must be carefully managed.
