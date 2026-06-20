# Known Issues

Last audited: 2026-06-20

## High Risk

| Issue | Evidence | Impact | Suggested fix |
| --- | --- | --- | --- |
| QR implementation is stubbed | `helper/addon/qr/index.js` returns no-op session functions and `checkQr()` false. | QR routes/UI can mislead users. | Implement real Baileys session layer or hide QR features. |
| Active JWT payload includes password hash | Login routes sign `{ password: storedHash }`. | Sensitive hash material is client-held. | [RESOLVED] Removed bcrypt hashes from JWT payloads in Sprint 12. |
| Active login tokens have no explicit expiry | Login routes pass `{}` to `sign()`. | Long-lived sessions. | [RESOLVED] Enforced `env.JWT_EXPIRY` in Sprint 13. |
| Public install/update routes mutate files | `routes/web.js` exposes `install_app` and `update_app`. | Production takeover risk. | [RESOLVED] Gated `/install_app` and `/update_app` with admin password validation in Sprint 12/Final. |
| No database foreign keys | Migrations declare logical IDs but no `FOREIGN KEY`. | Orphans/cross-tenant mistakes possible. | Add constraints carefully or central ownership guards. |
| Secret scanner history | Older branch commits contained realistic sample credentials in `.env.example`. | Fast-forwarding `main` through those commits can keep GitGuardian failures alive. | Use a clean-history main update or rewrite affected branch history before opening PRs. |

## Medium Risk

| Issue | Evidence | Impact | Suggested fix |
| --- | --- | --- | --- |
| `database/schema.sql` incomplete | Later tables from migration `002` not present. | New DB work may use stale schema file. | Generate schema from migrations or mark schema file legacy. |
| Mixed timestamp column names | Migrations create both `created_at` and `createdAt` patterns. | Query mistakes and inconsistent sorting. | Normalize in future migrations or document per table. |
| Duplicate helper trees | Both `helper/` and `helpers/`; active imports use mostly `helper/`. | Agents may edit inactive code. | Consolidate after import audit. |
| Duplicate auth middleware styles | `middlewares/auth.js` exists but routes use role-specific middleware. | Inconsistent behavior/status codes. | Migrate deliberately with tests. |
| Runtime JSON files hold core state | Conversations and flow data stored on disk. | Backups/scaling need filesystem persistence. | Move to DB or document backup/volume policy. |
| Root `npm test` fails by design | `package.json` script exits 1. | CI cannot use root tests. | Add backend tests or change script to scoped test commands. |
| Campaign loop recursion in app process | `runCampaign()` calls itself forever after random delay. | Multi-instance duplicate sends possible. | Use queue/worker/locks. |

## Low Risk / Cleanup

| Issue | Evidence | Impact | Suggested fix |
| --- | --- | --- | --- |
| Typos in route names | `send_resovery`, `del_cotact_entry`, `templet`. | API naming inconsistency. | Keep backward compatibility; add aliases if needed. |
| Root `FEATURE_TRACKER.md` has mojibake | Status icons render as corrupted characters in places. | Readability issue. | Replace with ASCII or clean encoding. |
| Debug routes remain public | `/api/inbox/`, `/api/qr/create`, `/api/qr/send`, `/api/web/`. | Noise/security surface. | [RESOLVED] Protected `/api/inbox/`, `/api/qr/create`, `/api/qr/send`, and `/api/web/` under `validateUser`/`adminValidator` in Final. |
| Broad `functions/function.js` | Large mixed-responsibility helper. | Hard maintenance. | Split by domain gradually. |

## Do Not Forget

When an issue is fixed, update this file, [CURRENT_STATUS.md](CURRENT_STATUS.md), [FEATURE_TRACKER.md](FEATURE_TRACKER.md), [AI_CONTEXT.md](AI_CONTEXT.md), and append [CHANGELOG_AI.md](CHANGELOG_AI.md).
