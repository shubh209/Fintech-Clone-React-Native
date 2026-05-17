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
- `TRANSACTIONS` production KV namespace: `5a601879101e4182833601d8f41a3f4f`
- `TRANSACTIONS` preview KV namespace: `fd639ee79a424fa695612c630b55c2f1`
- `CLERK_JWT_ISSUER`: `https://close-sheepdog-18.clerk.accounts.dev`
- `CLERK_JWKS_URL`: `https://close-sheepdog-18.clerk.accounts.dev/.well-known/jwks.json`
- `CRYPTO_API_KEY` Worker secret

The Worker was deployed after the transaction auth/metrics/KV update:

```text
Version ID: 3515b9b4-e068-413c-9c95-f3b9db0baea7
URL: https://fintech-reliability-api.shubhkapadia2031.workers.dev
```

Live smoke checks passed for `/health`, `/api/listings?limit=1`, missing transaction bearer rejection, and malformed transaction bearer rejection. Signed-in transaction hydration still needs a manual Expo app check with a real Clerk session token.

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
