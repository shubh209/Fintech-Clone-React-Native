# Troubleshooting

## Crypto API Requests

If crypto screens fail to load:

1. Verify `EXPO_PUBLIC_API_BASE_URL` points at the Cloudflare Worker.
2. Inspect `apps/backend/src/crypto/cryptoRoutes.ts`, `apps/backend/src/crypto/cryptoService.ts`, and `apps/backend/src/crypto/coinMarketCapClient.ts`.
3. Confirm whether Worker `CRYPTO_API_KEY` is configured. Listings, info, and selected-asset ticker quotes use live CoinMarketCap data only when the key is present and the upstream request succeeds.
4. Check `packages/shared/src/cryptoValidators.ts` if live API calls succeed but fallback data appears; malformed live payloads intentionally fall back to KV data.
5. Confirm `CRYPTO_FALLBACKS` KV contains `crypto:listings`, `crypto:info`, and `crypto:tickers` JSON values for cloud fallback behavior.

If the crypto detail screen reports a hook-order error:

1. Check `apps/frontend/app/(authenticated)/crypto/[id].tsx`.
2. Hooks such as `useAnimatedProps()` must stay above loading/error early returns.
3. Run `npx jest --runTestsByPath apps/frontend/__tests__/crypto-detail-hooks.test.ts --runInBand --watchman=false`.

If the crypto chart renders oddly:

1. Check `apps/frontend/utils/tickers.ts`.
2. API ticker timestamps should be normalized to numbers before reaching `CartesianChart`.
3. Live ticker quote responses may contain only one point; the detail screen should show the live quote panel instead of forcing a line chart when there is not enough history.
4. Run `npx jest --runTestsByPath apps/frontend/utils/tickers.test.ts --runInBand --watchman=false`.

## Metrics

If a metric is missing:

1. Check the event catalog in `docs/project-reference/metrics.md`.
2. Confirm the feature path uses `recordMetric()`, `timeSync()`, or `timeAsync()` from `apps/frontend/utils/metrics.ts`.
3. Run the app and watch for `[metric]` entries in the Metro/native logs.
4. In tests, use `clearMetrics()` before the action and `getMetricsSnapshot()` after the action.

If an API latency number looks high:

1. Compare client fetch events such as `crypto.client.listings.fetch` with API route upstream events such as `crypto.api.listings.upstream`.
2. If both are high, the provider or network is likely slow.
3. If only the client fetch is high, inspect app/runtime routing overhead.
4. If fallback events appear often, inspect API keys, upstream status codes, and network reliability.

## Zustand Plus MMKV Persistence

If persisted transactions behave strangely:

1. Inspect `apps/frontend/Store/balance/balanceStore.ts` and `apps/frontend/Store/storage/mmkv-storage.ts`.
2. Check `apps/frontend/Store/balance/transactionUtils.ts` for date normalization, display formatting, and newest-first sorting.
3. Persisted transaction dates should be ISO strings, not `Date` objects.
4. The MMKV adapter should return raw strings because Zustand's `createJSONStorage()` owns JSON parsing and stringifying.
5. Legacy double-encoded persisted strings are unwrapped by `apps/frontend/Store/storage/mmkv-storage.ts`.

If the red screen says `Failed to create a new MMKV instance`:

1. This usually means React Native is running in a remote debugger or another environment where MMKV cannot access on-device JSI.
2. `apps/frontend/Store/storage/mmkv-storage.ts` now falls back to in-memory storage when MMKV creation fails, so Home actions such as `Add Money` should not crash.
3. `apps/frontend/context/userInactivityStorage.ts` applies the same fallback for inactivity lock timing.
4. In-memory fallback data is temporary and only lasts for the current JS runtime session.
5. For true persisted behavior, test on-device or with an on-device debugger rather than a remote Chrome debugger.

## Clerk Auth

If auth breaks:

1. Verify `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` in the environment.
2. Check auth redirect logic in `apps/frontend/app/_layout.tsx`.
3. Re-test phone auth flows through `login`, `signup`, and `verify/[phone]`.

## Navigation And Product Surface

If a screen appears missing:

- Confirm whether it is one of the placeholder tabs before treating it as a regression.
- Check whether the route exists but has only presentation scaffolding.
- Transfer was intentionally replaced by Activity.
- Invest and Lifestyle were intentionally removed instead of kept as placeholder tabs.
- The current primary tabs are Home, Activity, and Crypto.

If Activity filters look wrong:

1. Check `apps/frontend/Store/balance/transactionUtils.ts`.
2. Confirm legacy transactions were migrated through balance store version `1`.
3. Run `npx jest --runTestsByPath apps/frontend/Store/balance/transactionUtils.test.ts apps/frontend/__tests__/activity-tab-wiring.test.ts --runInBand --watchman=false`.

## Verification Commands

Run these after changing storage, cloud crypto API routes, or formatting helpers:

```bash
npx jest --runInBand --watchman=false
npx tsc --noEmit
node -e "JSON.parse(require('fs').readFileSync('app.json','utf8')); console.log('app.json valid')"
```

For MMKV fallback-specific checks:

```bash
npx jest --runTestsByPath apps/frontend/Store/storage/mmkv-storage.test.ts apps/frontend/context/userInactivityStorage.test.ts --runInBand --watchman=false
```

For metrics-specific changes:

```bash
npx jest --runTestsByPath apps/frontend/utils/metrics.test.ts apps/backend/__tests__/api/listings-api.test.ts apps/backend/__tests__/api/info-api.test.ts apps/backend/__tests__/api/tickers-api.test.ts --runInBand --watchman=false
```

For API trust and validator changes:

```bash
npx jest --runTestsByPath apps/frontend/utils/apiResult.test.ts apps/frontend/utils/cryptoValidators.test.ts apps/backend/__tests__/api/listings-api.test.ts apps/backend/__tests__/api/info-api.test.ts apps/backend/__tests__/api/tickers-api.test.ts apps/frontend/__tests__/crypto-list-api-wiring.test.ts apps/frontend/__tests__/crypto-detail-api-wiring.test.ts --runInBand --watchman=false
```

Watchman can fail under local sandbox permissions, so prefer `--watchman=false` for Jest in this workspace.

## Manual Test Steps

1. Start the app with `npm start`.
2. Sign in or use the existing authenticated flow.
3. On Home, tap `Add Money` several times.
4. Restart or reload the app and confirm transactions still render without date errors.
5. Confirm the newest transactions appear first.
6. Open the Crypto tab and confirm prices show EUR formatting such as `€93,478.44`.
7. Run with `EXPO_PUBLIC_API_BASE_URL` pointed at the Worker and confirm crypto listings render.
8. Run the Worker without `CRYPTO_API_KEY` and confirm crypto listings render from `CRYPTO_FALLBACKS` KV data.
9. Run the Worker with `CRYPTO_API_KEY` and confirm listings/info/tickers routes return live CoinMarketCap data.
10. Open multiple crypto detail screens and confirm each detail view requests `/api/tickers?id=<asset-id>` through the Worker.
11. Watch logs for `[metric]` entries while using Home, Crypto, auth, and lock flows.
