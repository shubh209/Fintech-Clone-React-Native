# Crypto Market Simulator

## Tagline

Full-stack mobile crypto simulator that lets signed-in users compare hypothetical historical Bitcoin, Ethereum, and Solana investments against current market prices using a React Native frontend, shared TypeScript contracts, and a Cloudflare Worker API backed by D1 historical data.

## Tech Stack (Languages / Frameworks / Infrastructure / Tools)

TypeScript, JavaScript, Python, React Native, Expo Router, React Query, Clerk, Hono, Cloudflare Workers, Cloudflare D1, Cloudflare KV, REST API, SQL, CoinGecko API, CoinMarketCap API, Jest, TypeScript compiler, Git, Wrangler, Victory Native, React Native Skia, Expo Secure Store.

## Problem

The original app contained broad fintech-clone surfaces that looked polished but did not prove a focused engineering outcome: fake balances, placeholder actions, transaction screens, and mobile-owned crypto handlers made the product harder to explain and less credible for users. The new goal was to turn the codebase into a narrower crypto market simulator where a user can select a historical buy date, enter a USD amount, see what that investment would be worth today, and understand which data sources powered the result.

## Solution

I rebuilt the product around a signed-in Simulation and Crypto experience. The frontend uses Expo Router and React Native feature modules for auth, simulation, and crypto market browsing. The backend uses a Cloudflare Worker with Hono REST endpoints for simulation assets, historical chart data, computed simulation prices, crypto listings, metadata, and ticker quotes. Shared TypeScript validators define the API contract between mobile and backend so malformed provider responses are rejected before they reach the UI.

Historical prices are normalized offline with a Python CSV ingestion script and loaded into Cloudflare D1. Runtime requests stay in TypeScript: the Worker reads historical prices from D1, refreshes current prices through CoinGecko, caches current prices for 60 seconds, records telemetry events, and returns Data Trust metadata such as requested date, resolved date, source provider, cache status, and fallback state.

## My Role

I owned the full-stack product pivot from a generic fintech clone into a crypto simulation system. I removed unrelated transaction, Activity, Home, passcode, fake-widget, and mobile-owned API surfaces; designed the Worker-backed simulation API; implemented shared validation contracts; built the React Native simulation workflow; added local saved simulations; wired Cloudflare D1, KV fallback data, and provider clients; and created Jest coverage across backend routes, shared validators, frontend API wiring, simulation storage, and screen behavior.

## Impact (bullet points with concrete metrics — numbers, percentages, scale)

- Built a TypeScript REST API on Cloudflare Workers with Hono, SQL-backed D1 lookups, and shared runtime validators for the mobile crypto simulator, letting signed-in users run BTC, ETH, and SOL investment scenarios while keeping third-party API secrets off the phone, reducing mobile secret exposure by 100% [ESTIMATE].
- Normalized Python CSV ingestion into Cloudflare D1 by validating price rows, missing-date gaps, and asset metadata for the simulator's historical data source, loading 120,740 rows across 88 valid crypto assets so users could see what a past crypto purchase would be worth today.
- Implemented React Native, Expo Router, and React Query screens with drag-to-select charts, city selection, source labels, and saved results in the signed-in mobile experience, turning the product from 0 simulator workflows into 1 complete crypto time-machine workflow [ESTIMATE].
- Added a purchasing-power comparison API and mobile UI with curated monthly essentials and big-purchase data for Phoenix, San Francisco, New York, Austin, and Seattle, translating crypto results into 35 real-world cost comparisons users can understand quickly.
- Improved Cloudflare Worker reliability with KV fallback data, provider response validation, 60-second CoinGecko price caching, backend metric events, and GitHub Actions CI/CD checks, helping users see clear loading, retry, fallback, or unavailable states instead of confusing stale or broken crypto prices.
- Expanded regression confidence with 34 repo-owned Jest test files across mobile screens, backend REST API routes, shared TypeScript validators, saved simulations, metrics, app structure, and purchasing-power data, helping prevent old fake banking features from returning while protecting the new simulator flow.

## How It Works

The app is split into three main layers: `apps/frontend`, `apps/backend`, and `packages/shared`. The frontend is an Expo Router React Native app with Clerk phone auth and a signed-in tab shell containing Simulation and Crypto. Product UI lives under feature folders, while route files stay thin so navigation does not own business logic. React Query manages mobile API fetches, and Expo Secure Store persists saved hypothetical simulations locally.

The backend is a Cloudflare Worker using Hono routes. Crypto market endpoints call CoinMarketCap for listings, asset metadata, and selected-asset quote data, then validate provider payloads before returning data. If live provider data is unavailable or malformed, the Worker reads controlled fallback data from Cloudflare KV. Simulation endpoints are separate: `/api/simulation/assets` returns the imported asset catalog, `/api/simulation/history` returns yearly historical chart points, and `/api/simulation/prices` computes hypothetical current value from historical and current USD prices.

The data pipeline separates offline ingestion from runtime serving. Python owns CSV normalization, validation, coverage reporting, and D1 import SQL generation because the historical dataset is file-heavy and tabular. TypeScript owns runtime behavior because the Worker, shared contracts, and mobile app all need the same request and response semantics. This tradeoff keeps bulk data processing out of the mobile/backend request path while keeping user-facing API behavior type-checked and testable.

For a simulation request, the mobile app sends asset, buy date, and USD amount to the Worker. The Worker validates the request, resolves the nearest usable historical date from D1, fetches or reuses cached CoinGecko current prices, computes implied quantity, current value, gain/loss dollars, and gain/loss percentage, then returns the result with source and cache metadata. The UI renders success, validation error, unavailable, loading, retry, and saved-state paths so users can tell whether a result came from live market data, curated historical data, or fallback behavior.

After a successful simulation, the app calls a purchasing-power endpoint with the selected city and simulated current value. The Worker compares that value against a versioned, curated dataset for five cities and returns monthly essentials plus big purchases. This keeps the demo understandable for recruiters and users: the app does not only show percentages, it shows what the result could cover in rent, groceries, transportation, laptops, travel, and car down payments.

## Keywords

TypeScript, JavaScript, Python, React Native, React.js, Node.js, REST API, RESTful API, SQL, Cloud, Cloudflare Workers, Cloudflare D1, Cloudflare KV, Back End, Front End, Full Stack, API Integration, Data Validation, Runtime Validation, Distributed Systems, Serverless, Mobile Development, Authentication, Clerk, Caching, Observability, Telemetry, Jest, Unit Testing, Integration Testing, CI/CD, DevOps, Git, Agile, Cross-Functional, Large Scale, Data Pipeline, Market Data, Reliability, Error Handling.
