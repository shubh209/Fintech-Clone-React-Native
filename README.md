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
- Primary signed-in tabs are Home, Activity, and Crypto.
- Home tracks balance and transactions through the Cloudflare Worker, with Zustand plus MMKV as the local cache/fallback.
- Activity provides searchable/filterable transaction history, editable category labels including custom names, and monthly totals.
- Activity uses the same cloud-backed transaction snapshot as Home.
- Crypto calls the Cloudflare Worker backend configured through `EXPO_PUBLIC_API_BASE_URL`.

## Monorepo Layout

- `apps/frontend`: Expo Router mobile app, frontend state, UI, assets, and frontend tests.
- `apps/backend`: Cloudflare Worker API for crypto data.
- `packages/shared`: shared response contracts and runtime validators used across app boundaries.
- `docs`: project references, architecture decisions, product strategy, and implementation plans.

## Reliability Guarantees

- Persisted transaction dates are normalized to ISO strings.
- Persisted transaction categories are inferred and legacy transactions are backfilled during store migration.
- Home and Activity hydrate transaction snapshots from `/api/transactions` after Clerk sign-in.
- Transaction mutations update the UI optimistically, then sync the normalized snapshot to the Worker.
- Transaction API requests now send Clerk bearer tokens, and the Worker derives the transaction owner from the verified JWT `sub`.
- Home and Activity expose the transaction sync state: awaiting sync, syncing, cloud synced, offline cache, or sync issue.
- Transaction cloud load/save/fallback paths emit local metric events so sync latency and cache recovery can be compared over time.
- Transaction sorting uses copies and does not mutate store arrays during render.
- MMKV storage falls back to memory when native JSI storage is unavailable and remains the transaction cache/fallback.
- Crypto list and detail screens use EUR formatting for EUR quote data.
- Crypto API routes prefer live CoinMarketCap data when the Worker has `CRYPTO_API_KEY`, then fall back to Cloudflare KV data.
- Crypto API routes validate provider payloads before rendering or falling back.
- API-backed crypto screens expose source, freshness, loading, retry, and error states.
- High-risk storage and crypto behavior has Jest coverage.

## Known Limits

- The app is not connected to real bank accounts.
- Money movement is simulated and must not be presented as real transfer behavior.
- Crypto fallback ticker history is BTC-specific when live quote data is unavailable.
- Signed-in transaction hydration should still be manually smoke-tested in the Expo app after auth-sensitive Worker changes because shell smoke tests cannot mint a real Clerk mobile session token.
- Native builds require `EXPO_PUBLIC_API_BASE_URL` to point at the deployed Worker.
- AI guidance is planned as educational assistance only, not investment, legal, or tax advice.

## Cloud Backend

The crypto Worker is deployed at:

```text
https://fintech-reliability-api.shubhkapadia2031.workers.dev
```

Local development should set:

```bash
EXPO_PUBLIC_API_BASE_URL=https://fintech-reliability-api.shubhkapadia2031.workers.dev
```

Worker transaction auth uses these configured public Clerk values:

```text
CLERK_JWT_ISSUER=https://close-sheepdog-18.clerk.accounts.dev
CLERK_JWKS_URL=https://close-sheepdog-18.clerk.accounts.dev/.well-known/jwks.json
```

Transaction KV namespaces:

```text
TRANSACTIONS production: 5a601879101e4182833601d8f41a3f4f
TRANSACTIONS preview: fd639ee79a424fa695612c630b55c2f1
```

Worker transaction auth uses these configured public Clerk values:

```text
CLERK_JWT_ISSUER=https://close-sheepdog-18.clerk.accounts.dev
CLERK_JWKS_URL=https://close-sheepdog-18.clerk.accounts.dev/.well-known/jwks.json
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

Start the Worker locally:

```bash
npm run backend:dev
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
