# Crypto Market Simulator

## Tagline

Mobile crypto simulator for people who want to understand past crypto choices, market events, risk, and everyday purchasing power before putting real money at stake.

## Tech Stack (Languages / Frameworks / Infrastructure / Tools)

TypeScript, JavaScript, Python, React Native, Expo Router, React Query, Clerk, Hono, Cloudflare Workers, Cloudflare D1, Cloudflare KV, REST API, SQL, CoinGecko API, CoinMarketCap API, Jest, TypeScript compiler, Wrangler, Victory Native, React Native Skia, Expo Secure Store, Git, GitHub Actions, CI/CD, DevOps.

## Problem

Crypto is hard to learn from raw charts. A new investor can see a price line go up or down, but that does not answer the question they actually care about: what would this have meant for me? The information is usually split across chart sites, news articles, calculators, and cost of living references. That makes it hard for a beginner to connect a past buy date, a major market event, the risk they would have lived through, and the real world value of the result.

## Solution

I built a signed in mobile simulator where a user can choose a crypto asset, pick a historical buy date or market event, enter a hypothetical dollar amount, and see what that decision would be worth today. The result is not just a gain or loss number. The app also shows risk, source metadata, buying delays after news events, and city based purchasing power so the user can connect the result to rent, groceries, transportation, travel, and large purchases.

The product is educational. It does not connect bank accounts, store real holdings, move money, or give trading advice. I removed the old fintech clone screens that made the app look broader than it was: fake balances, Activity, fake money actions, passcode locks, static widgets, transaction storage, and mobile owned crypto API handlers. The app now focuses on two signed in tabs: Simulation and Crypto.

## My Role

I built this as a solo project with AI assistance. I made the product decisions, chose the tradeoffs, and used AI to pressure test the plan and speed up implementation. My work covered the React Native app, the Cloudflare Worker APIs, shared TypeScript contracts, Clerk auth wiring, historical price lookup, event scenario logic, risk calculations, local saved simulations, purchasing power comparisons, CoinGecko and CoinMarketCap integrations, Cloudflare D1 and KV setup, Python data cleanup, and regression tests.

I also handled the pivot from a broad fintech clone into a focused crypto education app. That meant removing features that looked real but did not create trust, then writing enough project reference material so future work stays pointed at the simulator instead of drifting back into fake banking surfaces.

## Impact

- Full Stack: Built a cross platform mobile app with TypeScript, React Native, REST API, SQL, and Cloudflare Workers that enabled users to explore historical crypto investment scenarios with city based purchasing power comparisons for over 100 crypto assets.
- Full Stack: Created a historical market data cleanup workflow with Python, Git, CI/CD, and DevOps that filtered unreliable records before data reached simulations so the company did not lose users' trust.
- Full Stack: Built event driven simulation workflows with JavaScript, React Query, Market Data, and Jest across the mobile Simulation screen so beginner investors could connect major news with crypto decisions, creating a stronger reason to revisit the app.
- Backend: Built crypto valuation services with Python, SQL, Cloudflare D1, and historical analytics across price lookup, current value calculations, and city based purchasing power so users could see what an old crypto decision would mean for rent, groceries, and daily life today.
- Backend: Built event scenario workflows with TypeScript, Hono, REST API, Cloudflare Workers, Cloudflare KV, and Jest through delayed buy dates, verified event sources, and risk checks so users could understand whether buying after major headlines would have helped or hurt them financially.
- Expanded historical simulation data from 120,740 to 176,348 imported D1 rows by removing the fixed 2021 start date and using the full available CSV history for each asset.
- Cleaned 100 static crypto datasets with Python, same row OHLC repairs, row quarantine, and readiness rules, leaving 84 assets ready for education focused simulations.
- Exposed Data Trust metadata for 6 repaired rows, 789 quarantined rows, and nearest date resolution, so invalid or missing source rows do not silently shape user results.
- Added BTC, ETH, and SOL simulation coverage from their earliest available CSV dates: BTC from `2014-09-17`, ETH from `2017-11-09`, and SOL from `2020-04-10`.
- Added event mode with 15 sourced BTC, ETH, and SOL market events and 30 source records, giving users a way to test buying after major news instead of guessing from headlines.
- Added 4 event risk measures: max drawdown, longest time below the starting value, best 30 day return, and worst 30 day return.
- Built 10 Worker endpoints for health checks, market listings, metadata, ticker quotes, simulation assets, simulation history, simulation prices, simulation events, event scenarios, and purchasing power comparisons.
- Added a 60 second current price cache and 24 hour stale market fallback behavior so demos and learning flows can still produce clear states when live providers fail.
- Added 39 focused Jest test files across Worker routes, shared validators, frontend API wiring, simulation screens, saved simulations, metrics, cache behavior, repositories, risk analytics, and product cleanup regressions.
- Added purchasing power comparisons for 5 US cities and two spending categories, turning raw crypto returns into rent, grocery, travel, and purchase context.
- Replaced broad fake fintech behavior with a focused simulator story [ESTIMATE], making the project easier for recruiters, reviewers, and users to understand.

## How It Works

The repo has three main parts: `apps/frontend`, `apps/backend`, and `packages/shared`. The frontend is an Expo Router React Native app. Clerk handles account access, React Query handles API state, Victory Native and React Native Skia power the chart interaction, and Expo Secure Store saves hypothetical simulations on the phone. Route files stay thin. Product work lives under feature folders for auth, crypto market browsing, simulation, purchasing power, shared UI, and local metrics.

The backend is a Cloudflare Worker with Hono routes. The Crypto tab calls Worker endpoints for listings, metadata, and quotes. Those routes call CoinMarketCap, validate the response shape, and fall back to controlled KV data when live data is missing or malformed. The mobile app never owns the market data secrets.

Simulation is separate from general market browsing. `/api/simulation/assets` returns ready and unavailable assets with data quality and market metadata. `/api/simulation/history` returns yearly chart points. `/api/simulation/prices` validates the asset, date, and amount, resolves a historical price from D1, gets the current USD price, and returns the implied quantity, current value, gain or loss, source metadata, and cache state.

Event simulations use D1 event and source rows. The Worker applies the selected delay, resolves the nearest valid historical price date, calculates current value, and computes the risk measures from daily historical prices. The frontend shows the event feed, selected scenario result, source count, reaction delay, and risk journey without duplicating the business logic on the phone.

The historical data pipeline runs offline in Python. It normalizes CSV files, repairs only deterministic same row OHLC issues, quarantines rows that should not reach users, scores asset readiness, and generates D1 import output. TypeScript owns runtime behavior in the Worker, shared contracts, and mobile app. That split keeps heavy file cleanup out of request time while keeping the user facing API checked and testable.

The first runnable simulator experience stays focused on BTC, ETH, and SOL. The broader asset catalog and data pipeline cover the top 100 crypto datasets, but the app keeps the live flow narrow so the demo remains understandable and trustworthy before expanding simulation coverage.

## Keywords

TypeScript, JavaScript, Python, React Native, Expo Router, Mobile Development, Full Stack Engineering, Backend Engineering, Frontend Engineering, Cloudflare Workers, Serverless, Cloudflare D1, Cloudflare KV, REST API, SQL, Data Pipeline, Historical Analytics, Runtime Validation, API Integration, Caching, Fallback Systems, Observability, Telemetry, Authentication, Clerk, React Query, Jest, Unit Testing, Integration Testing, CI/CD, Git, GitHub Actions, DevOps, Market Data, Financial Technology, Fintech, Data Reliability, Error Handling, Product Engineering.
