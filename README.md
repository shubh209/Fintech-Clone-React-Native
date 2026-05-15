# Fintech Clone React Native

An Expo Router finance app focused on reliability over feature count.

The goal is to show production-minded engineering in a consumer finance context: correct persisted state, explicit API failure handling, visible data freshness, privacy-aware product thinking, and tests around high-risk behavior.

## Product Direction

This project is being reshaped from a broad fintech clone into a small, credible financial command center.

Primary goals:

- reliable account and transaction state
- live market data with source, freshness, fallback, and retry states
- useful spending and goal workflows before adding more tabs
- responsible AI guidance later, with visible inputs and privacy controls
- documentation that explains what is real, mocked, reliable, and still risky

Read [the product roadmap](docs/product-strategy/reliable-finance-app-roadmap.md) before planning new product work.

## Current Feature State

- Auth routes exist for signup, login, help, and phone verification through Clerk.
- Home tracks balance and transactions through Zustand plus MMKV persistence.
- Activity provides searchable/filterable transaction history, editable category labels including custom names, and monthly totals.
- Crypto uses local Expo Router API handlers that call CoinMarketCap when configured and fall back to local data.
- Invest and lifestyle are placeholders and should not be presented as complete product features.

## Reliability Guarantees

- Persisted transaction dates are normalized to ISO strings.
- Persisted transaction categories are inferred and legacy transactions are backfilled during store migration.
- Transaction sorting uses copies and does not mutate store arrays during render.
- MMKV storage falls back to memory when native JSI storage is unavailable.
- Crypto list and detail screens use EUR formatting for EUR quote data.
- Crypto API routes prefer live CoinMarketCap data when `CRYPTO_API_KEY` is configured, then fall back locally.
- Crypto API routes validate provider payloads before rendering or falling back.
- API-backed crypto screens expose source, freshness, loading, retry, and error states.
- High-risk storage and crypto behavior has Jest coverage.

## Known Limits

- The app is not connected to real bank accounts.
- Money movement is simulated and must not be presented as real transfer behavior.
- Crypto fallback ticker history is BTC-specific when live quote data is unavailable.
- Native production builds still need a real API origin strategy for `/api/...` routes.
- AI guidance is planned as educational assistance only, not investment, legal, or tax advice.

## Tech Stack

- Expo Router
- React Native
- Clerk
- Zustand
- React Native MMKV
- React Query
- CoinMarketCap API
- Jest and TypeScript

## Development

Install dependencies:

```bash
npm install
```

Start Expo:

```bash
npm start
```

Run verification:

```bash
npx jest --runInBand --watchman=false
npx tsc --noEmit
```

Watchman can fail under local sandbox permissions, so this repo prefers `--watchman=false` for Jest.

## Project References

- Durable project context: [docs/project-reference/README.md](docs/project-reference/README.md)
- Product roadmap: [docs/product-strategy/reliable-finance-app-roadmap.md](docs/product-strategy/reliable-finance-app-roadmap.md)
- Current reliability plan: [docs/superpowers/plans/2026-05-14-reliability-first-phase-1.md](docs/superpowers/plans/2026-05-14-reliability-first-phase-1.md)
- Architecture decisions: [docs/architecture/decisions](docs/architecture/decisions)
