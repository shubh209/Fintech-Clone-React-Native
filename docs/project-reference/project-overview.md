# Project Overview

## Summary

`Fintech-Clone-React-Native` is being pivoted into a crypto market simulator.

The old fintech-clone surfaces were removed so the codebase can stay minimal while the new product direction is designed. The current app keeps auth, crypto market browsing, crypto detail data, Simulation v1, the Cloudflare crypto/simulation API, shared runtime validators, and local metrics.

## Current Feature State

- Public auth routes exist for signup, login, help, and phone verification.
- The signed-in app currently has two primary tabs: Simulation and Crypto.
- The Simulation tab lets a signed-in user choose BTC, ETH, or SOL, explore yearly historical USD prices on a press-and-drag chart, enter a hypothetical USD amount, run a current-value simulation, and save the result locally.
- Crypto list and detail screens fetch market data through the Cloudflare Worker.
- Home, Activity, fake money actions, transaction persistence, lock/passcode, widgets, and transaction backend routes were removed during the crypto simulator pivot cleanup.

## Repository Layout

- `apps/frontend` contains the Expo Router app, React Native UI, assets, crypto screens, and frontend tests.
- `apps/backend` contains the Cloudflare Worker API for crypto market data and simulation data.
- `packages/shared` contains shared API metadata helpers plus crypto and simulation runtime validators.

## Key Libraries

- `expo` and `expo-router`
- `@clerk/clerk-expo`
- `@tanstack/react-query`
- `victory-native`
- `@shopify/react-native-skia`

## Important Constraints

- The current product direction is crypto simulation: historical buy date, historical price, quantity/value today, saved hypothetical results, and later purchasing-power comparisons.
- Crypto data is served by the Cloudflare Worker in `apps/backend`; mobile screens call `EXPO_PUBLIC_API_BASE_URL`.
- The deployed crypto Worker is `https://fintech-reliability-api.shubhkapadia2031.workers.dev`.
- `CRYPTO_FALLBACKS` KV is configured for production and preview fallback data.
- Listings and info endpoints use live CoinMarketCap data when the Worker has `CRYPTO_API_KEY` configured and fall back to `CRYPTO_FALLBACKS` KV data otherwise.
- Detail ticker quotes use live selected-asset CoinMarketCap latest quote data when configured and fall back to `CRYPTO_FALLBACKS` KV data otherwise.
- Crypto API responses are validated before live data is rendered; malformed live responses fall back to KV data.
- Simulation prices are served by `GET /api/simulation/prices`; yearly chart data is served by `GET /api/simulation/history`.
- Runtime simulation data uses D1 binding `HISTORICAL_PRICES_DB` for historical prices and CoinGecko Simple Price for current USD prices.
- The repo intentionally no longer contains transaction snapshot storage, balance state, Activity ledger UI, or transaction Worker routes.
