# AGENTS.md

## Start Here

This repository is an Expo Router fintech clone with Clerk auth, Zustand plus MMKV persistence, and a Cloudflare Worker backend for crypto data.

Before making changes:

1. Read `docs/project-reference/README.md`.
2. Read `docs/project-reference/issues.md`.
3. Check `app.json`, `.env`, and `app/_layout.tsx` for environment assumptions.
4. Treat `Store/`, `apps/api/`, shared contracts, and auth routes as high-risk areas.

## High-Risk Areas

- `Store/balance/balanceStore.ts`
- `Store/storage/mmkv-storage.ts`
- `apps/api/src/crypto/cryptoService.ts`
- `apps/api/src/crypto/coinMarketCapClient.ts`
- `apps/api/src/crypto/cloudFallbackStore.ts`
- `packages/shared/src/cryptoValidators.ts`
- `app/(authenticated)/(tabs)/crypto.tsx`
- `app/(authenticated)/crypto/[id].tsx`
- `app/_layout.tsx`

## Project Notes

- The product direction is reliability-first: fewer credible finance workflows, explicit data freshness/fallback states, and documented production tradeoffs.
- Read `docs/product-strategy/reliable-finance-app-roadmap.md` before planning broad product work.
- Use `docs/superpowers/plans/2026-05-14-reliability-first-phase-1.md` as the current implementation sequence for reliability scaffolding.
- The repo uses mixed directory casing such as `Components`, `Store`, and `app`.
- Primary signed-in tabs are Home, Activity, and Crypto.
- Activity is a real tab for searchable/filterable transaction history, editable categories, and monthly totals.
- Mobile crypto screens call `EXPO_PUBLIC_API_BASE_URL`; do not reintroduce mobile-owned `app/api` crypto handlers.
- The Cloudflare Worker uses live CoinMarketCap data when `CRYPTO_API_KEY` is configured, then falls back to `CRYPTO_FALLBACKS` KV data.
- Crypto detail chart hooks must stay above loading/error early returns.
- Persisted transaction dates are normalized to ISO strings through `Store/balance/transactionUtils.ts`.
- Persisted transaction categories are inferred and backfilled for legacy transactions through `Store/balance/transactionUtils.ts`.
- MMKV storage has an in-memory fallback for remote debugger/non-JSI environments.
- Metrics are centralized in `utils/metrics.ts`; event names are cataloged in `docs/project-reference/metrics.md`.
- Run `npx jest --runInBand --watchman=false` and `npx tsc --noEmit` after storage or crypto changes.


<claude-mem-context>
# Memory Context

# [Fintech-Clone-React-Native] recent context, 2026-05-15 11:07pm MST

No previous sessions found.
</claude-mem-context>
