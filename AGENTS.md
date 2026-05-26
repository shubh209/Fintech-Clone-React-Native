# AGENTS.md

This Expo Router app is now a crypto market simulator with Clerk auth, a React Native frontend, shared contracts, and a Cloudflare Worker backend.

Before changing code, read:
- `docs/project-reference/README.md`
- `docs/project-reference/issues.md`
- `docs/project-reference/measurement-skill.md`

High-risk areas:
- `apps/backend/src/domains/simulation/`
- `apps/backend/src/domains/crypto-market/`
- `packages/shared/src/*simulation*`
- `packages/shared/src/*crypto*`
- `apps/frontend/src/features/simulation/`
- `apps/frontend/app/(authenticated)/(tabs)/crypto.tsx`
- `apps/frontend/app/(authenticated)/crypto/[id].tsx`
- `apps/frontend/app/_layout.tsx`

Current product shape: signed-in users have Simulation and Crypto tabs. Simulation uses Worker endpoints `/api/simulation/assets`, `/api/simulation/prices`, and `/api/simulation/history`. Historical prices come from Python-generated CSV ingestion into D1; TypeScript owns runtime Worker/shared/frontend behavior. Asset catalog metadata covers 100 coins, split into ready/unavailable states, enriched with CoinGecko market data and cache fallback.

Do not reintroduce removed fintech-clone surfaces: Home, Activity, transaction storage/routes, lock/passcode, fake widgets, or mobile-owned `app/api` crypto handlers. Mobile screens call `EXPO_PUBLIC_API_BASE_URL`.

Deployed Worker: `https://fintech-reliability-api.shubhkapadia2031.workers.dev`.

Use `./node_modules/.bin/jest --runInBand --watchman=false` and `./node_modules/.bin/tsc --noEmit`; the repo path contains `:`.


<claude-mem-context>
# Memory Context

# [Fintech-Clone-React-Native] recent context, 2026-05-26 2:42pm MST

No previous sessions found.
</claude-mem-context>