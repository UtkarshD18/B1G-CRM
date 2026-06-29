# Defect Register

| Defect ID | Description                                                                                                                 | Severity | Classification  | Status       | Resolution                                                                                  |
| --------- | --------------------------------------------------------------------------------------------------------------------------- | -------- | --------------- | ------------ | ------------------------------------------------------------------------------------------- |
| DEF-001   | GitHub Action backend.yml failed due to Node 18 incompatibility with `@whiskeysockets/baileys` package (requires Node 20+). | High     | Release Blocker | **Resolved** | Updated `package.json` engines to `>=20.0.0` and `backend.yml` matrix to `[20.x, 22.x]`.    |
| DEF-002   | `pg_isready` health check inside GitHub Actions `security.yml` failed with `FATAL: role "root" does not exist`.             | Medium   | Release Blocker | **Resolved** | Updated the `options` in `security.yml` to specify `--health-cmd "pg_isready -U b1gcrm"`.   |
| DEF-003   | Missing `package-lock.json` dependency mismatches on `npm ci`.                                                              | Low      | Non-blocking    | **Resolved** | Re-generated lockfile using `npm install --legacy-peer-deps` and `npm dedupe`.              |
| DEF-004   | Frontend CI failed with Node 18 incompatibility for Vite.                                                                   | High     | Release Blocker | **Resolved** | Updated `frontend.yml` matrix to `[20.x, 22.x]`.                                            |
| DEF-005   | Jest tests returned 404 for missing routes overridden by `app.get("*")` React fallback.                                     | Medium   | Known Risk      | **Resolved** | Added `app.all("/api/*")` 404 handler and fixed test endpoints to match the implementation. |
| DEF-006   | Eslint failed parsing JSX files in `client/` during git pre-commit hooks.                                                   | Medium   | Release Blocker | **Resolved** | Added `jsx: true` to `.eslintrc.json` parser features and `browser: true` to env.           |

## Current State

**Zero outstanding release-blocking defects.**
The branch `release/phase4-hardening-20260626` is stabilized.
