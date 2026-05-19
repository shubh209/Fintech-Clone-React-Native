# Architecture

## Routing

- `apps/frontend/app/index.tsx` is the landing route.
- `apps/frontend/app/login.tsx`, `apps/frontend/app/signup.tsx`, `apps/frontend/app/help.tsx`, and `apps/frontend/app/verify/[phone].tsx` are public auth flows.
- `apps/frontend/app/(authenticated)/(tabs)` contains the signed-in tab shell.
- `apps/frontend/app/(authenticated)/(tabs)/crypto.tsx` is the current primary signed-in screen.
- `apps/frontend/app/(authenticated)/crypto/[id].tsx` is the crypto detail screen.
- `apps/frontend/app/(authenticated)/(modals)/account.tsx` contains the account modal.

Signed-in users are routed to `/(authenticated)/(tabs)/crypto`.

## Product Architecture Direction

- The app is being reset to a minimal crypto market simulator foundation.
- Do not re-add generic banking clone surfaces unless they directly serve the simulator.
- New primary tabs should have a clear simulator job, tests, and documented data behavior before being added.
- Architecture decisions belong in `docs/architecture/decisions/`.

## State And Persistence

- Clerk auth state is provided from `apps/frontend/app/_layout.tsx`.
- React Query is initialized globally in `apps/frontend/app/_layout.tsx`.
- Crypto data is fetched through React Query on the list/detail screens.
- No app-owned transaction store, balance store, MMKV transaction cache, or inactivity lock state remains.

## Crypto Data Flow

- `apps/frontend/app/(authenticated)/(tabs)/crypto.tsx` fetches listings and logo/info metadata through `apps/frontend/utils/cryptoApiClient.ts`.
- `apps/frontend/app/(authenticated)/crypto/[id].tsx` fetches detail metadata and selected-asset ticker quote data through `apps/frontend/utils/cryptoApiClient.ts`, then normalizes ticker timestamps through `apps/frontend/utils/tickers.ts`.
- Mobile crypto requests use `EXPO_PUBLIC_API_BASE_URL`; the mobile app must not own CoinMarketCap secrets or `apps/frontend/app/api` crypto handlers.
- The Cloudflare Worker in `apps/backend` owns CoinMarketCap provider calls, runtime validation, and `CRYPTO_FALLBACKS` KV fallback reads.
- The deployed Worker URL is `https://fintech-reliability-api.shubhkapadia2031.workers.dev`.
- `CRYPTO_FALLBACKS` is backed by production KV namespace `63a5d0553e734abebbfa23745ceac413` and preview KV namespace `1f22e8b24b014c4dacb027bfba0373b2`.
- The ticker route accepts `id=<coinMarketCapId>` and uses CoinMarketCap latest EUR quote data for the selected asset when configured. Cloud KV data remains the fallback.
- API-backed crypto screens should expose loading, error, retry, source, freshness, and fallback states to users instead of silently rendering stale or fixture data.

## Metrics

- Metrics helpers live in `apps/frontend/utils/metrics.ts`.
- The current metrics sink is local: in-memory buffer plus dev console output.
- Use `timeAsync()` for latency-sensitive async work and `recordMetric()` for immediate state transitions.
- The event catalog lives in `docs/project-reference/metrics.md`.
- Current instrumented surfaces include auth and crypto client/API fetches.

## API Trust Helpers

- `apps/frontend/utils/apiResult.ts` re-exports shared source/fallback/freshness metadata helpers from `packages/shared/src/apiResult.ts`.
- `apps/frontend/utils/cryptoValidators.ts` validates the subset of CoinMarketCap payloads the app renders.
- Cloud API routes should validate live provider data before returning it and fall back to KV data when the live shape is malformed.
- Crypto UI should expose `Data source`, `Last updated`, and `Retry` affordances for API-backed data.

## Test Coverage

- `apps/frontend/utils/currency.test.ts`
- `apps/frontend/utils/metrics.test.ts`
- `apps/frontend/utils/tickers.test.ts`
- `apps/frontend/utils/apiResult.test.ts`
- `apps/frontend/utils/cryptoValidators.test.ts`
- `apps/frontend/__tests__/crypto-detail-hooks.test.ts`
- `apps/frontend/__tests__/crypto-detail-api-wiring.test.ts`
- `apps/frontend/__tests__/crypto-list-api-wiring.test.ts`
- `apps/frontend/__tests__/cloud-backend-wiring.test.ts`
- `apps/frontend/__tests__/product-cleanup-regressions.test.ts`
- `apps/backend/__tests__/api/listings-api.test.ts`
- `apps/backend/__tests__/api/info-api.test.ts`
- `apps/backend/__tests__/api/tickers-api.test.ts`
- `tests/project-structure.test.ts`

## Structural Notes

- Frontend app code lives under `apps/frontend`; backend Worker code lives under `apps/backend`; shared crypto contracts live under `packages/shared`.
- The old `Store`, transaction repository, Activity tab, Home tab, lock modal, transaction backend routes, and transaction shared contracts were removed for the crypto simulator pivot.
- No placeholder primary tabs should be kept in the tab shell.
