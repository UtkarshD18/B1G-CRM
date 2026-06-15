# B1G-CRM AI Handoff

Start with [docs/AI_CONTEXT.md](docs/AI_CONTEXT.md). That file is the single source of truth for AI agents working on this repository.

Before making code changes, read:

1. [docs/AI_CONTEXT.md](docs/AI_CONTEXT.md)
2. [docs/CURRENT_STATUS.md](docs/CURRENT_STATUS.md)
3. [docs/FEATURE_TRACKER.md](docs/FEATURE_TRACKER.md)
4. The module-specific docs linked from those files.

After every successful implementation, update the living docs before finishing:

- Always update [docs/CURRENT_STATUS.md](docs/CURRENT_STATUS.md), [docs/FEATURE_TRACKER.md](docs/FEATURE_TRACKER.md), [docs/CHANGELOG_AI.md](docs/CHANGELOG_AI.md), and [docs/AI_CONTEXT.md](docs/AI_CONTEXT.md).
- Also update [docs/API_REFERENCE.md](docs/API_REFERENCE.md) when routes, request shapes, auth, or API responses change.
- Also update [docs/DATABASE.md](docs/DATABASE.md) when migrations, schema, indexes, seed data, or persistence behavior changes.
- Also update [docs/SYSTEM_ARCHITECTURE.md](docs/SYSTEM_ARCHITECTURE.md) when request flow, startup flow, sockets, Docker, or cross-module architecture changes.
- Also update [docs/MODULES.md](docs/MODULES.md) when module responsibilities or connected files change.

Do not fabricate status. If a feature is stubbed, partial, duplicated, or legacy, document it that way.
