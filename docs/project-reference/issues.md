# Issues Ledger

## Current State

The repo has been reset to a minimal crypto simulator foundation.

Old fintech-clone issues around transaction dates, balance persistence, Activity filtering, transaction cloud sync, MMKV transaction cache, lock/passcode behavior, and placeholder Home actions are no longer active because the related code was removed.

## Resolved Or Removed

### Crypto list/detail data reliability

- Status: Active code, stabilized
- Current files: `apps/frontend/app/(authenticated)/(tabs)/crypto.tsx`, `apps/frontend/app/(authenticated)/crypto/[id].tsx`, `apps/backend/src/crypto/*`, `packages/shared/src/cryptoValidators.ts`
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

## Remaining Issues Or Risk Areas

### Historical crypto data source not chosen

- Severity: High
- Symptom: The simulator idea needs reliable historical crypto prices by asset/date.
- Next step: Choose provider strategy, likely CoinGecko or paid CoinMarketCap depending historical coverage/cost.

### Simulator data model not implemented

- Severity: High
- Symptom: No saved simulations, historical purchase records, or simulated net worth exist yet.
- Next step: design the first simulator flow before adding storage.

### Historical fallback ticker data is limited

- Severity: Low
- Symptom: Existing fallback ticker data may not support rich historical simulations.
- Affected files: `apps/backend/src/crypto/cloudFallbackStore.ts`, Cloudflare KV data.
- Next step: Do not treat current ticker fallback as simulator historical data.

### Root product naming still says fintech clone

- Severity: Low
- Symptom: Repo/package/app naming still uses `Fintech-Clone-React-Native`.
- Next step: Decide later whether to rename the app after simulator direction stabilizes.
