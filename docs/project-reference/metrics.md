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
- `crypto.simulation.started`
  - Records when a signed-in user begins the create-simulation flow.
  - Event mode metadata includes selected asset, event id, and reaction delay.
- `crypto.simulation.completed`
  - Records when a completed simulation result renders.
  - Metadata should include selected asset, historical date resolution, and current price cache status.
  - Event mode metadata includes selected asset, event id, reaction delay, and result status.
- `crypto.simulation.failed`
  - Records validation or unavailable outcomes in the simulation flow.
  - Metadata should include selected asset when known and the error/unavailable code.
- `crypto.simulation.saved`
  - Records a successful Saved Simulation creation.
  - Metadata should include selected asset and historical date resolution.

### Purchasing Power

- `crypto.client.purchasing_power.fetch`
  - Measures the mobile request to the cloud `/api/purchasing-power/comparisons` endpoint.
  - Metadata should include selected city.
- `crypto.api.purchasing_power.compute`
  - Records Worker-side purchasing-power comparison calculation.
  - Metadata should include city, amount bucket, monthly essentials count, and big purchase count.

### Crypto Client Fetches

- `crypto.client.simulation_assets.fetch`
  - Measures the mobile request to the cloud `/api/simulation/assets` endpoint.
- `crypto.client.simulation_prices.fetch`
  - Measures the mobile request to the cloud `/api/simulation/prices` endpoint.
- `crypto.client.simulation_history.fetch`
  - Measures the mobile request to the cloud `/api/simulation/history` endpoint that powers the year chart explorer.
- `crypto.client.simulation_events.fetch`
  - Measures the mobile request to the cloud `/api/simulation/events` endpoint that powers sourced event cards.
  - Metadata includes selected asset.
- `crypto.client.simulation_event_scenarios.fetch`
  - Measures the mobile request to the cloud `/api/simulation/event-scenarios` endpoint that powers event-based outcomes and risk journeys.
  - Metadata includes event id and selected reaction delay.
- `crypto.client.listings.fetch`
  - Measures the Crypto tab request to the cloud `/api/listings` endpoint.
- `crypto.client.info.fetch`
  - Measures the Crypto tab metadata request to the cloud `/api/info` endpoint.
- `crypto.client.detail_info.fetch`
  - Measures the crypto detail screen metadata request to the cloud `/api/info` endpoint.
- `crypto.client.tickers.fetch`
  - Measures the crypto detail screen chart request to the cloud `/api/tickers` endpoint.

### Crypto API Routes

- `crypto.api.simulation_assets.catalog`
  - Records Simulation asset catalog readiness counts and market cache status.
- `crypto.api.simulation_prices.historical_d1`
  - Measures D1 historical price lookup for Simulation.
- `crypto.api.simulation_prices.current_coingecko`
  - Measures CoinGecko Simple Price refresh for Simulation current USD prices.
- `crypto.api.simulation_prices.current_cache`
  - Records current-price cache use for Simulation.
- `crypto.api.simulation_prices.compute`
  - Measures Worker-side Simulation result calculation.
- `crypto.api.simulation_events.list`
  - Records Worker-side event catalog reads from D1.
  - Metadata includes selected asset and active event count.
- `crypto.api.simulation_event_scenarios.compute`
  - Measures Worker-side event scenario calculation.
  - Metadata includes selected asset, event id, reaction delay, date resolution, and historical point count.
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
