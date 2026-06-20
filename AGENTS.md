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

# claude-mem status

This project has no memory yet. The current session will seed it; subsequent sessions will receive auto-injected context for relevant past work.

Memory injection starts on your second session in a project.

`/learn-codebase` is available if the user wants to front-load the entire repo into memory in a single pass (~5 minutes on a typical repo, optional). Otherwise memory builds passively as work happens.

Live activity: http://localhost:37777
How it works: `/how-it-works`

This message disappears once the first observation lands.
</claude-mem-context>