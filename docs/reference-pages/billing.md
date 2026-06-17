# Reference Page Audit — Billing

- **Page Purpose:** Manage subscription plans, checkouts, payment receipts, and billing cycles.
- **Page Layout:** Portal displaying active plan limits (progress bars), payment gateway pricing cards, and invoice lists.
- **Navigation Structure:** User portal `/user?page=billing`.
- **Tables & Lists:** Invoice history table (Order ID, Plan Title, Amount, Payment Gateway, Date, Status, Receipt link).
- **Filters & Search:** None.
- **Forms & Inputs:** Pricing checkout selection, Stripe Checkout form iframe, offline payment invoice upload.
- **Actions:** Start free trial, upgrade/downgrade subscription, download receipt, select billing frequency.
- **Workflows:** User checks out → creates Stripe Session → upgrades user plan model JSON on payment webhook callback.
- **API Expectations:**
  - `POST /api/user/create_stripe_session`: Initialize Stripe checkout
  - `POST /api/user/start_free_trial`: Start trial
