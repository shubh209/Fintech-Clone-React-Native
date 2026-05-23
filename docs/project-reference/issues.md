# Issues Ledger

## Current State

The repo has been reset to a minimal crypto simulator foundation. Simulation v1 now exists as a signed-in tab backed by the Cloudflare Worker, historical D1 data, CoinGecko current prices, local saved simulations, and a chart-driven historical date explorer.

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
- Current behavior: Offline Python ingestion imports the curated historical CSV dataset into Cloudflare D1.
- Current files: `scripts/historical_prices/import_historical_prices.py`, `apps/backend/src/domains/simulation/historicalPriceRepository.ts`, `apps/backend/src/domains/simulation/simulationHistoryService.ts`, `apps/backend/src/domains/simulation/simulationPriceService.ts`.
- Verification: Python importer tests, D1 repository tests, and simulation API route tests.

### Simulator v1 workflow

- Status: Active code, first vertical slice implemented.
- Current behavior: Signed-in Simulation tab supports BTC/ETH/SOL, yearly historical chart exploration, press-and-drag date selection, USD amount input, Worker-computed current-value result, Data Trust metadata, and local saved simulations.
- Current files: `apps/frontend/src/features/simulation/*`, `apps/frontend/app/(authenticated)/(tabs)/simulation.tsx`, `packages/shared/src/simulationTypes.ts`, `packages/shared/src/simulationValidators.ts`, `apps/backend/src/domains/simulation/*`.
- Verification: frontend Simulation client/storage/screen tests, shared Simulation validator tests, backend Simulation tests.

## Remaining Issues Or Risk Areas

### Simulation production deploy after backend route changes

- Severity: Medium
- Symptom: Frontend Simulation chart calls `/api/simulation/history`, which requires the latest Worker deploy after route changes.
- Next step: after backend simulation changes, run `../../node_modules/.bin/wrangler deploy` from `apps/backend` and verify `/api/simulation/history?asset=BTC&year=2021`.

### Purchasing power comparison not implemented

- Severity: High
- Symptom: Simulator v1 can show current crypto value but cannot yet compare it to purchasable assets by region.
- Next step: design the purchasing-power comparison data model, source strategy, and first UI slice.

### Historical fallback ticker data is limited

- Severity: Low
- Symptom: Existing fallback ticker data may not support rich historical simulations.
- Affected files: `apps/backend/src/domains/crypto-market/cloudFallbackStore.ts`, Cloudflare KV data.
- Next step: Do not treat current ticker fallback as simulator historical data.

### Root product naming still says fintech clone

- Severity: Low
- Symptom: Repo/package/app naming still uses `Fintech-Clone-React-Native`.
- Next step: Decide later whether to rename the app after simulator direction stabilizes.
