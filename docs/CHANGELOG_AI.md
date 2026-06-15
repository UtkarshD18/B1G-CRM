# AI Changelog

This changelog must be updated after every successful implementation.

## 2026-06-15 - AI Context Documentation System

| Field | Details |
| --- | --- |
| Feature | Created an AI-friendly living documentation system for the repository. |
| Files changed | `CLAUDE.md`, `docs/AI_CONTEXT.md`, `docs/PROJECT_OVERVIEW.md`, `docs/SYSTEM_ARCHITECTURE.md`, `docs/FOLDER_STRUCTURE.md`, `docs/DATABASE.md`, `docs/API_REFERENCE.md`, `docs/AUTH_FLOW.md`, `docs/DOCKER_SETUP.md`, `docs/FEATURE_TRACKER.md`, `docs/CURRENT_STATUS.md`, `docs/ROADMAP.md`, `docs/KNOWN_ISSUES.md`, `docs/CODING_GUIDELINES.md`, `docs/DEPENDENCIES.md`, `docs/ENVIRONMENT.md`, `docs/BUSINESS_LOGIC.md`, `docs/MODULES.md`, `docs/AI_DOC_UPDATE_PROTOCOL.md`, `docs/CHANGELOG_AI.md`. |
| Reason | Provide persistent project context for Claude, ChatGPT, Gemini, Cursor, Copilot, and future AI agents. |
| Impact | Future agents can load repo context quickly and have explicit rules for keeping docs synchronized. |
| Breaking changes | None. |
| Migration required | No. |
| Docker changes | No. |
| Database changes | No. |

## 2026-06-15 - Compose Secret Scanner Cleanup

| Field | Details |
| --- | --- |
| Feature | Removed secret-scanner-prone Docker Compose password interpolation and documented secret hygiene. |
| Files changed | `docker-compose.yml`, `docs/DOCKER_SETUP.md`, `docs/ENVIRONMENT.md`, `docs/KNOWN_ISSUES.md`, `docs/AI_CONTEXT.md`, `docs/CHANGELOG_AI.md`. |
| Reason | GitGuardian reported secret findings in the PR; current source should not contain realistic credentials or password-like required interpolation text. |
| Impact | Compose now expects `PGPASSWORD` from `.env` without embedding a required-variable message in source. |
| Breaking changes | None for configured environments; users must still set `PGPASSWORD` in `.env`. |
| Migration required | No. |
| Docker changes | Yes: `POSTGRES_PASSWORD` and app `PGPASSWORD` now use `${PGPASSWORD}` directly. |
| Database changes | No. |
