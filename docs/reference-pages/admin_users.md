# Reference Page Audit — Super-Admin Users Management

- **Page Purpose:** Manage registered tenant accounts, assign subscriptions, and impersonate workspaces.
- **Page Layout:** Users datatable with plan overrides panel.
- **Navigation Structure:** Admin portal `/admin?page=manage-users`.
- **Tables & Lists:** Users datatable (UID, Name, Email, Active Plan, Expiry, Auto-Login button).
- **Filters & Search:** Search users by name/email, filter by subscription plan.
- **Forms & Inputs:** Edit user subscription details (Plan select dropdown, expiry date picker, trial toggle).
- **Actions:** Edit user plan, suspend/deactivate user, auto-login impersonation bypass.
- **Workflows:** Admin clicks auto-login → signs JWT payload for user uid → opens user dashboard portal in new tab.
- **API Expectations:**
  - `GET /api/admin/get_users`: List users
  - `POST /api/admin/update_user_plan`: Override plan details
