# B1G-CRM AI Bootstrap

Primary handoff:

- Read `CLAUDE.md` first.
- Read `SKILLS.md` as the permanent operating manual for all development tasks.
- Read `docs/PROJECT_CONTEXT.md` first for context.
- Treat `docs/PROJECT_CONTEXT.md` as the source of truth for AI sessions.
- Use source code as the ultimate authority when docs and code disagree.

Mandatory startup procedure:

1. Read `CLAUDE.md` and `SKILLS.md`.
2. Read `docs/PROJECT_CONTEXT.md`.
3. Build a mental model of the project.
4. Inspect the relevant source files before coding.
5. Explain the implementation plan.
6. Only then begin implementation.

Rules:

- Preserve the current project architecture unless the task explicitly requires a change.
- Avoid duplicate implementations or reintroducing legacy paths when an active path already exists.
- **Documentation Governance Policy**: Whenever an AI agent modifies functionality, architecture, database schema, migrations, routes, business logic, infrastructure, integrations, feature status, completion status, roadmap priorities, or project state, the agent must review and update the relevant project documentation before concluding the task.
- **Documentation Review**: Explicitly review affected documents (e.g. `PROJECT_CONTEXT.source.md`, `CURRENT_STATUS.md`, `ROADMAP.md`, `SYSTEM_ARCHITECTURE.md`) after any implementation changes to verify they reflect the repository reality.
- **Documentation Regeneration**: Run `npm run docs:ai` after any changes to regenerate `docs/PROJECT_CONTEXT.md` and `docs/CHANGELOG_AI.md`.
- **Changelog Updates**: Ensure `docs/CHANGELOG_AI.source.md` and `docs/CHANGELOG_AI.md` are updated with clear implementation details.

Definition of Done:

- Implementation completed.
- Existing functionality preserved.
- Tests/build executed when applicable.
- `npm run docs:ai` run successfully.
- `docs/PROJECT_CONTEXT.md` verified against the repository.
- `docs/CHANGELOG_AI.md` updated.

Quick workflow:

1. Read `docs/PROJECT_CONTEXT.md`.
2. Inspect the touched source modules.
3. Implement the smallest safe change.
4. Regenerate the AI docs.
5. Verify the regenerated context still matches the repository.
