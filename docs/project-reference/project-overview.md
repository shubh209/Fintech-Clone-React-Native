# Project Overview

## Summary

`Fintech-Clone-React-Native` is an Expo Router React Native app that imitates a consumer fintech experience with phone-based auth, a home dashboard, transaction state, and crypto market screens.

## Current Feature State

- Public auth routes exist for signup, login, help, and phone verification.
- Authenticated tabs exist for home, invest, transfer, crypto, and lifestyle.
- Home and crypto have meaningful implementations.
- Invest, transfer, and lifestyle are currently placeholders.

## Key Libraries

- `expo` and `expo-router`
- `@clerk/clerk-expo`
- `zustand`
- `react-native-mmkv`
- `@tanstack/react-query`
- `victory-native`

## Important Constraints

- Crypto data currently depends on local `app/api/*+api.ts` handlers.
- Listings and info endpoints now use live CoinMarketCap data when `CRYPTO_API_KEY` is configured and fall back to local data otherwise.
- Historical ticker data is fetched from CoinPaprika when available and falls back to local/static data.
- Transaction persistence stores date values as ISO strings and formats them at render time.
- The README is generic, so these reference docs are a more reliable map of the project.
