# Reference Page Audit — Super-Admin Orders List

- **Page Purpose:** Track transaction records and checkout logs globally.
- **Page Layout:** Grid detailing recent orders, payment receipts, and billing statuses.
- **Navigation Structure:** Admin portal `/admin?page=orders`.
- **Tables & Lists:** Order list datatable (Transaction ID, Tenant Name, Plan, Amount, Gateway, Date, Status).
- **Filters & Search:** Filter orders by status (PAID, PENDING, REFUNDED), search by transaction ID.
- **Forms & Inputs:** Order status override selector.
- **Actions:** Override payment status, verify manual invoice.
- **Workflows:** Gateway callback verifies transaction → registers order database row → upgrades client workspace limits.
- **API Expectations:**
  - `GET /api/admin/get_orders`: List transaction order logs
