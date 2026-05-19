# Backend

Cloudflare Worker API code lives here.

- `src/index.ts`: Worker entrypoint
- `src/domains/crypto-market/cryptoRoutes.ts`: HTTP routes
- `src/domains/crypto-market/cryptoService.ts`: live-provider and fallback orchestration
- `src/domains/crypto-market/coinMarketCapClient.ts`: CoinMarketCap provider calls
- `src/domains/crypto-market/cloudFallbackStore.ts`: Cloudflare KV fallback reads

Shared response contracts and validators live in `packages/shared`.

## Deployment

Production Worker:

```text
https://fintech-reliability-api.shubhkapadia2031.workers.dev
```

Configured bindings:

- `CRYPTO_FALLBACKS` production KV namespace: `63a5d0553e734abebbfa23745ceac413`
- `CRYPTO_FALLBACKS` preview KV namespace: `1f22e8b24b014c4dacb027bfba0373b2`
- `CLERK_JWT_ISSUER`: `https://close-sheepdog-18.clerk.accounts.dev`
- `CLERK_JWKS_URL`: `https://close-sheepdog-18.clerk.accounts.dev/.well-known/jwks.json`
- `CRYPTO_API_KEY` Worker secret

The Worker is deployed at:

```text
URL: https://fintech-reliability-api.shubhkapadia2031.workers.dev
```

Live smoke checks should cover `/health`, `/api/listings?limit=1`, `/api/info`, and `/api/tickers`.

Seed files were created outside the repo at:

```text
/Users/shubhkapadia/Desktop/fintech-kv
```

Useful commands:

```bash
npm run backend:typecheck
npx wrangler deploy --dry-run --config apps/backend/wrangler.jsonc
npx wrangler deploy --config apps/backend/wrangler.jsonc
```
