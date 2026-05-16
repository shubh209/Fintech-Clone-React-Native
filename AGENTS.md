# AGENTS.md

## Start Here

This repository is an Expo Router fintech clone with Clerk auth, Zustand plus MMKV persistence, and a Cloudflare Worker backend for crypto data.

Before making changes:

1. Read `docs/project-reference/README.md`.
2. Read `docs/project-reference/issues.md`.
3. Check `app.json`, `.env`, and `apps/frontend/app/_layout.tsx` for environment assumptions.
4. Treat `apps/frontend/Store/`, `apps/backend/`, shared contracts, and auth routes as high-risk areas.
5. Read `docs/project-reference/measurement-skill.md` before any code change that adds or changes functionality.

## High-Risk Areas

- `apps/frontend/Store/balance/balanceStore.ts`
- `apps/frontend/Store/storage/mmkv-storage.ts`
- `apps/backend/src/crypto/cryptoService.ts`
- `apps/backend/src/crypto/coinMarketCapClient.ts`
- `apps/backend/src/crypto/cloudFallbackStore.ts`
- `packages/shared/src/cryptoValidators.ts`
- `apps/frontend/app/(authenticated)/(tabs)/crypto.tsx`
- `apps/frontend/app/(authenticated)/crypto/[id].tsx`
- `apps/frontend/app/_layout.tsx`

## Project Notes

- The product direction is reliability-first: fewer credible finance workflows, explicit data freshness/fallback states, and documented production tradeoffs.
- Read `docs/product-strategy/reliable-finance-app-roadmap.md` before planning broad product work.
- Use `docs/superpowers/plans/2026-05-14-reliability-first-phase-1.md` as the current implementation sequence for reliability scaffolding.
- The monorepo separates product code into `apps/frontend`, `apps/backend`, and `packages/shared`.
- Primary signed-in tabs are Home, Activity, and Crypto.
- Activity is a real tab for searchable/filterable transaction history, editable categories, and monthly totals.
- Mobile crypto screens call `EXPO_PUBLIC_API_BASE_URL`; do not reintroduce mobile-owned `apps/frontend/app/api` crypto handlers.
- The deployed Worker URL is `https://fintech-reliability-api.shubhkapadia2031.workers.dev`.
- Cloudflare `CRYPTO_FALLBACKS` KV is configured with production namespace `63a5d0553e734abebbfa23745ceac413` and preview namespace `1f22e8b24b014c4dacb027bfba0373b2`.
- The Cloudflare Worker uses live CoinMarketCap data when `CRYPTO_API_KEY` is configured, then falls back to `CRYPTO_FALLBACKS` KV data.
- Crypto detail chart hooks must stay above loading/error early returns.
- Persisted transaction dates are normalized to ISO strings through `apps/frontend/Store/balance/transactionUtils.ts`.
- Persisted transaction categories are inferred and backfilled for legacy transactions through `apps/frontend/Store/balance/transactionUtils.ts`.
- MMKV storage has an in-memory fallback for remote debugger/non-JSI environments.
- Metrics are centralized in `apps/frontend/utils/metrics.ts`; event names are cataloged in `docs/project-reference/metrics.md`.
- Every functionality change must define a measurable customer-impact signal and report before/after impact or newly added measurement coverage. Use `docs/project-reference/measurement-skill.md`.
- Run `npx jest --runInBand --watchman=false` and `npx tsc --noEmit` after storage or crypto changes.


<claude-mem-context>
# Memory Context

# [Fintech-Clone-React-Native] recent context, 2026-05-16 4:01pm MST

No previous sessions found.
</claude-mem-context>
