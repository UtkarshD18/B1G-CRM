# Seeded Auth Accounts (AUTH_ACCOUNTS.md)

This document indexes the seeded default developer credentials and roles verified in the database.

| Email | Password | Role | Source File | Notes |
| --- | --- | --- | --- | --- |
| `admin@example.com` | `<PASSWORD>` | `admin` | [database/seed-dev.js](database/seed-dev.js) | Global Super-Admin access to manage plans and users. |
| `user@example.com` | `<PASSWORD>` | `user` | [database/seed-dev.js](database/seed-dev.js) | Tenant Workspace access to connect lines and manage CRM. |
| `agent@example.com` | `<PASSWORD>` | `agent` | [database/seed-dev.js](database/seed-dev.js) | Restricted Agent Staff workspace for assigned items. |
| `test-signup@example.com` | `<PASSWORD>` | `user` | Created dynamically during verification | Newly registered tenant account. |
