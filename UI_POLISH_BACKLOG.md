# UI Polish Backlog

Ranked catalog of user interface improvements, formatting corrections, and page usability polish tasks.

---

## 1. Backlog Matrix

| Rank | Task Description | Impact | Effort | Visibility | Target Files |
| --- | --- | --- | --- | --- | --- |
| **1** | **Fix Card Subtext Contrast (Admin & Agent)**<br>Change card description text color from white-ish to high-contrast dark gray (`#365261` or `#10212d`). | High | Low | High | `client/src/App.css` |
| **2** | **Add Table Actions Spacing**<br>Add horizontal gaps/margins between action buttons inside grids (e.g. Admin Users table) to prevent misclicks. | Medium | Low | High | `client/src/App.css` |
| **3** | **Inbox Media Preview Bubbles**<br>Render upload files, images, and videos in visual preview cards rather than plain text links. | High | Medium | High | `client/src/pages/user/Inbox.jsx` |
| **4** | **Add Contacts List Search**<br>Integrate search input field to query/filter phonebook contacts. | High | Low | High | `client/src/pages/user/Contacts.jsx` |
| **5** | **Collapsible Raw JSON Panel (Flows)**<br>Hide large raw JSON textarea on Flows builder page behind a collapsible toggle button. | Medium | Low | Medium | `client/src/pages/user/AutomationFlows.jsx` |
| **6** | **Unified Button Styling**<br>Verify and synchronize button corners/borders (some modules use fully rounded pills, others use square-rounded forms). | Medium | Low | Medium | `client/src/App.css` |
| **7** | **Interactive Kanban Drag-and-Drop**<br>Implement dynamic card moving instead of simple button clicks on task stages. | Medium | Medium | High | `client/src/pages/user/Kanban.jsx` |
| **8** | **SMTP Verification Success Alert**<br>Improve display of test SMTP emails success alerts inside Admin settings. | Medium | Low | Medium | `client/src/pages/admin/Settings.jsx` |
| **9** | **Live Chat Widget Configuration Preview**<br>Build a real-time responsive chat widget rendering sandbox for settings editing. | Medium | Medium | Medium | `client/src/pages/user/ChatWidget.jsx` |
| **10**| **Staging/Production Build Configurations**<br>Add standard injection helpers for dynamic runtime base API URLs to avoid hardcoding. | High | Medium | Low | `client/vite.config.js` |

---

## 2. Inconsistent UI Patterns & Details

* **Inconsistent Button Styles**: Primary action buttons use pill borders (`border-radius: 999px`) in some cards, but square-rounded inputs (`border-radius: 16px`) in forms. These should be standardized using design tokens.
* **Inconsistent Table Usability**: The Admin Portal tables have compact, close layouts where action buttons touch without margins. The User Portal contacts table has better spacing but lacks basic query searching.
* **Placeholder Content Pages**: Integrations modules contain multiple planned/placeholder cards (Instagram, Telegram) that render empty states with no connection code.
* **Contrast Glitches**: Spacing is generally solid, but helper text descriptions are rendered almost completely invisible due to matching font colors and card background colors.
