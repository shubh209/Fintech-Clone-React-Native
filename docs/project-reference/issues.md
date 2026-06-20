# Issues Ledger

## Current State

The repo has been reset to a focused crypto simulator foundation. Simulation v1 now exists as a signed-in tab backed by the Cloudflare Worker, historical D1 data, CoinGecko current prices, city-based purchasing-power comparisons, local saved simulations, and a chart-driven historical date explorer.

Old fintech-clone issues around transaction dates, balance persistence, Activity filtering, transaction cloud sync, MMKV transaction cache, lock/passcode behavior, and placeholder Home actions are no longer active because the related code was removed.

## Resolved Or Removed

### Crypto list/detail data reliability

- Status: Active code, stabilized
- Current files: `apps/frontend/app/(authenticated)/(tabs)/crypto.tsx`, `apps/frontend/app/(authenticated)/crypto/[id].tsx`, `apps/backend/src/domains/crypto-market/*`, `packages/shared/src/cryptoValidators.ts`
- Verification: crypto frontend wiring tests, crypto validator tests, backend listings/info/tickers tests.

### Mobile-owned crypto API handlers

- Status: Removed
- Current behavior: Mobile crypto screens call the Cloudflare Worker through `EXPO_PUBLIC_API_BASE_URL`.
- Verification: `apps/frontend/__tests__/cloud-backend-wiring.test.ts`.

### Placeholder fintech actions

- Status: Removed
- Removed surfaces: random Add Money, destructive Exchange, More menu, static widgets, fake login providers, fake account rows, Home tab, Activity tab, lock/passcode modal.
- Verification: `apps/frontend/__tests__/product-cleanup-regressions.test.ts` and `tests/project-structure.test.ts`.

### Transaction snapshot backend

- Status: Removed for pivot
- Removed files: `apps/backend/src/transactions`, `apps/frontend/utils/transactionRepository.ts`, `apps/frontend/utils/transactionApiClient.ts`, `packages/shared/src/transactionContracts.ts`.
- Reason: transaction ledger behavior does not belong in the minimal crypto simulator foundation.

### Historical crypto data source

- Status: Resolved for Simulation v1.
- Current behavior: Offline Python ingestion imports the full available date range already present in each curated CSV into Cloudflare D1. The importer preserves raw CSV files, applies an auditable data-quality manifest, uses deterministic same-row OHLC repairs only, quarantines unrecoverable rows, and marks assets ready only when they have at least 365 valid daily rows and no more than 10% quarantined rows.
- Current files: `scripts/historical_prices/import_historical_prices.py`, `apps/backend/src/domains/simulation/historicalPriceRepository.ts`, `apps/backend/src/domains/simulation/simulationHistoryService.ts`, `apps/backend/src/domains/simulation/simulationPriceService.ts`.
- Verification: Python importer tests, D1 repository tests, and simulation API route tests.

### Simulator v1 workflow

- Status: Active code, first vertical slice implemented.
- Current behavior: Signed-in Simulation tab supports BTC/ETH/SOL, Date and Event modes, yearly historical chart exploration, press-and-drag date selection, sourced event headline cards, same-day/one-week/one-month reaction delays, USD amount input, Worker-computed current-value result, risk journey metrics, five-city purchasing-power comparisons, Data Trust metadata including next-available date resolution, and local saved simulations.
- Current files: `apps/frontend/src/features/simulation/*`, `apps/frontend/app/(authenticated)/(tabs)/simulation.tsx`, `packages/shared/src/simulationTypes.ts`, `packages/shared/src/simulationValidators.ts`, `apps/backend/src/domains/simulation/*`.
- Verification: frontend Simulation client/storage/screen tests, shared Simulation validator tests, backend Simulation tests.

### Event-based simulation

