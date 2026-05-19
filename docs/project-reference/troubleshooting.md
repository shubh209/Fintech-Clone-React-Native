# Troubleshooting

## Crypto API Requests

If crypto screens fail to load:

1. Verify `EXPO_PUBLIC_API_BASE_URL` points at the Cloudflare Worker.
2. Inspect `apps/backend/src/domains/crypto-market/cryptoRoutes.ts`, `apps/backend/src/domains/crypto-market/cryptoService.ts`, and `apps/backend/src/domains/crypto-market/coinMarketCapClient.ts`.
3. Confirm whether Worker `CRYPTO_API_KEY` is configured. Listings, info, and selected-asset ticker quotes use live CoinMarketCap data only when the key is present and the upstream request succeeds.
4. Check `packages/shared/src/cryptoValidators.ts` if live API calls succeed but fallback data appears; malformed live payloads intentionally fall back to KV data.
5. Confirm `CRYPTO_FALLBACKS` KV contains `crypto:listings`, `crypto:info`, and `crypto:tickers` JSON values for cloud fallback behavior.

If the crypto detail screen reports a hook-order error:

1. Check `apps/frontend/src/features/crypto-market/screens/cryptoAssetDetailScreen.tsx`.
2. Hooks such as `useAnimatedProps()` must stay above loading/error early returns.
3. Run `./node_modules/.bin/jest --runTestsByPath apps/frontend/src/features/crypto-market/screens/cryptoAssetDetailHooks.test.ts --runInBand --watchman=false`.

If the crypto chart renders oddly:

1. Check `apps/frontend/src/features/crypto-market/chart/normalizeTickerPoints.ts`.
2. API ticker timestamps should be normalized to numbers before reaching `CartesianChart`.
3. Live ticker quote responses may contain only one point; the detail screen should show the live quote panel instead of forcing a line chart when there is not enough history.
4. Run `./node_modules/.bin/jest --runTestsByPath apps/frontend/src/features/crypto-market/chart/normalizeTickerPoints.test.ts --runInBand --watchman=false`.

## Metrics

If a metric is missing:

1. Check the event catalog in `docs/project-reference/metrics.md`.
2. Confirm the feature path uses `recordMetric()`, `timeSync()`, or `timeAsync()` from `apps/frontend/src/shared/metrics/metrics.ts`.
3. Run the app and watch for `[metric]` entries in the Metro/native logs.
4. In tests, use `clearMetrics()` before the action and `getMetricsSnapshot()` after the action.

If an API latency number looks high:

1. Compare client fetch events such as `crypto.client.listings.fetch` with API route upstream events such as `crypto.api.listings.upstream`.
2. If both are high, the provider or network is likely slow.
3. If only the client fetch is high, inspect app/runtime routing overhead.
4. If fallback events appear often, inspect API keys, upstream status codes, and network reliability.

## Clerk Auth

If auth breaks:

1. Verify `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` in the environment.
2. Check auth redirect logic in `apps/frontend/src/features/auth/routing/useAuthRedirects.ts`.
3. Re-test phone auth flows through `login`, `signup`, and `verify/[phone]`.

## Navigation And Product Surface

If a screen appears missing:

- Confirm whether it was intentionally removed during the crypto simulator cleanup.
- Current signed-in tab shell only registers `crypto`.
- Removed routes include Home, Activity, lock/passcode, transaction store screens, widgets, and fake banking actions.

## Verification Commands

Run these after changing crypto API routes, crypto screens, auth routing, or formatting helpers:

```bash
./node_modules/.bin/jest --runInBand --watchman=false
./node_modules/.bin/tsc --noEmit
node -e "JSON.parse(require('fs').readFileSync('app.json','utf8')); console.log('app.json valid')"
```

For API trust and validator changes:

```bash
./node_modules/.bin/jest --runTestsByPath apps/frontend/src/shared/api/apiResult.test.ts apps/frontend/src/shared/api/cryptoValidators.test.ts apps/backend/__tests__/api/listings-api.test.ts apps/backend/__tests__/api/info-api.test.ts apps/backend/__tests__/api/tickers-api.test.ts apps/frontend/src/features/crypto-market/api/cryptoListApiWiring.test.ts apps/frontend/src/features/crypto-market/api/cryptoDetailApiWiring.test.ts --runInBand --watchman=false
```

Use direct local binaries because the repo path contains `Web:Apps`, and `:` can break npm/npx PATH resolution.

## Manual Test Steps

1. Start the app with `npm start`.
2. Sign in or use the existing authenticated flow.
3. Confirm signed-in users land on the Crypto tab.
4. Open the Crypto tab and confirm prices show EUR formatting such as `€93,478.44`.
5. Run with `EXPO_PUBLIC_API_BASE_URL` pointed at the Worker and confirm crypto listings render.
6. Run the Worker without `CRYPTO_API_KEY` and confirm crypto listings render from `CRYPTO_FALLBACKS` KV data.
7. Run the Worker with `CRYPTO_API_KEY` and confirm listings/info/tickers routes return live CoinMarketCap data.
8. Open multiple crypto detail screens and confirm each detail view requests `/api/tickers?id=<asset-id>` through the Worker.
9. Watch logs for `[metric]` entries while using Crypto and auth flows.
