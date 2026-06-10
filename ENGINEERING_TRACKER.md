# Engineering Tracker

## Current Setup Status

| Area | Status | Notes |
| --- | --- | --- |
| Root dependency install | Done | `npm install` completed at repo root. |
| Client dependency install | Done | `npm install` completed in `client/`. |
| Frontend test runner | Done | Jest configured for the Vite React client. |
| React Testing Library | Done | `@testing-library/react`, `jest-dom`, and `user-event` added. |
| Baseline frontend tests | Done | Route-shell coverage added in `client/src/App.test.jsx`. |
| React profiling hook | Done | `AppProfiler` wraps the React root and logs timings when enabled. |
| Test coverage reporting | Done | `npm run test:coverage` added in `client/`. |
| Live reference app audit | Done | Public site, admin portal, and user portal were inspected and mapped in `REFERENCE_APP_AUDIT.md`. |
| Modular frontend structure | Done | `App.jsx` is now a small bootstrap; routes, layouts, shared helpers, and portal pages live in dedicated modules. |
| Database standardization | Done | PostgreSQL is the single supported database; obsolete SQL driver dependencies were removed and docs/schema/env examples now use PostgreSQL. |
| Backend automated tests | Pending | Server-side tests are still missing. |
| CI test execution | Pending | No GitHub Actions or other CI validation is configured yet. |
| Portal feature implementation | In Progress | Product features remain tracked in `FEATURE_TRACKER.md`. |

## How To Use The New Tooling

### Frontend tests
- Run `cd client && npm test` for a one-shot Jest run.
- Run `cd client && npm run test:watch` for local watch mode.
- Run `cd client && npm run test:coverage` to inspect baseline coverage.

### React profiler
- Start the client with `cd client && VITE_ENABLE_REACT_PROFILER=true npm run dev`.
- Render timings are emitted with `console.table(...)` from `client/src/profiler.jsx`.
- Leave the env var unset for normal local development without profiler logs.

## Repository Map

- `client/`: React SPA shell and future portal UI work.
- `routes/`: Feature-oriented Express routes such as `admin`, `user`, `agent`, `inbox`, `chatFlow`, and `broadcast`.
- `middlewares/`: Auth and plan middleware for admin, user, and agent access.
- `database/`: Database connection and promise helpers.
- `functions/`: Shared backend business logic modules.
- `helper/` and `helpers/`: Utility layers for inbox, sockets, websockets, and addons.
- `loops/`: Background campaign loop processing.
- `flow-json/`: Persisted flow-builder node and edge data.
- `emails/`, `languages/`, `contacts/`, `conversations/`, `sessions/`, `socket/`: Supporting runtime data and assets.

## Remaining Engineering Work

- Replace remaining placeholder portal modules with fully wired production screens documented in `REFERENCE_APP_AUDIT.md`.
- Add frontend tests around real layouts, auth guards, and API integration once those modules exist.
- Decide whether backend tests should use Jest as well or a separate integration-focused stack such as Supertest on top of Express.
- Add CI so `client` lint and Jest checks run automatically on pushes and pull requests.
- Normalize the duplicated `helper/` and `helpers/` directories once their active usage is fully confirmed.
