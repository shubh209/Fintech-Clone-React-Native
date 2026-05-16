# Backend

Cloudflare Worker API code lives here.

- `src/index.ts`: Worker entrypoint
- `src/crypto/cryptoRoutes.ts`: HTTP routes
- `src/crypto/cryptoService.ts`: live-provider and fallback orchestration
- `src/crypto/coinMarketCapClient.ts`: CoinMarketCap provider calls
- `src/crypto/cloudFallbackStore.ts`: Cloudflare KV fallback reads
- `src/transactions/transactionRoutes.ts`: transaction snapshot HTTP routes
- `src/transactions/transactionAuth.ts`: Clerk JWT verification for transaction ownership
- `src/transactions/transactionStore.ts`: transaction snapshot KV reads/writes

Shared response contracts and validators live in `packages/shared`.

## Deployment

Production Worker:

```text
https://fintech-reliability-api.shubhkapadia2031.workers.dev
```

Configured bindings:

- `CRYPTO_FALLBACKS` production KV namespace: `63a5d0553e734abebbfa23745ceac413`
- `CRYPTO_FALLBACKS` preview KV namespace: `1f22e8b24b014c4dacb027bfba0373b2`
- `TRANSACTIONS` currently points at the same production and preview namespace IDs, using `transactions:<userId>` keys until a dedicated transaction namespace is provisioned.
- `CLERK_JWT_ISSUER`: `https://close-sheepdog-18.clerk.accounts.dev`
- `CLERK_JWKS_URL`: `https://close-sheepdog-18.clerk.accounts.dev/.well-known/jwks.json`
- `CRYPTO_API_KEY` Worker secret

Dedicated `TRANSACTIONS` namespace creation failed in this environment with Cloudflare API authentication error `10000`; keep the prefixed-key binding until account permissions allow namespace creation.

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
