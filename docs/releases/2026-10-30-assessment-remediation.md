# Assessment remediation on demo-live (30 October 2026)

This change addresses selected findings from the 28 October assessment. It does not close the 44-item register or establish production readiness.

## Implemented

- **S01:** Generic REST inbox list and history now enforce tenant and agent assignment. Agent contact placeholders are removed from the generic list. Chat status changes require reply permission and assignment; tenant-wide reordering is owner-only.
- **S02 (partial):** Contact and lead write routes now require `contacts.write`, including imports and deletes. The permission resolver no longer grants a ten-minute cache window after revocation. Legacy flow writes and other permission surfaces still need a full role matrix audit.
- **S03:** WhatsApp Cloud and Instagram POST webhooks require a valid HMAC-SHA256 signature over the exact request body before querying connections or enqueuing. Configure `META_APP_SECRET` and, if distinct, `INSTAGRAM_APP_SECRET` on the API host before Meta deliveries.
- **S04 (partial):** Owner and agent profile responses omit password hashes, public website settings omit the Facebook app secret, and AI provider GET returns key-configured metadata instead of the stored key. A blank AI key on update retains the current value.
- **S13 (partial):** QR instance deletion checks tenant ownership before touching its in-memory session. Debug GET creation and send routes were removed; generated instance IDs are validated.
- **D04:** Offline checkout creates a pending request without activating a plan. An admin review screen requires a settlement reference before approval. A row lock and transaction bind approval, entitlement update and order insertion. Rejected or repeated requests cannot activate the plan.
- **D02 (partial):** The shared JSON append helper now locks across processes and uses atomic replacement with disk sync. The incoming channel path uses it, and provider message replay does not append twice. Other legacy read/modify/write paths still need migration to one authoritative message store.
- **D03 (partial):** The queue awaits its inbox listener before acknowledging, propagates persistence errors for retry, and uses tenant/channel/provider-scoped idempotency with a non-aborting conflict path. JSON remains a projection outside the queue transaction, so crash recovery still needs an end-to-end reconciliation contract.
- **S10 (partial):** PostgreSQL TLS now verifies the server certificate when `PGSSL=true`; an optional `PGSSL_CA` PEM value supports private certificate authorities. Runtime database role privilege reduction remains open.
- **S12:** Production requests to legacy installer and updater endpoints now return 404 before any password or database handling.
- **S07 (partial):** Knowledge-base URL fetching and webhook dispatch now reject private DNS answers, pin the validated address for the request, disable redirects and proxies, and limit time and response size. Other dynamic outbound paths still need the same treatment.
- **A01 (partial):** Production AI refuses mock or missing provider credentials and does not fall back to ungrounded completions after a graph failure. Queries without retrieved company context require human review.
- **A02 (protective handoff):** Automated order paths no longer search global storefront records or match order data by phone digits. They give a fixed account-verification handoff until tenant-scoped customer-to-order authorization is designed and tested.

## Verification and remaining release gates

Focused synthetic tests cover signature failures, agent inbox scoping and offline approval/replay. The client builds and its test suite passes. Browser screenshots use synthetic API responses and demonstrate the UI only. A live database, real Meta delivery and actual payment settlement were not available in this workspace, so those integrations still require isolated end-to-end checks.

Other findings remain open, including chat ID collisions, complete message-store migration, purchase binding for online payments, consent enforcement, remaining dynamic outbound requests, and outbound delivery reconciliation. A real authorized order lookup also remains to be built. Track them as release gates; this branch is not a production-ready certification.
