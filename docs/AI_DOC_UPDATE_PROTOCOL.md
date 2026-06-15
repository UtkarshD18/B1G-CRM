# AI Doc Update Protocol

Last audited: 2026-06-15

This repo uses `/docs` as living AI memory. After every successful implementation, update docs in the same turn.

## Always Update

| Doc | When |
| --- | --- |
| [AI_CONTEXT.md](AI_CONTEXT.md) | Always, if the change affects project shape, status, warnings, commands, or common files. |
| [CURRENT_STATUS.md](CURRENT_STATUS.md) | Always, to keep status/debt/readiness current. |
| [FEATURE_TRACKER.md](FEATURE_TRACKER.md) | Always, if any feature status, risk, dependency, or files changed. |
| [CHANGELOG_AI.md](CHANGELOG_AI.md) | Always append one entry for the successful change. |

## Conditional Updates

| Doc | Update when |
| --- | --- |
| [API_REFERENCE.md](API_REFERENCE.md) | Routes, methods, auth, request body/query, response shape, route file, or frontend API caller changes. |
| [DATABASE.md](DATABASE.md) | Migrations, schema, indexes, seed data, persistence files, or query relationships change. |
| [SYSTEM_ARCHITECTURE.md](SYSTEM_ARCHITECTURE.md) | Startup, request lifecycle, sockets, Docker, background jobs, auth lifecycle, or cross-module flow changes. |
| [MODULES.md](MODULES.md) | Module responsibilities, entry points, dependencies, or connected modules change. |
| [ENVIRONMENT.md](ENVIRONMENT.md) | Env vars or config defaults change. |
| [DEPENDENCIES.md](DEPENDENCIES.md) | `package.json`, lockfiles, Docker base image, or dependency use changes. |
| [DOCKER_SETUP.md](DOCKER_SETUP.md) | Dockerfile, compose, ports, volumes, healthcheck, or build args change. |
| [BUSINESS_LOGIC.md](BUSINESS_LOGIC.md) | Product workflow, plan rules, billing, agent assignment, messaging, campaign, or chatbot behavior changes. |
| [KNOWN_ISSUES.md](KNOWN_ISSUES.md) | A new issue/debt is found or an existing one is fixed. |
| [ROADMAP.md](ROADMAP.md) | Priorities or next steps change. |
| [FOLDER_STRUCTURE.md](FOLDER_STRUCTURE.md) | Files or directories are added, removed, or repurposed. |
| [CODING_GUIDELINES.md](CODING_GUIDELINES.md) | Local coding conventions change. |

## Changelog Entry Template

Append entries in [CHANGELOG_AI.md](CHANGELOG_AI.md):

```md
## YYYY-MM-DD - Short Feature/Change Name

| Field | Details |
| --- | --- |
| Feature | ... |
| Files changed | ... |
| Reason | ... |
| Impact | ... |
| Breaking changes | None / ... |
| Migration required | No / Yes: ... |
| Docker changes | No / Yes: ... |
| Database changes | No / Yes: ... |
```

## Rules

| Rule | Meaning |
| --- | --- |
| Do not fabricate | Only document what exists in repo files or was changed in the current task. |
| Keep concise | Prefer tables, paths, and exact facts over long prose. |
| Cross-link | Link to detail docs instead of repeating large sections. |
| Preserve warnings | If something is partial/stubbed/legacy, say that plainly. |
| Update before final response | The implementation is not complete until docs are current. |
