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

### 10. Crypto detail prices were BTC-specific/static

- Status: Fixed
- Severity: Medium
- Symptom: `app/api/tickers+api.ts` returned BTC fallback data regardless of the selected crypto asset, so detail prices could be stale or wrong for non-BTC assets.
- Fix: `/api/tickers?id=<coinMarketCapId>` now uses CoinMarketCap `quotes/latest` when `CRYPTO_API_KEY` is configured, returns the selected asset's latest EUR quote, and falls back to local data only when live data is unavailable.
- Verification: `__tests__/api/tickers-api.test.ts`, `__tests__/crypto-detail-api-wiring.test.ts`, and `utils/tickers.test.ts`.

### 11. `app.json` contained a sample Expo Router `origin` value

- Status: Fixed
- Severity: High
- Fix: Removed the `https://evanbacon.dev/` sample origin from `app.json`.
- Remaining note: A real production native API origin still needs to be chosen before shipping API routes to production native builds.

### 12. Live crypto provider payloads were trusted without runtime validation

- Status: Fixed
- Severity: Medium
- Symptom: Listings, info, and ticker routes could return malformed live provider payloads directly to screens.
- Fix: `utils/cryptoValidators.ts` now validates the rendered CoinMarketCap fields and API routes fall back locally when live payloads are malformed.
- Verification: `utils/cryptoValidators.test.ts`, `__tests__/api/listings-api.test.ts`, `__tests__/api/info-api.test.ts`, and `__tests__/api/tickers-api.test.ts`.

### 13. Transfer tab was a placeholder instead of a reliable finance workflow

- Status: Fixed
- Severity: Low
- Symptom: The transfer tab was a minimal placeholder and did not provide a reliable, testable user workflow.
- Fix: Replaced it with `app/(authenticated)/(tabs)/activity.tsx`, which provides searchable/filterable transaction history, category labels, monthly income/spending/net totals, and a tested tab route.
- Verification: `__tests__/activity-tab-wiring.test.ts` and `Store/balance/transactionUtils.test.ts`.

### 14. Legacy persisted transactions lacked category metadata

- Status: Fixed
- Severity: Medium
- Symptom: Older persisted transactions only had `id`, `amount`, `title`, and `date`, so category-based Activity filters could render undefined categories.
- Fix: `Store/balance/transactionUtils.ts` infers categories and `Store/balance/balanceStore.ts` migrates persisted balance state to version `1`.
- Verification: `Store/balance/transactionUtils.test.ts`.

### 15. Several tabs were placeholders

- Status: Fixed
- Severity: Low
- Symptom: Invest and lifestyle screens are minimal placeholder views.
- Fix: Removed `app/(authenticated)/(tabs)/invest.tsx`, `app/(authenticated)/(tabs)/lifestyle.tsx`, and their tab registrations from `app/(authenticated)/(tabs)/_layout.tsx`.
- Verification: `__tests__/activity-tab-wiring.test.ts`.

## Remaining Issues Or Risk Areas

### 16. Relative `/api/...` fetches may need production origin planning

- Severity: High
- Symptom: Native screens call `fetch('/api/...')` for crypto data.
- Affected files: `app/(authenticated)/(tabs)/crypto.tsx`, `app/(authenticated)/crypto/[id].tsx`
- Current state: The sample origin was removed, but a production server origin still needs to be configured when the app has a real deployment host.
- Next step: Decide the production API host strategy before shipping native builds.

### 17. Historical fallback ticker data is BTC-specific

- Severity: Low
- Symptom: When CoinMarketCap quote requests are unavailable, `app/api/tickers+api.ts` still falls back to local BTC historical data.
- Affected files: `app/api/tickers+api.ts`, `app/(authenticated)/crypto/[id].tsx`
- Current state: Live selected-asset quotes are used when `CRYPTO_API_KEY` is configured and the upstream request succeeds. The fallback is intentionally local/offline-only.
- Next step: Add per-asset fallback fixtures if offline multi-asset chart accuracy becomes a product goal.

### 18. Root README is too generic to onboard future sessions

- Status: Fixed
- Severity: Low
- Symptom: `README.md` does not describe actual routes, data flow, or known issues.
- Fix: `README.md` now describes reliability-first product direction, reliability guarantees, known limits, verification commands, and project references.
