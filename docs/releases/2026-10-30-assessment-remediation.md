# Assessment remediation on demo-live (30 October 2026)

This change addresses selected findings from the 28 October assessment. It does not close the 44-item register or establish production readiness.

## Implemented

- **S01:** Generic REST inbox list and history now enforce tenant and agent assignment. Agent contact placeholders are removed from the generic list. Chat status changes require reply permission and assignment; tenant-wide reordering is owner-only.
- **S03:** WhatsApp Cloud and Instagram POST webhooks require a valid HMAC-SHA256 signature over the exact request body before querying connections or enqueuing. Configure `META_APP_SECRET` and, if distinct, `INSTAGRAM_APP_SECRET` on the API host before Meta deliveries.
- **S04 (partial):** Owner and agent profile responses omit password hashes, public website settings omit the Facebook app secret, and AI provider GET returns key-configured metadata instead of the stored key. A blank AI key on update retains the current value.
- **S13 (partial):** QR instance deletion checks tenant ownership before touching its in-memory session. Debug GET creation and send routes were removed; generated instance IDs are validated.
- **D04:** Offline checkout creates a pending request without activating a plan. An admin review screen requires a settlement reference before approval. A row lock and transaction bind approval, entitlement update and order insertion. Rejected or repeated requests cannot activate the plan.

## Verification and remaining release gates

Focused synthetic tests cover signature failures, agent inbox scoping and offline approval/replay. The client builds and its test suite passes. Browser screenshots use synthetic API responses and demonstrate the UI only. A live database, real Meta delivery and actual payment settlement were not available in this workspace, so those integrations still require isolated end-to-end checks.

Other findings remain open, including chat ID collisions, concurrent JSON persistence, queue commit semantics, purchase binding for online payments, consent enforcement, SSRF, and outbound delivery reconciliation. Track them as release gates; this branch is not a production-ready certification.
