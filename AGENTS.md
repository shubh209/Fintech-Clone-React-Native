# AGENTS.md

## Start Here

This repository is an Expo Router fintech clone with Clerk auth, Zustand plus MMKV persistence, and local Expo Router API handlers for crypto data.

Before making changes:

1. Read `docs/project-reference/README.md`.
2. Read `docs/project-reference/issues.md`.
3. Check `app.json`, `.env`, and `app/_layout.tsx` for environment assumptions.
4. Treat `Store/`, `app/api/`, and auth routes as high-risk areas.

## High-Risk Areas

- `Store/balance/balanceStore.ts`
- `Store/storage/mmkv-storage.ts`
- `app/api/listings+api.ts`
- `app/api/info+api.ts`
- `app/api/tickers+api.ts`
- `app/(authenticated)/(tabs)/crypto.tsx`
- `app/(authenticated)/crypto/[id].tsx`
- `app/_layout.tsx`

## Project Notes

- The repo uses mixed directory casing such as `Components`, `Store`, and `app`.
- Several tabs are placeholders and should not be described as complete features.
- Listings and info crypto API routes use live CoinMarketCap data when `CRYPTO_API_KEY` is configured, then fall back to local data.
- Historical ticker data currently returns local BTC data immediately to avoid slow crypto detail-screen loads.
- Crypto detail chart hooks must stay above loading/error early returns.
- Persisted transaction dates are normalized to ISO strings through `Store/balance/transactionUtils.ts`.
- MMKV storage has an in-memory fallback for remote debugger/non-JSI environments.
- Metrics are centralized in `utils/metrics.ts`; event names are cataloged in `docs/project-reference/metrics.md`.
- Run `npx jest --runInBand --watchman=false` and `npx tsc --noEmit` after storage or crypto changes.


<claude-mem-context>
# Memory Context

# [Fintech-Clone-React-Native] recent context, 2026-05-13 10:29pm MST

No previous sessions found.
</claude-mem-context>
