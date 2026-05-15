# Session Checklist

1. Read `AGENTS.md`.
2. Read `docs/project-reference/README.md`.
3. Read `docs/product-strategy/reliable-finance-app-roadmap.md` before planning product work.
4. Read `docs/superpowers/plans/2026-05-14-reliability-first-phase-1.md` before starting reliability Phase 1 work.
5. Read `docs/project-reference/issues.md` before editing auth, storage, or crypto code.
6. Check `.env`, `app.json`, and `app/_layout.tsx` for environment assumptions.
7. Confirm whether the task is docs-only, audit-only, strategy, or runtime-fix work.
8. If touching persisted data, verify serialization and rehydration behavior first.
9. If touching crypto, verify whether the intended source of truth is live APIs or fallback fixtures.
10. For API-backed screens, preserve visible loading, error, retry, source, freshness, and fallback states.
11. Run `npx jest --runInBand --watchman=false` after storage or crypto changes.
12. Run `npx tsc --noEmit` before claiming the app typechecks.
13. If touching metrics, check `docs/project-reference/metrics.md` and preserve stable event names unless a rename is intentional.
