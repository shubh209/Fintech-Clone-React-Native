# Project Skills Guide

## When Planning Product Work

- Start with `docs/product-strategy/reliable-finance-app-roadmap.md`.
- Use `docs/superpowers/plans/2026-05-14-reliability-first-phase-1.md` for the current reliability implementation sequence.
- Prefer fewer complete workflows over additional placeholder tabs.
- Treat reliability, data freshness, privacy boundaries, and observability as product features.
- Do not add AI financial advice; future AI work should be explainable educational guidance with visible inputs and privacy controls.

## When Working On Auth

- Start with `app/_layout.tsx`, `app/login.tsx`, `app/signup.tsx`, and `app/verify/[phone].tsx`.
- Verify Clerk environment keys before debugging UI logic.

## When Working On Storage

- Start with `Store/balance/balanceStore.ts`, `Store/balance/transactionUtils.ts`, and `Store/storage/mmkv-storage.ts`.
- Persist transaction dates as ISO strings.
- Use `getTransactionsNewestFirst()` instead of mutating arrays from the Zustand store.
- Keep `Store/storage/mmkv-storage.ts` raw-string based because `createJSONStorage()` owns JSON parsing and stringifying.
- Preserve the legacy double-encoded MMKV read compatibility unless all users have migrated storage.
- Preserve the in-memory fallback path for environments where MMKV cannot create a JSI-backed native instance.

## When Working On Crypto

- Start with `app/(authenticated)/(tabs)/crypto.tsx` and `app/(authenticated)/crypto/[id].tsx`.
- Then inspect `app/api/listings+api.ts`, `app/api/info+api.ts`, and `app/api/tickers+api.ts`.
- Check `utils/cryptoValidators.ts` before changing rendered CoinMarketCap response fields.
- Check `utils/apiResult.ts` before changing source/freshness/fallback metadata behavior.
- Confirm whether fetch behavior is expected to work on native, web, or both before changing transport code.
- Listings and info use live CoinMarketCap data when `CRYPTO_API_KEY` is present, then fall back to local data.
- Detail ticker quotes use live CoinMarketCap selected-asset quote data when `CRYPTO_API_KEY` is present, then fall back to local BTC historical data.
- API-backed crypto screens should show source, freshness, loading, error, retry, and fallback states.
- Malformed live crypto payloads should fall back locally rather than rendering invalid values.
- Keep hooks above early returns in `app/(authenticated)/crypto/[id].tsx`.
- Normalize ticker data through `utils/tickers.ts` before chart rendering.

## When Working On Metrics

- Start with `utils/metrics.ts` and `docs/project-reference/metrics.md`.
- Use `timeAsync()` for API calls, auth calls, and biometric operations.
- Use `timeSync()` for synchronous state operations.
- Use `recordMetric()` for immediate success/failure events or fallback use.
- Add tests with `clearMetrics()` and `getMetricsSnapshot()` before changing event behavior.
- Keep event names stable so future performance comparisons remain meaningful.

## High-Risk Assumptions

- Relative `/api/...` fetches may depend on Expo Router server or origin behavior.
- A real production `origin` still needs to be selected before shipping native builds that depend on local API routes.
- Static fallback data can mask live integration failures.
