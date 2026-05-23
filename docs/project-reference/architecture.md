# Architecture

## Routing

- `apps/frontend/app/index.tsx` is the landing route wrapper for `apps/frontend/src/features/auth/screens/landingScreen.tsx`.
- `apps/frontend/app/login.tsx`, `apps/frontend/app/signup.tsx`, `apps/frontend/app/help.tsx`, and `apps/frontend/app/verify/[phone].tsx` are thin public auth route wrappers for `apps/frontend/src/features/auth/screens`.
- `apps/frontend/app/(authenticated)/(tabs)` contains the signed-in tab shell.
- `apps/frontend/app/(authenticated)/(tabs)/simulation.tsx` is a thin route wrapper for the Simulation screen.
- `apps/frontend/app/(authenticated)/(tabs)/crypto.tsx` is a thin route wrapper for the crypto market screen.
- `apps/frontend/app/(authenticated)/crypto/[id].tsx` is a thin route wrapper for the crypto asset detail screen.
- `apps/frontend/app/(authenticated)/(modals)/account.tsx` is a thin route wrapper for `apps/frontend/src/features/auth/screens/accountScreen.tsx`.

Signed-in users are routed into the signed-in tab shell. The current product tabs are Simulation and Crypto.

## Product Architecture Direction

- The app is being reset to a minimal crypto market simulator foundation.
- Do not re-add generic banking clone surfaces unless they directly serve the simulator.
- New primary tabs should have a clear simulator job, tests, and documented data behavior before being added.
- Architecture decisions belong in `docs/architecture/decisions/`.
- Frontend product code is organized by feature/domain under `apps/frontend/src/features`.
- Shared frontend support code lives under `apps/frontend/src/shared`.

## State And Persistence

- Clerk auth state is provided from `apps/frontend/app/_layout.tsx`, with token-cache and redirect helpers owned by `apps/frontend/src/features/auth`.
- React Query is initialized globally in `apps/frontend/app/_layout.tsx`.
- Crypto data is fetched through React Query on the list/detail screens.
- Simulation API data is fetched through React Query on the Simulation screen.
- Saved Simulation snapshots use local `expo-secure-store` persistence through `apps/frontend/src/features/simulation/storage/savedSimulationsStore.ts`.
- No app-owned transaction store, balance store, MMKV transaction cache, or inactivity lock state remains.

## Crypto Data Flow

- `apps/frontend/src/features/crypto-market/screens/cryptoMarketScreen.tsx` fetches listings and logo/info metadata through `apps/frontend/src/features/crypto-market/api/getCryptoApiUrl.ts`.
- `apps/frontend/src/features/crypto-market/screens/cryptoAssetDetailScreen.tsx` fetches detail metadata and selected-asset ticker quote data through `apps/frontend/src/features/crypto-market/api/getCryptoApiUrl.ts`, then normalizes ticker timestamps through `apps/frontend/src/features/crypto-market/chart/normalizeTickerPoints.ts`.
- Mobile crypto requests use `EXPO_PUBLIC_API_BASE_URL`; the mobile app must not own CoinMarketCap secrets or `apps/frontend/app/api` crypto handlers.
- The Cloudflare Worker crypto-market domain in `apps/backend/src/domains/crypto-market` owns CoinMarketCap provider calls, runtime validation, and `CRYPTO_FALLBACKS` KV fallback reads.
- The deployed Worker URL is `https://fintech-reliability-api.shubhkapadia2031.workers.dev`.
- `CRYPTO_FALLBACKS` is backed by production KV namespace `63a5d0553e734abebbfa23745ceac413` and preview KV namespace `1f22e8b24b014c4dacb027bfba0373b2`.
- The ticker route accepts `id=<coinMarketCapId>` and uses CoinMarketCap latest EUR quote data for the selected asset when configured. Cloud KV data remains the fallback.
- API-backed crypto screens should expose loading, error, retry, source, freshness, and fallback states to users instead of silently rendering stale or fixture data.

## Simulation Data Flow

