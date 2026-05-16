# Project Overview

## Summary

`Fintech-Clone-React-Native` is an Expo Router React Native app that imitates a consumer fintech experience with phone-based auth, a home dashboard, transaction state, and crypto market screens.

The product direction is reliability-first: fewer credible finance workflows, explicit data freshness and fallback states, strong persistence behavior, and responsible AI guidance only after the core is trustworthy.

## Current Feature State

- Public auth routes exist for signup, login, help, and phone verification.
- Authenticated tabs exist for home, activity, and crypto.
- Home, activity, and crypto have meaningful implementations.
- Invest and lifestyle were removed from the primary navigation rather than preserved as placeholders.

## Key Libraries

- `expo` and `expo-router`
- `@clerk/clerk-expo`
- `zustand`
- `react-native-mmkv`
- `@tanstack/react-query`
- `victory-native`

## Important Constraints

- `docs/product-strategy/reliable-finance-app-roadmap.md` is the guiding roadmap.
- `docs/superpowers/plans/2026-05-14-reliability-first-phase-1.md` is the current implementation plan for reliability scaffolding.
- `docs/architecture/decisions/` records product and data-trust architecture decisions.
- Crypto data is served by the Cloudflare Worker in `apps/api`; mobile screens call `EXPO_PUBLIC_API_BASE_URL`.
- Listings and info endpoints use live CoinMarketCap data when the Worker has `CRYPTO_API_KEY` configured and fall back to `CRYPTO_FALLBACKS` KV data otherwise.
- Detail ticker quotes use live selected-asset CoinMarketCap latest quote data when configured and fall back to `CRYPTO_FALLBACKS` KV data otherwise.
- Crypto API responses are validated before live data is rendered; malformed live responses fall back to local data.
- Transaction persistence stores date values as ISO strings and formats them at render time.
- Transaction categories are inferred and legacy persisted transactions are backfilled during store migration.
- Activity category labels can be corrected with custom names that are normalized and stored on the transaction.
- The root README now explains reliability guarantees, known limits, and project references.
