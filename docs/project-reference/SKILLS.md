# Project Skills Guide

## When Planning Product Work

- Treat the current product direction as crypto market simulation.
- Use `docs/superpowers/specs/2026-05-19-product-cleanup-for-crypto-simulator-pivot.md` and `docs/superpowers/plans/2026-05-19-product-cleanup-for-crypto-simulator-pivot.md` for pivot context.
- Use `docs/project-reference/measurement-skill.md` for every functionality change so customer-impact measurement is designed, instrumented, tested, and summarized.
- Prefer fewer complete simulator workflows over additional placeholder tabs.
- Do not present fake banking, exchange, passcode, or transaction actions as product features.

## When Working On Auth

- Start with `apps/frontend/app/_layout.tsx`, `apps/frontend/app/login.tsx`, `apps/frontend/app/signup.tsx`, and `apps/frontend/app/verify/[phone].tsx`.
- Verify Clerk environment keys before debugging UI logic.
- Phone auth is the only implemented auth method.

## When Working On Crypto

- Start with `apps/frontend/src/features/crypto-market/screens/cryptoMarketScreen.tsx` and `apps/frontend/src/features/crypto-market/screens/cryptoAssetDetailScreen.tsx`.
- Then inspect `apps/backend/src/crypto/cryptoRoutes.ts`, `apps/backend/src/crypto/cryptoService.ts`, and `apps/backend/src/crypto/coinMarketCapClient.ts`.
- Check `apps/frontend/src/shared/api/cryptoValidators.ts` before changing rendered CoinMarketCap response fields.
- Check `apps/frontend/src/shared/api/apiResult.ts` and `packages/shared/src/apiResult.ts` before changing source/freshness/fallback metadata behavior.
- Confirm whether fetch behavior is expected to work on native, web, or both before changing transport code.
- Listings and info use live CoinMarketCap data when Worker `CRYPTO_API_KEY` is present, then fall back to `CRYPTO_FALLBACKS` KV data.
- Detail ticker quotes use live CoinMarketCap selected-asset quote data when Worker `CRYPTO_API_KEY` is present, then fall back to `CRYPTO_FALLBACKS` KV data.
- API-backed crypto screens should show source, freshness, loading, error, retry, and fallback states.
- Malformed live crypto payloads should fall back locally rather than rendering invalid values.
- Keep hooks above early returns in `apps/frontend/src/features/crypto-market/screens/cryptoAssetDetailScreen.tsx`.
- Normalize ticker data through `apps/frontend/src/features/crypto-market/chart/normalizeTickerPoints.ts` before chart rendering.

## When Working On Metrics

- Start with `apps/frontend/src/shared/metrics/metrics.ts` and `docs/project-reference/metrics.md`.
- Also read `docs/project-reference/measurement-skill.md` before adding or changing functionality.
- Use `timeAsync()` for API calls and auth calls.
- Use `timeSync()` for synchronous state operations.
- Use `recordMetric()` for immediate success/failure events or fallback use.
- Add tests with `clearMetrics()` and `getMetricsSnapshot()` before changing event behavior.
- Keep event names stable so future performance comparisons remain meaningful.

## High-Risk Assumptions

- Relative `/api/...` fetches are intentionally avoided in native crypto screens.
- `EXPO_PUBLIC_API_BASE_URL` must point at the deployed Worker before shipping native builds.
- Static fallback data can mask live integration failures.
- Historical crypto simulation has not been implemented yet.
