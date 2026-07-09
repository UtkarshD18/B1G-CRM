# B1GCRM Architecture Guidelines

This document outlines the architectural guidelines, directory structures, and conventions designed to maintain separation of concerns and protect domain boundaries in B1GCRM.

---

## Bounded Architecture

B1GCRM follows a strict one-way dependency chain:

```text
Routes (HTTP Endpoints)
    ↓
Controllers (HTTP Parsing & Response Formatting)
    ↓
Services (Business Logic & Orchestration)
    ↓
Helpers (Reusable domain calculations or utilities)
    ↓
Database (dbpromise) / External APIs (Stripe, Meta SDKs)
```

---

## Dependency Matrix

| From            | To          | Allowed | Rules                                                                              |
| --------------- | ----------- | ------- | ---------------------------------------------------------------------------------- |
| **Routes**      | Controllers | ✅      | Matches endpoints to controllers. No database calls.                               |
| **Controllers** | Services    | ✅      | Parses `req.body` or `req.params` and returns `{ success, data }`. No SQL queries. |
| **Services**    | Helpers     | ✅      | Executes transaction queries or delegates utility work. Services own SQL writes.   |
| **Helpers**     | Services    | ❌      | Strictly prohibited to prevent circular dependencies.                              |
| **Helpers**     | Controllers | ❌      | Strictly prohibited.                                                               |
| **Controllers** | Controllers | ❌      | Strictly prohibited.                                                               |

---

## Domain Ownership Rules

Every business table must have a **single write owner**. Only the designated service is permitted to issue `INSERT`, `UPDATE`, or `DELETE` statements on that table.

| Bounded Domain | Bounded Service Owner                    | Owned Tables / Entities                        |
| -------------- | ---------------------------------------- | ---------------------------------------------- |
| **Auth**       | `adminAuthService.js` / `authService.js` | User login credentials, recovery tokens        |
| **User**       | `adminUserService.js` / `userService.js` | User profiles, configurations                  |
| **Meta**       | `metaService.js`                         | Meta templates, media, configuration           |
| **Billing**    | `billingService.js`                      | Payment gateways, transaction tracking, orders |
| **Plans**      | `adminPlanService.js`                    | Plan definitions, subscription assignments     |
| **CMS**        | `adminCmsService.js`                     | Pages, FAQs, testimonials, marketing partners  |
| **Settings**   | `adminSettingsService.js`                | SMTP, system config, infrastructure metrics    |

---

## How-To Implementation Guides

### 1. Adding a New Endpoint

1. Define the route in the correct file under `routes/`. Ensure it uses the appropriate authentication/role validator (e.g., `adminValidator`).
2. Implement the HTTP parsing logic in the matching file under `controllers/`. The controller must extract parameters, delegate to a service, and return JSON responses.
3. Add the core business rules and database mutations inside the matching service in `services/`.
4. If a query or database cascade is reused across multiple domains, place it in a helper file under `functions/helpers/`.

### 2. Service Creation Boundaries

Before creating a new Service file, ask:

- _Can this capability belong to an existing bounded domain service?_
- If yes, **do not create another service**. Adding services unnecessarily fragments domain context. Let growth and clear contextual split justify the creation of a new domain service.

---

## Future Drift Prevention Checks

To ensure compliance:

- Run `npx madge --circular --extensions js controllers/ services/ routes/` before submitting Pull Requests.
- Do not place raw SQL queries inside route handlers. All database operations must live inside the Service layer.
- Keep controllers thin and free of conditional business workflows.
