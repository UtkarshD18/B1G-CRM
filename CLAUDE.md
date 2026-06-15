# B1G-CRM AI Bootstrap

Primary handoff:

- Read `docs/PROJECT_CONTEXT.md` first.
- Treat `docs/PROJECT_CONTEXT.md` as the source of truth for AI sessions.
- Use source code as the ultimate authority when docs and code disagree.

Mandatory startup procedure:

1. Read `docs/PROJECT_CONTEXT.md`.
2. Build a mental model of the project.
3. Inspect the relevant source files before coding.
4. Explain the implementation plan.
5. Only then begin implementation.

Rules:

- Preserve the current project architecture unless the task explicitly requires a change.
- Avoid duplicate implementations or reintroducing legacy paths when an active path already exists.
- Update only the docs affected by the change.
- After every successful implementation, run `npm run docs:ai`.
- After every successful implementation, verify `docs/PROJECT_CONTEXT.md` matches the repository.
- After every successful implementation, update `docs/CHANGELOG_AI.md`.

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