- Status: Active code, first vertical slice implemented.
- Current behavior: `/api/simulation/events` returns 15 curated active BTC/ETH/SOL market events from D1 with 30 source records. `/api/simulation/event-scenarios` resolves the selected event and reaction delay to a historical buy date, computes current value, max drawdown, longest underwater period, best/worst 30-day stretches, and a deterministic plain-English takeaway.
- Current files: `apps/backend/migrations/0004_simulation_events.sql`, `apps/backend/src/domains/simulation/simulationEventRepository.ts`, `apps/backend/src/domains/simulation/simulationEventRiskMetrics.ts`, `apps/backend/src/domains/simulation/simulationEventScenarioService.ts`, `apps/frontend/src/features/simulation/api/getSimulationEvents.ts`, `apps/frontend/src/features/simulation/api/getSimulationEventScenario.ts`, `apps/frontend/src/features/simulation/screens/simulationScreen.tsx`.
- Verification: `apps/backend/__tests__/api/simulation-events-api.test.ts`, `apps/backend/__tests__/simulation/simulationEventRepository.test.ts`, `apps/backend/__tests__/simulation/simulationEventRiskMetrics.test.ts`, frontend event API client tests, Simulation screen source-boundary tests, and shared Simulation validator tests.

### Purchasing power comparison

- Status: Active code, first vertical slice implemented.
- Current behavior: after a successful Simulation result, the app calls `/api/purchasing-power/comparisons` with selected city and simulated current value, then shows monthly essentials and big-purchase comparisons for Phoenix, San Francisco, New York, Austin, and Seattle.
- Current files: `apps/backend/src/domains/purchasing-power/*`, `packages/shared/src/purchasingPowerTypes.ts`, `packages/shared/src/purchasingPowerValidators.ts`, `apps/frontend/src/features/simulation/api/getPurchasingPowerComparisons.ts`, `apps/frontend/src/features/simulation/screens/simulationScreen.tsx`.
- Verification: purchasing-power API tests, shared purchasing-power validator tests, frontend client tests, and Simulation screen source-boundary tests.

### Simulation asset catalog visibility

- Status: Active code, first vertical slice implemented.
- Current behavior: the Simulation tab calls `/api/simulation/assets` and shows ready/unavailable asset counts, market cache status, top ready assets, unavailable reasons, and data-quality counts without enabling unsupported assets in Simulation v1.
- Current files: `apps/backend/src/domains/simulation/simulationAssetsService.ts`, `packages/shared/src/simulationAssetCatalogTypes.ts`, `packages/shared/src/simulationAssetCatalogValidators.ts`, `apps/frontend/src/features/simulation/api/getSimulationAssets.ts`, `apps/frontend/src/features/simulation/screens/simulationScreen.tsx`.
- Verification: simulation asset API tests, frontend asset catalog client tests, shared catalog validator tests, and Simulation screen source-boundary tests.

## Remaining Issues Or Risk Areas

### Production deploy after backend route changes

- Severity: Medium
- Symptom: frontend Simulation and purchasing-power flows require the latest Worker deploy after backend route changes.
- Next step: after backend changes, run the repo's bundled Node with Wrangler from `apps/backend` and verify `/api/simulation/history?asset=BTC&year=2021`, `/api/simulation/assets`, `/api/simulation/events?asset=BTC`, `/api/simulation/event-scenarios?eventId=btc-2024-spot-etf-approval&delay=one_week&amountUsd=500`, and `/api/purchasing-power/comparisons?city=phoenix&amountUsd=2500`.

### Purchasing power dataset is curated v1 data

- Severity: Medium
- Symptom: five-city purchasing-power comparisons use deterministic curated portfolio data, not live or externally sourced cost-of-living data.
- Next step: before presenting claims as market or cost-of-living facts, add source citations, dataset update workflow, or a visible "curated estimate" explanation.

### Historical fallback ticker data is limited

- Severity: Low
- Symptom: Existing fallback ticker data may not support rich historical simulations.
- Affected files: `apps/backend/src/domains/crypto-market/cloudFallbackStore.ts`, Cloudflare KV data.
- Next step: Do not treat current ticker fallback as simulator historical data.

### Root product naming still says fintech clone

- Severity: Low
- Symptom: Repo/package/app naming still uses `Fintech-Clone-React-Native`.
- Next step: Decide later whether to rename the app after simulator direction stabilizes.
