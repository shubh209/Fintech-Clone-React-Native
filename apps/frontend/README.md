# Frontend

Expo Router mobile app code lives here.

- `app/`: routes, tabs, modals, and screens
- `Components/`: reusable React Native UI
- `utils/`: frontend helpers and client-side API utilities
- `assets/`: fonts, images, and videos used by the Expo app

The root `app.json` points Expo Router at `apps/frontend/app` through `extra.router.root`.

Crypto screens call the Cloudflare Worker through `EXPO_PUBLIC_API_BASE_URL`.
For local development, point it at:

```text
https://fintech-reliability-api.shubhkapadia2031.workers.dev
```
