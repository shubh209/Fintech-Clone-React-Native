# Frontend

Expo Router mobile app code lives here.

- `app/`: Expo Router route wrappers, tabs, and modals
- `src/features/auth/`: Clerk-backed auth screens, token cache, and redirect routing helpers
- `src/features/crypto-market/`: crypto market list/detail screens and API client helpers
- `src/shared/`: shared frontend UI, theme, formatting, metrics, and API helpers
- `assets/`: fonts, images, and videos used by the Expo app

The root `app.json` points Expo Router at `apps/frontend/app` through `extra.router.root`.

Crypto screens call the Cloudflare Worker through `EXPO_PUBLIC_API_BASE_URL`.
For local development, point it at:

```text
https://fintech-reliability-api.shubhkapadia2031.workers.dev
```
