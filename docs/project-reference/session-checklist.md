# Session Checklist

1. Read `AGENTS.md`.
2. Read `docs/project-reference/README.md`.
3. Read `docs/superpowers/specs/2026-05-19-product-cleanup-for-crypto-simulator-pivot.md` before planning product work.
4. Read `docs/project-reference/issues.md` before editing auth or crypto code.
5. Check `.env`, `app.json`, and `apps/frontend/app/_layout.tsx` for environment assumptions.
6. Confirm whether the task is docs-only, audit-only, strategy, or runtime-fix work.
7. If touching crypto, verify whether the intended source of truth is live APIs or fallback fixtures.
8. For API-backed screens, preserve visible loading, error, retry, source, freshness, and fallback states.
9. Run `./node_modules/.bin/jest --runInBand --watchman=false` after crypto changes.
10. Run `./node_modules/.bin/tsc --noEmit` before claiming the app typechecks.
11. If touching metrics, check `docs/project-reference/metrics.md` and preserve stable event names unless a rename is intentional.
