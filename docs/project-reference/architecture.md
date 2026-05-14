# Architecture

## Routing

- `app/index.tsx` is the landing route.
- `app/login.tsx`, `app/signup.tsx`, `app/help.tsx`, and `app/verify/[phone].tsx` are public auth flows.
- `app/(authenticated)/(tabs)` contains the main signed-in tab shell.
- `app/(authenticated)/(modals)` contains lock and account modal flows.
- `app/(authenticated)/crypto/[id].tsx` is the crypto detail screen.

## State And Persistence

- Clerk auth state is provided from `app/_layout.tsx`.
- React Query is initialized globally in `app/_layout.tsx`.
- Transaction state is held in `Store/balance/balanceStore.ts`.
- The balance store persists through MMKV via `Store/storage/mmkv-storage.ts`.
- Transaction normalization and display helpers live in `Store/balance/transactionUtils.ts`.
- Inactivity lock timing uses `context/userInactivityStorage.ts`.
- Zustand and inactivity storage fall back to in-memory storage when MMKV cannot create an on-device JSI instance.

## Crypto Data Flow

- `app/(authenticated)/(tabs)/crypto.tsx` fetches listings and logo/info metadata.
- `app/(authenticated)/crypto/[id].tsx` fetches detail metadata and chart ticker data, then normalizes ticker timestamps through `utils/tickers.ts`.
- The fetch targets are local API routes:
  - `app/api/listings+api.ts`
  - `app/api/info+api.ts`
  - `app/api/tickers+api.ts`
- Listings and info routes use live CoinMarketCap responses when the upstream request succeeds and fall back to static local data.
- The ticker route currently returns static local BTC historical data immediately to keep the detail chart fast and stable.

## Metrics

- Metrics helpers live in `utils/metrics.ts`.
- The current metrics sink is local: in-memory buffer plus dev console output.
- Use `timeAsync()` for latency-sensitive async work and `recordMetric()` for immediate state transitions.
- The event catalog lives in `docs/project-reference/metrics.md`.
- Major instrumented surfaces include auth, lock/unlock, inactivity lock, home transactions, crypto client fetches, and crypto API upstream/fallback paths.

## Test Coverage Added

- `Store/balance/transactionUtils.test.ts`
- `Store/storage/mmkv-storage.test.ts`
- `context/userInactivityStorage.test.ts`
- `utils/currency.test.ts`
- `utils/metrics.test.ts`
- `utils/tickers.test.ts`
- `__tests__/crypto-detail-hooks.test.ts`
- `__tests__/api/listings-api.test.ts`
- `__tests__/api/info-api.test.ts`
- `__tests__/api/tickers-api.test.ts`

## Structural Notes

- The repo mixes `Components/`, `Store/`, and `app/` casing styles.
- The root README does not fully reflect the actual route map or runtime architecture.
- Some product areas are presentation-only and not backed by business logic yet.
