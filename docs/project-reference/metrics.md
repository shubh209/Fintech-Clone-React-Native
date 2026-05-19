# Metrics Reference

This project uses a small local metrics layer in `apps/frontend/src/shared/metrics/metrics.ts`.

The current sink is intentionally simple:

- metric events are stored in an in-memory buffer for inspection during a session
- metric events are logged to the dev console outside Jest
- no external analytics provider is required yet

## Event Shape

Each event has:

- `name`: stable event identifier
- `durationMs`: measured latency or `0` for immediate events
- `status`: `success` or `error`
- `timestamp`: event creation time
- `metadata`: optional small key-value context

## Helpers

- `recordMetric(event)`: use for immediate events, counters, or state transitions.
- `timeSync(name, fn, metadata)`: use for synchronous app work.
- `timeAsync(name, fn, metadata)`: use for API calls, auth flows, and other async work.
- `getMetricsSnapshot()`: inspect buffered metrics in tests or debugging.
- `clearMetrics()`: reset the local buffer.

## Current Event Catalog

### Future Simulator

- `crypto.simulation.create`
  - Reserved for future simulator creation work.
  - Metadata should include selected asset and simulation inputs once implemented.

### Crypto Client Fetches

- `crypto.client.listings.fetch`
  - Measures the Crypto tab request to the cloud `/api/listings` endpoint.
- `crypto.client.info.fetch`
  - Measures the Crypto tab metadata request to the cloud `/api/info` endpoint.
- `crypto.client.detail_info.fetch`
  - Measures the crypto detail screen metadata request to the cloud `/api/info` endpoint.
- `crypto.client.tickers.fetch`
  - Measures the crypto detail screen chart request to the cloud `/api/tickers` endpoint.

### Crypto API Routes

- `crypto.api.listings.upstream`
  - Measures the server route call to CoinMarketCap listings.
- `crypto.api.listings.fallback`
  - Records Cloudflare KV listings fallback use.
- `crypto.api.info.upstream`
  - Measures the server route call to CoinMarketCap metadata.
- `crypto.api.info.fallback`
  - Records Cloudflare KV metadata fallback use.
- `crypto.api.tickers.upstream`
  - Measures the server route call to CoinMarketCap latest quote data for the selected asset.
- `crypto.api.tickers.fallback`
  - Records Cloudflare KV ticker fallback use when live latest quote data is unavailable.

### Auth

- `auth.sign_in.phone.prepare`
  - Measures sign-in phone factor creation and preparation.
- `auth.sign_up.phone.prepare`
  - Measures sign-up creation and phone verification preparation.
- `auth.sign_in.phone.verify`
  - Measures sign-in phone code verification.
- `auth.sign_up.phone.verify`
  - Measures sign-up phone code verification.

## How To Use Metrics While Developing

1. Run the app with `npm start`.
2. Exercise the feature you are measuring.
3. Watch Metro/native logs for `[metric]` entries.
4. Compare `durationMs` before and after optimization work.
5. For API routes, compare both client fetch events and upstream API route events to separate app/network overhead from provider latency.

## Testing Commands

```bash
./node_modules/.bin/jest --runTestsByPath apps/frontend/src/shared/metrics/metrics.test.ts apps/backend/__tests__/api/listings-api.test.ts apps/backend/__tests__/api/info-api.test.ts apps/backend/__tests__/api/tickers-api.test.ts --runInBand --watchman=false
./node_modules/.bin/jest --runInBand --watchman=false
./node_modules/.bin/tsc --noEmit
```
