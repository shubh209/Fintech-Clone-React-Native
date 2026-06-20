# Crypto Simulator X-Factor Demo

## Goal

Show a complete full-stack flow where a signed-in user runs a historical crypto simulation, chooses a city, and sees what the result means in everyday spending terms.

## Setup

```bash
EXPO_PUBLIC_API_BASE_URL=https://fintech-reliability-api.shubhkapadia2031.workers.dev npm start
```

For local Worker testing:

```bash
/Users/shubhkapadia/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node \
  ../../node_modules/wrangler/bin/wrangler.js dev --port 8787
```

Run the command from `apps/backend`. The direct bundled Node command avoids local shells that still resolve to Node 20, while Wrangler 4 requires Node 22 or newer.

## Primary Demo Flow

1. Open the Simulation tab.
2. Confirm the Asset catalog panel shows ready and unavailable counts.
3. Select `BTC`.
4. Select year `2021`.
5. Drag the chart or enter an early supported Buy date such as BTC `2014-09-17`, ETH `2017-11-09`, or SOL `2020-04-10`.
6. Enter `$500`.
7. Run the simulation.
8. In Purchasing power, choose `Phoenix`.
9. Show Monthly essentials and Big purchases.
10. Switch to `San Francisco`, `New York`, `Austin`, and `Seattle` to show city-level cost differences.
11. Save the simulation and confirm it appears under Saved simulations.

## Manual API Checks

```bash
curl 'http://127.0.0.1:8787/api/purchasing-power/comparisons?city=phoenix&amountUsd=2500'
curl 'http://127.0.0.1:8787/api/simulation/assets'
curl 'http://127.0.0.1:8787/api/simulation/prices?asset=BTC&date=2014-09-17&amountUsd=500'
```

Expected:

- Purchasing-power response includes Phoenix monthly essentials and big purchases.
- Purchasing-power response works with local static data.
- Asset catalog response includes ready and unavailable asset groups when the local or remote D1 binding has simulation asset data.
- Asset catalog response includes data-quality metadata for repaired rows, quarantined rows, eligible rows, and quarantine rate.
- Simulation price response includes historical price, current price, gain/loss, source metadata, cache status, and next-available date metadata when the requested source date is missing or quarantined.

## Verification

```bash
./node_modules/.bin/jest --runInBand --watchman=false
./node_modules/.bin/tsc --noEmit
```

## Screenshots To Capture

- Simulation screen before running a scenario, with the asset catalog visible.
- Completed BTC simulation result.
- Purchasing power comparisons for Phoenix.
- City selector after switching to New York or San Francisco.
- Saved simulation row.

## Resume Bullet Candidates

- Built a React Native and Cloudflare Worker crypto simulator that translates historical crypto gains into monthly essentials and big purchases across 5 US cities, helping non-technical users understand market outcomes through everyday costs.
- Implemented TypeScript REST APIs, shared runtime validators, and curated city-cost data for purchasing-power comparisons, adding 7 deterministic comparison items per city across 5 city markets.
- Added GitHub Actions CI/CD quality gates, backend metric events, and 34 Jest test files to protect the simulator flow from regressions across mobile screens, Worker APIs, shared contracts, and data validation.
