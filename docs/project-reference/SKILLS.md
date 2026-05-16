# Project Skills Guide

## When Planning Product Work

- Start with `docs/product-strategy/reliable-finance-app-roadmap.md`.
- Use `docs/superpowers/plans/2026-05-14-reliability-first-phase-1.md` for the current reliability implementation sequence.
- Use `docs/project-reference/measurement-skill.md` for every functionality change so customer-impact measurement is designed, instrumented, tested, and summarized.
- Prefer fewer complete workflows over additional placeholder tabs.
- Treat reliability, data freshness, privacy boundaries, and observability as product features.
- Do not add AI financial advice; future AI work should be explainable educational guidance with visible inputs and privacy controls.

## When Working On Auth

- Start with `apps/frontend/app/_layout.tsx`, `apps/frontend/app/login.tsx`, `apps/frontend/app/signup.tsx`, and `apps/frontend/app/verify/[phone].tsx`.
- Verify Clerk environment keys before debugging UI logic.

## When Working On Storage

- Start with `apps/frontend/Store/balance/balanceStore.ts`, `apps/frontend/Store/balance/transactionUtils.ts`, and `apps/frontend/Store/storage/mmkv-storage.ts`.
- Persist transaction dates as ISO strings.
- Persist transaction categories as inferred category strings and preserve the version `1` backfill migration.
- Use `getTransactionsNewestFirst()` instead of mutating arrays from the Zustand store.
- Use `filterTransactions()` and `getMonthlyTransactionSummary()` for Activity views instead of duplicating transaction logic in screens.
- Keep `apps/frontend/Store/storage/mmkv-storage.ts` raw-string based because `createJSONStorage()` owns JSON parsing and stringifying.
- Preserve the legacy double-encoded MMKV read compatibility unless all users have migrated storage.
- Preserve the in-memory fallback path for environments where MMKV cannot create a JSI-backed native instance.

## When Working On Crypto

- Start with `apps/frontend/app/(authenticated)/(tabs)/crypto.tsx` and `apps/frontend/app/(authenticated)/crypto/[id].tsx`.
- Then inspect `apps/backend/src/crypto/cryptoRoutes.ts`, `apps/backend/src/crypto/cryptoService.ts`, and `apps/backend/src/crypto/coinMarketCapClient.ts`.
- Check `apps/frontend/utils/cryptoValidators.ts` before changing rendered CoinMarketCap response fields.
- Check `apps/frontend/utils/apiResult.ts` and `packages/shared/src/apiResult.ts` before changing source/freshness/fallback metadata behavior.
- Confirm whether fetch behavior is expected to work on native, web, or both before changing transport code.
- Listings and info use live CoinMarketCap data when Worker `CRYPTO_API_KEY` is present, then fall back to `CRYPTO_FALLBACKS` KV data.
- Detail ticker quotes use live CoinMarketCap selected-asset quote data when Worker `CRYPTO_API_KEY` is present, then fall back to `CRYPTO_FALLBACKS` KV data.
- API-backed crypto screens should show source, freshness, loading, error, retry, and fallback states.
- Malformed live crypto payloads should fall back locally rather than rendering invalid values.
- Keep hooks above early returns in `apps/frontend/app/(authenticated)/crypto/[id].tsx`.
- Normalize ticker data through `apps/frontend/utils/tickers.ts` before chart rendering.

## When Working On Metrics

- Start with `apps/frontend/utils/metrics.ts` and `docs/project-reference/metrics.md`.
- Also read `docs/project-reference/measurement-skill.md` before adding or changing functionality.
- Use `timeAsync()` for API calls, auth calls, and biometric operations.
- Use `timeSync()` for synchronous state operations.
- Use `recordMetric()` for immediate success/failure events or fallback use.
- Add tests with `clearMetrics()` and `getMetricsSnapshot()` before changing event behavior.
- Keep event names stable so future performance comparisons remain meaningful.

## High-Risk Assumptions

- Relative `/api/...` fetches are intentionally avoided in native crypto screens.
- `EXPO_PUBLIC_API_BASE_URL` must point at the deployed Worker before shipping native builds.
- Static fallback data can mask live integration failures.
