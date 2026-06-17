# Reference Page Audit — Contacts & Phonebooks

- **Page Purpose:** Manage contact lists (phonebooks) and tenant contact records for targeting.
- **Page Layout:** Split layout (Left: Phonebooks list and import manager; Right: Contacts datatable with multi-select rows).
- **Navigation Structure:** User portal `/user?page=phonebook` and `/user?page=contacts`.
- **Tables & Lists:** Phonebooks master list (Name, Total Contacts, Actions), Contacts detail grid (Checkbox, Name, Mobile, Phonebook Name, Custom Variables var1-var5).
- **Filters & Search:** Search contacts by name or number, filter contacts by associated phonebook.
- **Forms & Inputs:** Create Phonebook form (name input), Import CSV form (phonebook dropdown, file upload input), Add Contact form (phonebook dropdown, name, mobile, variables var1-5).
- **Actions:** Create phonebook group, delete phonebook group, import CSV contact list, add single contact, bulk delete selected contacts.
- **Workflows:** User uploads CSV file → backend parses csv-parser stream → inserts contact rows tied to phonebook ID with tenant isolation check.
- **API Expectations:**
  - `GET /api/phonebook/get_by_uid`: List phonebooks
  - `GET /api/phonebook/get_uid_contacts`: Fetch contacts
  - `POST /api/phonebook/add`: Create phonebook
  - `POST /api/phonebook/import_contacts`: Stream CSV uploads
  - `POST /api/phonebook/del_contacts`: Bulk delete
