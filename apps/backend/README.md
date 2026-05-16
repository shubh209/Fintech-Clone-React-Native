# Backend

Cloudflare Worker API code lives here.

- `src/index.ts`: Worker entrypoint
- `src/crypto/cryptoRoutes.ts`: HTTP routes
- `src/crypto/cryptoService.ts`: live-provider and fallback orchestration
- `src/crypto/coinMarketCapClient.ts`: CoinMarketCap provider calls
- `src/crypto/cloudFallbackStore.ts`: Cloudflare KV fallback reads

Shared response contracts and validators live in `packages/shared`.

## Deployment

Production Worker:

```text
https://fintech-reliability-api.shubhkapadia2031.workers.dev
```

Configured bindings:

- `CRYPTO_FALLBACKS` production KV namespace: `63a5d0553e734abebbfa23745ceac413`
- `CRYPTO_FALLBACKS` preview KV namespace: `1f22e8b24b014c4dacb027bfba0373b2`
- `CRYPTO_API_KEY` Worker secret

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
