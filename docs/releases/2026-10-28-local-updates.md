# Implemented CRM updates — 28 October 2026

## Included

- Authenticated inbox sockets with refreshed account/permission checks; separate reply permissions and assignment-scoped socket access.
- Transactional chat assignment and database-backed change notifications; reconnect and background inbox refreshes.
- Instagram channel-connection routing and website text replies; conversation request correlation, loading/errors and draft retention.
- Shared inbox controls, responsive channel tabs, assignment badges and owner permission presets.
- Collapsible portal navigation, contacts/diagnostics pagination, Kanban styles and active-paid-plan trial protection.
- Frontend lint enforced in CI; backend lint excludes frontend/build artifacts, which have a separate lint command. Correct security workflow migration command.
- Remove stale imports and guard malformed socket payload destructuring; repair missing inbox path import and channel-test error-handler variable scope.

## Security CI follow-up

- The inactive/active agent fixture now explicitly requests inbox read permission.
- Stored legacy grants and requested permission names share one alias map. New agents no longer inherit a global Agent template without an explicit role assignment; explicitly assigned roles remain supported.
- Permission/security scripts now exit nonzero on failed assertions and support an isolated test-server URL. Added resolver regression coverage. This does not resolve all broader action-level authorization recommendations in the assessment.

## Verification

Fresh isolated PostgreSQL migrations, full backend/frontend tests, frontend lint and production build are checked before push. GitHub checks are verified against the pushed commit separately.

## Boundaries

The private project-wide assessment is not published here. Its newly identified issues are **not** claimed fixed by this release, including alternate REST authorization, chat identifier collisions, cross-process JSON message persistence and payment atomicity. Real provider delivery is not established by mocked-provider tests. Legacy backend lint warnings remain a follow-up cleanup; lint rules were not weakened to hide them.
