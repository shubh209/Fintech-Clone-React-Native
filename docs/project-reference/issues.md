# Issues Ledger

## Resolved In High-Confidence Stabilization Pass

### 1. Persisted transaction dates can rehydrate as strings

- Status: Fixed
- Severity: High
- Fix: `apps/frontend/Store/balance/balanceStore.ts` now normalizes incoming transaction dates to ISO strings through `apps/frontend/Store/balance/transactionUtils.ts`.
- Verification: `apps/frontend/Store/balance/transactionUtils.test.ts` covers date normalization and display formatting.

### 2. Transactions are mutated during render

- Status: Fixed
- Severity: Medium
- Fix: `apps/frontend/app/(authenticated)/(tabs)/home.tsx` renders `getTransactionsNewestFirst(transactions)`, which returns a sorted copy.
- Verification: `apps/frontend/Store/balance/transactionUtils.test.ts` verifies the original array is not mutated.

### 3. Crypto screens show EUR prices with dollar labels

- Status: Fixed for the crypto list
- Severity: Low
- Fix: `apps/frontend/app/(authenticated)/(tabs)/crypto.tsx` now formats `quote.EUR.price` with `formatEuroPrice()`.
- Verification: `apps/frontend/utils/currency.test.ts` covers EUR formatting.

### 4. Listings/info API routes ignored live success responses

- Status: Fixed for listings and info
- Severity: Medium
- Fix: Cloud crypto services now return live CoinMarketCap data when Worker `CRYPTO_API_KEY` is configured and the upstream response succeeds. They fall back to `CRYPTO_FALLBACKS` KV data when no key is present or the request fails.
- Affected files: `apps/backend/src/crypto/cryptoService.ts`, `apps/backend/src/crypto/coinMarketCapClient.ts`
- Verification: `apps/backend/__tests__/api/listings-api.test.ts` and `apps/backend/__tests__/api/info-api.test.ts`.

### 5. Custom Zustand MMKV storage duplicated JSON responsibilities

- Status: Fixed
- Severity: Medium
- Fix: `apps/frontend/Store/storage/mmkv-storage.ts` now stores and returns raw strings, leaving JSON serialization to Zustand's `createJSONStorage()`.
- Migration note: The adapter also unwraps legacy double-encoded persisted strings created by the old adapter.
- Debugger fallback: If MMKV cannot create a native JSI instance, the adapter falls back to in-memory storage instead of crashing.
- Verification: `apps/frontend/Store/storage/mmkv-storage.test.ts`.

### 6. Inactivity lock MMKV storage could crash in remote debugger environments

- Status: Fixed
- Severity: Medium
- Fix: `apps/frontend/context/UserInactivity.tsx` now uses `apps/frontend/context/userInactivityStorage.ts`, which falls back to in-memory storage if MMKV cannot be created.
- Verification: `apps/frontend/context/userInactivityStorage.test.ts`.

### 7. Crypto detail screen rendered more hooks after loading completed

- Status: Fixed
- Severity: High
- Symptom: React reported `Rendered more hooks than during the previous render` on `apps/frontend/app/(authenticated)/crypto/[id].tsx`.
- Cause: `useAnimatedProps()` hooks were declared after loading/error early returns, so they were skipped on the first render and added after data loaded.
- Fix: Animated hooks now run before any conditional return.
- Verification: `apps/frontend/__tests__/crypto-detail-hooks.test.ts`.

### 8. Crypto chart received unnormalized ticker timestamps

- Status: Fixed
- Severity: Medium
- Symptom: Ticker API data contains timestamp strings, while the chart screen treated timestamps as numbers.
- Fix: `apps/frontend/utils/tickers.ts` normalizes API ticker points to `{ timestamp: number, price: number }` before chart rendering.
- Verification: `apps/frontend/utils/tickers.test.ts`.

### 9. Crypto detail tickers waited on an unreliable CoinPaprika historical request

- Status: Fixed
- Severity: Medium
- Symptom: `/api/tickers` could spend hundreds of milliseconds waiting on CoinPaprika and then fall back to local data anyway.
- Fix: The cloud service reads `CRYPTO_FALLBACKS` KV immediately when no live API key is configured.
- Verification: `apps/backend/__tests__/api/tickers-api.test.ts`.

### 10. Crypto detail prices were BTC-specific/static

- Status: Fixed
- Severity: Medium
- Symptom: The old mobile-owned ticker API returned BTC fallback data regardless of the selected crypto asset, so detail prices could be stale or wrong for non-BTC assets.
- Fix: `/api/tickers?id=<coinMarketCapId>` now uses CoinMarketCap `quotes/latest` from the Worker when `CRYPTO_API_KEY` is configured, returns the selected asset's latest EUR quote, and falls back to cloud KV data only when live data is unavailable.
- Verification: `apps/backend/__tests__/api/tickers-api.test.ts`, `apps/frontend/__tests__/crypto-detail-api-wiring.test.ts`, and `apps/frontend/utils/tickers.test.ts`.

### 11. `app.json` contained a sample Expo Router `origin` value

