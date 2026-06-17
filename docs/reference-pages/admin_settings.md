# Reference Page Audit — Super-Admin Site Settings

- **Page Purpose:** Global super-admin settings panel for gateway tokens, SMTP servers, legal documents, FAQ, testimonials, and translation JSON packages.
- **Page Layout:** Sidebar settings tabs panel with settings editor sheet.
- **Navigation Structure:** Admin portal settings slugs (`/admin?page=site-settings`, `/admin?page=smtp`, `/admin?page=payment-gateways`, `/admin?page=faq`, `/admin?page=testimonial`, `/admin?page=translation`).
- **Tables & Lists:** Faq entries list, Partners logo list, Testimonials grid.
- **Filters & Search:** None.
- **Forms & Inputs:** Site name, currency select, logo uploader, Payment gateways settings (Stripe API Keys, Razorpay Keys, SMTP credentials), translation JSON editor, Legal documents editor.
- **Actions:** Update gateway keys, verify SMTP connection test email, add FAQ, update testimonials, save translations.
- **Workflows:** Admin updates theme/translations → writes JSON assets on server filesystem → public endpoints stream localized pages.
- **API Expectations:**
  - `GET /api/admin/get_settings`: Load global configuration
  - `POST /api/admin/update_settings`: Save config values
