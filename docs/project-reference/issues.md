# Issues Ledger

## Resolved In High-Confidence Stabilization Pass

### 1. Persisted transaction dates can rehydrate as strings

- Status: Fixed
- Severity: High
- Fix: `Store/balance/balanceStore.ts` now normalizes incoming transaction dates to ISO strings through `Store/balance/transactionUtils.ts`.
- Verification: `Store/balance/transactionUtils.test.ts` covers date normalization and display formatting.

### 2. Transactions are mutated during render

- Status: Fixed
- Severity: Medium
- Fix: `app/(authenticated)/(tabs)/home.tsx` renders `getTransactionsNewestFirst(transactions)`, which returns a sorted copy.
- Verification: `Store/balance/transactionUtils.test.ts` verifies the original array is not mutated.

### 3. Crypto screens show EUR prices with dollar labels

- Status: Fixed for the crypto list
- Severity: Low
- Fix: `app/(authenticated)/(tabs)/crypto.tsx` now formats `quote.EUR.price` with `formatEuroPrice()`.
- Verification: `utils/currency.test.ts` covers EUR formatting.

### 4. Listings/info API routes ignored live success responses

- Status: Fixed for listings and info
- Severity: Medium
- Fix: `app/api/listings+api.ts` and `app/api/info+api.ts` now return live CoinMarketCap data when `CRYPTO_API_KEY` is configured and the upstream response succeeds. They fall back to local data when no key is present or the request fails.
- Affected files: `app/api/listings+api.ts`, `app/api/info+api.ts`, `app/api/tickers+api.ts`
- Verification: `app/api/listings+api.test.ts` and `app/api/info+api.test.ts`.

### 5. Custom Zustand MMKV storage duplicated JSON responsibilities

- Status: Fixed
- Severity: Medium
- Fix: `Store/storage/mmkv-storage.ts` now stores and returns raw strings, leaving JSON serialization to Zustand's `createJSONStorage()`.
- Migration note: The adapter also unwraps legacy double-encoded persisted strings created by the old adapter.
- Debugger fallback: If MMKV cannot create a native JSI instance, the adapter falls back to in-memory storage instead of crashing.
- Verification: `Store/storage/mmkv-storage.test.ts`.

### 6. Inactivity lock MMKV storage could crash in remote debugger environments

- Status: Fixed
- Severity: Medium
- Fix: `context/UserInactivity.tsx` now uses `context/userInactivityStorage.ts`, which falls back to in-memory storage if MMKV cannot be created.
- Verification: `context/userInactivityStorage.test.ts`.

### 7. Crypto detail screen rendered more hooks after loading completed

- Status: Fixed
- Severity: High
- Symptom: React reported `Rendered more hooks than during the previous render` on `app/(authenticated)/crypto/[id].tsx`.
- Cause: `useAnimatedProps()` hooks were declared after loading/error early returns, so they were skipped on the first render and added after data loaded.
- Fix: Animated hooks now run before any conditional return.
- Verification: `__tests__/crypto-detail-hooks.test.ts`.

### 8. Crypto chart received unnormalized ticker timestamps

- Status: Fixed
- Severity: Medium
- Symptom: Ticker API data contains timestamp strings, while the chart screen treated timestamps as numbers.
- Fix: `utils/tickers.ts` normalizes API ticker points to `{ timestamp: number, price: number }` before chart rendering.
- Verification: `utils/tickers.test.ts`.

### 9. Crypto detail tickers waited on an unreliable CoinPaprika historical request

- Status: Fixed
- Severity: Medium
- Symptom: `/api/tickers` could spend hundreds of milliseconds waiting on CoinPaprika and then fall back to local data anyway.
- Fix: The route now returns local BTC historical data immediately.
- Verification: `__tests__/api/tickers-api.test.ts`.

### 10. `app.json` contained a sample Expo Router `origin` value

- Status: Fixed
- Severity: High
- Fix: Removed the `https://evanbacon.dev/` sample origin from `app.json`.
- Remaining note: A real production native API origin still needs to be chosen before shipping API routes to production native builds.

## Remaining Issues Or Risk Areas

### 11. Several tabs are placeholders

- Severity: Low
- Symptom: Invest, transfer, and lifestyle screens are minimal placeholder views.
- Affected files: `app/(authenticated)/(tabs)/invest.tsx`, `app/(authenticated)/(tabs)/transfer.tsx`, `app/(authenticated)/(tabs)/lifestyle.tsx`
- Next step: Treat these screens as incomplete during future planning and demos.

### 12. Relative `/api/...` fetches may need production origin planning

- Severity: High
- Symptom: Native screens call `fetch('/api/...')` for crypto data.
- Affected files: `app/(authenticated)/(tabs)/crypto.tsx`, `app/(authenticated)/crypto/[id].tsx`
- Current state: The sample origin was removed, but a production server origin still needs to be configured when the app has a real deployment host.
- Next step: Decide the production API host strategy before shipping native builds.

### 13. Historical ticker data is BTC-specific

- Severity: Medium
- Symptom: `app/api/tickers+api.ts` fetches/falls back to historical BTC data regardless of the selected crypto asset.
- Affected files: `app/api/tickers+api.ts`, `app/(authenticated)/crypto/[id].tsx`
- Next step: Key ticker data by selected crypto asset if multi-asset chart accuracy becomes a product goal.

### 14. Root README is too generic to onboard future sessions

- Severity: Low
- Symptom: `README.md` does not describe actual routes, data flow, or known issues.
- Affected files: `README.md`
- Next step: Update the README in a future docs pass if external-facing onboarding matters.