- Status: Fixed
- Severity: High
- Fix: Removed the `https://evanbacon.dev/` sample origin from `app.json`.
- Remaining note: A real production native API origin still needs to be chosen before shipping API routes to production native builds.

### 12. Live crypto provider payloads were trusted without runtime validation

- Status: Fixed
- Severity: Medium
- Symptom: Listings, info, and ticker routes could return malformed live provider payloads directly to screens.
- Fix: `packages/shared/src/cryptoValidators.ts` now validates the rendered CoinMarketCap fields and cloud API routes fall back to KV data when live payloads are malformed.
- Verification: `apps/frontend/utils/cryptoValidators.test.ts`, `apps/backend/__tests__/api/listings-api.test.ts`, `apps/backend/__tests__/api/info-api.test.ts`, and `apps/backend/__tests__/api/tickers-api.test.ts`.

### 13. Transfer tab was a placeholder instead of a reliable finance workflow

- Status: Fixed
- Severity: Low
- Symptom: The transfer tab was a minimal placeholder and did not provide a reliable, testable user workflow.
- Fix: Replaced it with `apps/frontend/app/(authenticated)/(tabs)/activity.tsx`, which provides searchable/filterable transaction history, category labels, monthly income/spending/net totals, and a tested tab route.
- Verification: `apps/frontend/__tests__/activity-tab-wiring.test.ts` and `apps/frontend/Store/balance/transactionUtils.test.ts`.

### 14. Legacy persisted transactions lacked category metadata

- Status: Fixed
- Severity: Medium
- Symptom: Older persisted transactions only had `id`, `amount`, `title`, and `date`, so category-based Activity filters could render undefined categories.
- Fix: `apps/frontend/Store/balance/transactionUtils.ts` infers categories and `apps/frontend/Store/balance/balanceStore.ts` migrates persisted balance state to version `1`.
- Verification: `apps/frontend/Store/balance/transactionUtils.test.ts`.

### 15. Several tabs were placeholders

- Status: Fixed
- Severity: Low
- Symptom: Invest and lifestyle screens are minimal placeholder views.
- Fix: Removed `apps/frontend/app/(authenticated)/(tabs)/invest.tsx`, `apps/frontend/app/(authenticated)/(tabs)/lifestyle.tsx`, and their tab registrations from `apps/frontend/app/(authenticated)/(tabs)/_layout.tsx`.
- Verification: `apps/frontend/__tests__/activity-tab-wiring.test.ts`.

## Remaining Issues Or Risk Areas

### 16. Relative `/api/...` fetches may need production origin planning

- Status: Fixed for crypto
- Severity: High
- Symptom: Native screens called `fetch('/api/...')` for crypto data.
- Fix: Crypto screens now build cloud URLs with `apps/frontend/utils/cryptoApiClient.ts` and `EXPO_PUBLIC_API_BASE_URL`.
- Verification: `apps/frontend/__tests__/cloud-backend-wiring.test.ts`, `apps/frontend/__tests__/crypto-list-api-wiring.test.ts`, and `apps/frontend/__tests__/crypto-detail-api-wiring.test.ts`.

### 17. Historical fallback ticker data is BTC-specific

- Severity: Low
- Symptom: When CoinMarketCap quote requests are unavailable, the ticker fallback can still be BTC-specific if `CRYPTO_FALLBACKS` KV is seeded with BTC-only history.
- Affected files: `apps/backend/src/crypto/cloudFallbackStore.ts`, Cloudflare KV data.
- Current state: Live selected-asset quotes are used when Worker `CRYPTO_API_KEY` is configured and the upstream request succeeds. The fallback is cloud-owned KV data.
- Next step: Seed per-asset fallback values in KV if offline multi-asset chart accuracy becomes a product goal.

### 18. Root README is too generic to onboard future sessions

- Status: Fixed
- Severity: Low
- Symptom: `README.md` does not describe actual routes, data flow, or known issues.
- Fix: `README.md` now describes reliability-first product direction, reliability guarantees, known limits, verification commands, and project references.

### 19. Activity and balance data are still local-first

- Status: Partially fixed
- Severity: High
- Symptom: Home and Activity transaction state still persists through frontend MMKV, so the app is not yet cloud-first for user finance data.
- Affected files: `apps/frontend/Store/balance/balanceStore.ts`, `apps/frontend/utils/transactionRepository.ts`, `apps/backend/src/transactions/transactionRoutes.ts`, `apps/backend/src/transactions/transactionStore.ts`, `packages/shared/src/transactionContracts.ts`.
- Current state: Home and Activity hydrate from `/api/transactions` after Clerk sign-in. Mutations remain optimistic in the Zustand store and sync the normalized transaction snapshot to the Worker. MMKV is retained as a cache/fallback through `transactions-cache` and the persisted balance state.
- Production tradeoff: `TRANSACTIONS` is currently bound to the existing KV namespace IDs with separate `transactions:<userId>` keys because the available Cloudflare API token could list KV namespaces but could not create a dedicated transaction namespace.
- Next step: Provision a dedicated `TRANSACTIONS` KV namespace, replace the shared namespace IDs in `apps/backend/wrangler.jsonc`, and add backend-side Clerk JWT verification instead of trusting the client-provided user key.
