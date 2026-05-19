# Fintech Clone React Native

Expo Router app pivoting into a crypto market simulator.

The current repo is intentionally minimal: auth, crypto market data, crypto detail screens, Cloudflare Worker crypto APIs, shared crypto validators, and tests. Old fintech-clone features such as Home balance, Activity ledger, fake money actions, transaction sync, lock/passcode, and static widgets were removed to keep the codebase easy to manipulate before the simulator is built.

## Product Direction

The next product goal is a crypto time-machine simulator:

- choose a crypto asset
- choose a historical buy date
- enter an investment amount or quantity
- compare historical value against current value
- later show purchasing-power comparisons for assets by region

## Current Feature State

- Auth routes exist for signup, login, help, and phone verification through Clerk.
- The only current signed-in tab is Crypto.
- Crypto calls the Cloudflare Worker backend configured through `EXPO_PUBLIC_API_BASE_URL`.
- Crypto list/detail screens show market data, data source/freshness copy, retry states, and chart/detail views.

## Monorepo Layout

- `apps/frontend`: Expo Router mobile app, React Native UI, assets, crypto screens, and frontend tests.
- `apps/backend`: Cloudflare Worker API for crypto data.
- `packages/shared`: shared crypto response contracts and runtime validators.
- `docs`: project references, architecture decisions, product strategy, and implementation plans.

## Current Guarantees

- Crypto list and detail screens use EUR formatting for EUR quote data.
- Crypto API routes prefer live CoinMarketCap data when the Worker has `CRYPTO_API_KEY`, then fall back to Cloudflare KV data.
- Crypto API routes validate provider payloads before rendering or falling back.
- API-backed crypto screens expose source, freshness, loading, retry, and error states.
- The codebase no longer contains transaction snapshot storage, balance state, fake exchange/money actions, or passcode lock behavior.

## Known Limits

- Historical crypto simulation is not implemented yet.
- The app is not connected to real bank accounts.
- No real trading, transfer, or exchange behavior exists.
- Crypto fallback ticker history is limited when live quote data is unavailable.
- Native builds require `EXPO_PUBLIC_API_BASE_URL` to point at the deployed Worker.

## Cloud Backend

The crypto Worker is deployed at:

```text
https://fintech-reliability-api.shubhkapadia2031.workers.dev
```

Local development should set:

```bash
EXPO_PUBLIC_API_BASE_URL=https://fintech-reliability-api.shubhkapadia2031.workers.dev
```

Configured bindings:

```text
CRYPTO_FALLBACKS production: 63a5d0553e734abebbfa23745ceac413
CRYPTO_FALLBACKS preview: 1f22e8b24b014c4dacb027bfba0373b2
```

Worker commands:

```bash
npm run backend:typecheck
npx wrangler deploy --dry-run --config apps/backend/wrangler.jsonc
npx wrangler deploy --config apps/backend/wrangler.jsonc
```

## Tech Stack

- Expo Router
- React Native
- Clerk
- React Query
- Cloudflare Worker/KV
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

Start the Worker locally:

```bash
npm run backend:dev
```

Run verification:

```bash
./node_modules/.bin/jest --runInBand --watchman=false
./node_modules/.bin/tsc --noEmit
```

The repo path contains `Web:Apps`, and `:` can break npm/npx PATH resolution. Prefer direct local binaries for verification.

## Project References

- Durable project context: [docs/project-reference/README.md](docs/project-reference/README.md)
- Current cleanup spec: [docs/superpowers/specs/2026-05-19-product-cleanup-for-crypto-simulator-pivot.md](docs/superpowers/specs/2026-05-19-product-cleanup-for-crypto-simulator-pivot.md)
- Current cleanup plan: [docs/superpowers/plans/2026-05-19-product-cleanup-for-crypto-simulator-pivot.md](docs/superpowers/plans/2026-05-19-product-cleanup-for-crypto-simulator-pivot.md)
- Architecture decisions: [docs/architecture/decisions](docs/architecture/decisions)
