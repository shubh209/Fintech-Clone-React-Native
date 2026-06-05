# Crypto Simulator X-Factor Demo

## Goal

Show a complete full-stack flow where a signed-in user runs a historical crypto simulation, chooses a city, and sees what the result means in everyday spending terms.

## Setup

```bash
EXPO_PUBLIC_API_BASE_URL=https://fintech-reliability-api.shubhkapadia2031.workers.dev npm start
```

For local Worker testing:

```bash
npm run backend:dev
```

## Primary Demo Flow

1. Open the Simulation tab.
2. Confirm the Asset catalog panel shows ready and unavailable counts.
3. Select `BTC`.
4. Select year `2021`.
5. Drag the chart to `2021-01-01` or enter `2021-01-01` in the Buy date field.
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
curl 'http://127.0.0.1:8787/api/simulation/prices?asset=BTC&date=2021-01-01&amountUsd=500'
```

Expected:

- Purchasing-power response includes Phoenix monthly essentials and big purchases.
- Asset catalog response includes ready and unavailable asset groups.
- Simulation price response includes historical price, current price, gain/loss, source metadata, and cache status.

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
- Added GitHub Actions CI/CD quality gates, backend metric events, and 32+ Jest test files to protect the simulator flow from regressions across mobile screens, Worker APIs, shared contracts, and data validation.