- Simulation v1 is signed-in only and product-limited to BTC, ETH, and SOL.
- The mobile app must call `GET /api/simulation/prices` through `EXPO_PUBLIC_API_BASE_URL`; it must not call D1, CoinGecko, or raw CSV files directly.
- The mobile app calls `GET /api/simulation/history` through `EXPO_PUBLIC_API_BASE_URL` for yearly historical chart points.
- The Simulation screen shows a chart-inspired year explorer where users can press and drag across the chart to select the historical buy date. Month chips remain as shortcuts, and the date field remains editable for fine tuning.
- Historical prices are imported offline from `data/crypto_data/` using `scripts/historical_prices/import_historical_prices.py`.
- Runtime historical lookup uses Cloudflare D1 binding `HISTORICAL_PRICES_DB`, backed by database `fintech-historical-prices` (`cce18a99-efa1-463a-9958-1926e1ed6ad2`).
- The verified historical import contains 120,740 rows across 88 valid assets, with BTC/ETH/SOL coverage from `2021-01-01` through `2026-03-22`.
- Current Simulation USD prices come from CoinGecko Simple Price through the Worker using `COINGECKO_API_KEY`, with a 60-second Worker cache.
- The Worker owns simulation math and returns Data Trust metadata, including `requestedDate`, `resolvedDate`, `dateResolution`, historical source, current provider, and cache status.
- TypeScript runtime code must not take over offline CSV ingestion; Python remains the owner of historical dataset import and D1 SQL generation.

## Metrics

- Metrics helpers live in `apps/frontend/src/shared/metrics/metrics.ts`.
- The current metrics sink is local: in-memory buffer plus dev console output.
- Use `timeAsync()` for latency-sensitive async work and `recordMetric()` for immediate state transitions.
- The event catalog lives in `docs/project-reference/metrics.md`.
- Current instrumented surfaces include auth, crypto client/API fetches, Simulation client/API fetches, and Simulation lifecycle events.

## API Trust Helpers

- `apps/frontend/src/shared/api/apiResult.ts` re-exports shared source/fallback/freshness metadata helpers from `packages/shared/src/apiResult.ts`.
- `apps/frontend/src/shared/api/cryptoValidators.ts` validates the subset of CoinMarketCap payloads the app renders.
- `apps/frontend/src/shared/api/simulationValidators.ts` re-exports shared Simulation response validators from `packages/shared/src/simulationValidators.ts`.
- Cloud API routes should validate live provider data before returning it and fall back to KV data when the live shape is malformed.
- Crypto UI should expose `Data source`, `Last updated`, and `Retry` affordances for API-backed data.

## Test Coverage

- `apps/frontend/src/shared/formatting/formatEuroPrice.test.ts`
- `apps/frontend/src/features/auth/routing/useAuthRedirects.ts`
- `apps/frontend/src/shared/metrics/metrics.test.ts`
- `apps/frontend/src/features/crypto-market/chart/normalizeTickerPoints.test.ts`
- `apps/frontend/src/shared/api/apiResult.test.ts`
- `apps/frontend/src/shared/api/cryptoValidators.test.ts`
- `apps/frontend/src/features/crypto-market/screens/cryptoAssetDetailHooks.test.ts`
- `apps/frontend/src/features/crypto-market/api/cryptoDetailApiWiring.test.ts`
- `apps/frontend/src/features/crypto-market/api/cryptoListApiWiring.test.ts`
- `apps/frontend/__tests__/cloud-backend-wiring.test.ts`
- `apps/frontend/__tests__/product-cleanup-regressions.test.ts`
- `apps/backend/__tests__/api/listings-api.test.ts`
- `apps/backend/__tests__/api/info-api.test.ts`
- `apps/backend/__tests__/api/tickers-api.test.ts`
- `apps/backend/__tests__/api/simulation-prices-api.test.ts`
- `apps/backend/__tests__/simulation/historicalPriceRepository.test.ts`
- `apps/backend/__tests__/simulation/coinGeckoCurrentPriceClient.test.ts`
- `apps/backend/__tests__/simulation/currentPriceCache.test.ts`
- `apps/frontend/src/features/simulation/api/getSimulationHistory.test.ts`
- `apps/frontend/src/features/simulation/api/getSimulationPrice.test.ts`
- `apps/frontend/src/features/simulation/screens/simulationScreen.test.ts`
- `apps/frontend/src/features/simulation/screens/simulationTabWiring.test.ts`
- `apps/frontend/src/features/simulation/storage/savedSimulationsStore.test.ts`
- `tests/project-structure.test.ts`

## Structural Notes

- Frontend routes live under `apps/frontend/app`; frontend product code lives under `apps/frontend/src`; backend Worker domain code lives under `apps/backend/src/domains`; shared crypto contracts live under `packages/shared`.
- The old `Store`, transaction repository, Activity tab, Home tab, lock modal, transaction backend routes, and transaction shared contracts were removed for the crypto simulator pivot.
- No placeholder primary tabs should be kept in the tab shell. Simulation and Crypto are current product tabs.
