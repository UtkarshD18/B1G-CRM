# Reference Page Audit — Super-Admin Plans CRUD

- **Page Purpose:** Manage SaaS pricing tiers, feature gates, and account limits globally.
- **Page Layout:** Plans data table and plan editor property sheet.
- **Navigation Structure:** Admin portal `/admin?page=manage-plans`.
- **Tables & Lists:** SaaS Plans grid (Plan Title, Price, Billing Interval, Trial Duration, Max Contacts).
- **Filters & Search:** None.
- **Forms & Inputs:** Plan details form (title, description, price, contact limit, trial duration, checkboxes for Chatbot, API, Notes, Tags).
- **Actions:** Create plan tier, edit plan, delete plan, toggle trial plan.
- **Workflows:** Admin saves plan → updates `plan` database table → plans options updated on public site registration page.
- **API Expectations:**
  - `GET /api/admin/get_plans`: List plans
  - `POST /api/admin/add_plan`: Save plan config
