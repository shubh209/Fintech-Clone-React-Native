# Session Checklist

1. Read `AGENTS.md`.
2. Read `docs/project-reference/README.md`.
3. Read `docs/project-reference/issues.md` before editing auth, storage, or crypto code.
4. Check `.env`, `app.json`, and `app/_layout.tsx` for environment assumptions.
5. Confirm whether the task is docs-only, audit-only, or runtime-fix work.
6. If touching persisted data, verify serialization and rehydration behavior first.
7. If touching crypto, verify whether the intended source of truth is live APIs or stubbed local responses.
8. Run `npx jest --runInBand --watchman=false` after storage or crypto changes.
9. Run `npx tsc --noEmit` before claiming the app typechecks.
10. If touching metrics, check `docs/project-reference/metrics.md` and preserve stable event names unless a rename is intentional.
