# Architecture

## Routing

- `apps/frontend/app/index.tsx` is the landing route.
- `apps/frontend/app/login.tsx`, `apps/frontend/app/signup.tsx`, `apps/frontend/app/help.tsx`, and `apps/frontend/app/verify/[phone].tsx` are public auth flows.
- `apps/frontend/app/(authenticated)/(tabs)` contains the main signed-in tab shell.
- `apps/frontend/app/(authenticated)/(tabs)/activity.tsx` is the full transaction activity screen with search, category filters, editable categories, and monthly totals.
- `apps/frontend/app/(authenticated)/(modals)` contains lock and account modal flows.
- `apps/frontend/app/(authenticated)/crypto/[id].tsx` is the crypto detail screen.

## Product Architecture Direction

- The app should favor fewer reliable workflows over many placeholder features.
- New primary tabs should have a clear job, tests, and documented data behavior before being described as complete.
- Architecture decisions belong in `docs/architecture/decisions/`.
- Current reliability work is planned in `docs/superpowers/plans/2026-05-14-reliability-first-phase-1.md`.

## State And Persistence

- Clerk auth state is provided from `apps/frontend/app/_layout.tsx`.
- React Query is initialized globally in `apps/frontend/app/_layout.tsx`.
- Transaction state is held in `apps/frontend/Store/balance/balanceStore.ts`.
- The balance store persists through MMKV via `apps/frontend/Store/storage/mmkv-storage.ts`.
- Transaction normalization, category inference, filtering, monthly summaries, and display helpers live in `apps/frontend/Store/balance/transactionUtils.ts`.
- The balance store uses persist version `1` to backfill categories for legacy persisted transactions.
- Inactivity lock timing uses `apps/frontend/context/userInactivityStorage.ts`.
- Zustand and inactivity storage fall back to in-memory storage when MMKV cannot create an on-device JSI instance.

## Crypto Data Flow

- `apps/frontend/app/(authenticated)/(tabs)/crypto.tsx` fetches listings and logo/info metadata through `apps/frontend/utils/cryptoApiClient.ts`.
- `apps/frontend/app/(authenticated)/crypto/[id].tsx` fetches detail metadata and selected-asset ticker quote data through `apps/frontend/utils/cryptoApiClient.ts`, then normalizes ticker timestamps through `apps/frontend/utils/tickers.ts`.
- Mobile crypto requests use `EXPO_PUBLIC_API_BASE_URL`; the mobile app must not own CoinMarketCap secrets or `apps/frontend/app/api` crypto handlers.
- The Cloudflare Worker in `apps/backend` owns CoinMarketCap provider calls, runtime validation, and `CRYPTO_FALLBACKS` KV fallback reads.
- The deployed Worker URL is `https://fintech-reliability-api.shubhkapadia2031.workers.dev`.
- `CRYPTO_FALLBACKS` is backed by production KV namespace `63a5d0553e734abebbfa23745ceac413` and preview KV namespace `1f22e8b24b014c4dacb027bfba0373b2`.
- The ticker route accepts `id=<coinMarketCapId>` and uses CoinMarketCap latest EUR quote data for the selected asset when configured. Cloud KV data remains the fallback.
- API-backed screens should expose loading, error, retry, source, freshness, and fallback states to users instead of silently rendering stale or fixture data.

## Metrics

- Metrics helpers live in `apps/frontend/utils/metrics.ts`.
- The current metrics sink is local: in-memory buffer plus dev console output.
- Use `timeAsync()` for latency-sensitive async work and `recordMetric()` for immediate state transitions.
- The event catalog lives in `docs/project-reference/metrics.md`.
- Major instrumented surfaces include auth, lock/unlock, inactivity lock, home transactions, crypto client fetches, and crypto API upstream/fallback paths.

## API Trust Helpers

- `apps/frontend/utils/apiResult.ts` re-exports shared source/fallback/freshness metadata helpers from `packages/shared/src/apiResult.ts`.
- `apps/frontend/utils/cryptoValidators.ts` validates the subset of CoinMarketCap payloads the app renders.
- Cloud API routes should validate live provider data before returning it and fall back to KV data when the live shape is malformed.
- Crypto UI should expose `Data source`, `Last updated`, and `Retry` affordances for API-backed data.

## Test Coverage Added

- `apps/frontend/Store/balance/transactionUtils.test.ts`
- `apps/frontend/Store/storage/mmkv-storage.test.ts`
- `apps/frontend/context/userInactivityStorage.test.ts`
- `apps/frontend/utils/currency.test.ts`
- `apps/frontend/utils/metrics.test.ts`
- `apps/frontend/utils/tickers.test.ts`
- `apps/frontend/utils/apiResult.test.ts`
- `apps/frontend/utils/cryptoValidators.test.ts`
- `apps/frontend/__tests__/crypto-detail-hooks.test.ts`
- `apps/frontend/__tests__/activity-tab-wiring.test.ts`
- `apps/frontend/__tests__/crypto-detail-api-wiring.test.ts`
- `apps/frontend/__tests__/crypto-list-api-wiring.test.ts`
- `apps/backend/__tests__/api/listings-api.test.ts`
- `apps/backend/__tests__/api/info-api.test.ts`
- `apps/backend/__tests__/api/tickers-api.test.ts`
- `tests/project-structure.test.ts`

## Structural Notes

- Frontend app code lives under `apps/frontend`; backend Worker code lives under `apps/backend`; shared contracts live under `packages/shared`.
- Root-level `app`, `Components`, `Store`, `utils`, `assets`, `constants`, `context`, and `interfaces` folders were moved under `apps/frontend` to make ownership clearer.
- No placeholder primary tabs should be kept in the tab shell; future tabs need a reliable workflow before being added.
