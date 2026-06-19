# CONTACTS_RUNTIME_PROOF.md

**Audit Date**: 2026-06-18  
**Verification Method**: Puppeteer browser automation (`verify-contacts-phonebooks.js`) and direct PostgreSQL queries.

---

## 1. Contacts CRUD Lifecycle Matrix

| Action | Works | Evidence | Database Persistence | UI Quality | Notes |
| :--- | :---: | :--- | :--- | :--- | :--- |
| **Create Contact** | ✅ **Works** | `{"success":true,"msg":"Contact was inserted"}` | ✅ Row created in `contact` table. | Excellent (Inputs grid for name, mobile, and var1-var5). | Successfully binds phonebook association constraints. |
| **Edit Contact** | ❌ **Broken** | No UI inputs or buttons are present. | N/A | None (Missing) | **Missing Feature**: No update route exists in `routes/phonebook.js`. |
| **Delete Contact** | ✅ **Works** | `{"success":true,"msg":"Contact(s) was deleted"}` | ✅ Rows removed from `contact` table. | Good (Bulk delete selected checkbox actions). | Deletes bulk records matching checkmarks list. |
| **Refresh Persistence** | ✅ **Works** | Reloading page preserves contacts table rows. | ✅ Fetches list from PG `contact` table. | High | Table query triggers on load. |

---

## 2. Technical Evidence

### A. Create Contact DB Row Verification
During audit tests, adding a contact created the following record in the PostgreSQL `contact` table:
*   **Row Output**:
    ```json
    {
      "id": 9,
      "uid": "local-user-uid",
      "phonebook_id": 9,
      "phonebook_name": "Audit PB 1781773663425",
      "name": "Audit Contact 1781773665572",
      "mobile": "+915803484511",
      "var1": "val1",
      "var2": "",
      "var3": "",
      "var4": "",
      "var5": ""
    }
    ```
*   **SQL Schema Table**: `contact` (columns: `id`, `uid`, `phonebook_id`, `phonebook_name`, `name`, `mobile`, `var1`, `var2`, `var3`, `var4`, `var5`, `created_at`, `updated_at`).

### B. Verification Screenshots
*   Contacts table initial load: [contacts_01_initial_state.png](docs/reference-pages/local-reality/contacts_01_initial_state.png)
*   Form credentials filled: [contacts_04_typed_contact.png](docs/reference-pages/local-reality/contacts_04_typed_contact.png)
*   Contact added output: [contacts_05_contact_created.png](docs/reference-pages/local-reality/contacts_05_contact_created.png)
*   Contacts bulk removed: [contacts_07_contact_deleted.png](docs/reference-pages/local-reality/contacts_07_contact_deleted.png)

---

## 3. Discovered Gaps & Root Cause Analysis

*   **Edit / Update Contact**:
    *   **Root Cause**: The developer omitted the update route in `routes/phonebook.js` and there is no React component layout or form modal in `Contacts.jsx` to select a contact row and modify its values.
    *   **Remediation**: An endpoint like `POST /api/phonebook/update_contact` must be registered, executing:
        `UPDATE contact SET name = ?, mobile = ?, var1 = ? ... WHERE id = ? AND uid = ?`
