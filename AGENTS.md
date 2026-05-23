# AGENTS.md

## Start Here

This repository is an Expo Router app being pivoted into a crypto market simulator with Clerk auth and a Cloudflare Worker backend for crypto data.

Before making changes:

1. Read `docs/project-reference/README.md`.
2. Read `docs/project-reference/issues.md`.
3. Check `app.json`, `.env`, and `apps/frontend/app/_layout.tsx` for environment assumptions.
4. Treat `apps/backend/`, shared crypto/simulation contracts, auth routes, crypto screens, and simulation screens as high-risk areas.
5. Read `docs/project-reference/measurement-skill.md` before any code change that adds or changes functionality.

## High-Risk Areas

- `apps/backend/src/domains/crypto-market/cryptoService.ts`
- `apps/backend/src/domains/crypto-market/coinMarketCapClient.ts`
- `apps/backend/src/domains/crypto-market/cloudFallbackStore.ts`
- `apps/backend/src/domains/simulation/`
- `packages/shared/src/cryptoValidators.ts`
- `packages/shared/src/simulationTypes.ts`
- `packages/shared/src/simulationValidators.ts`
- `apps/frontend/app/(authenticated)/(tabs)/crypto.tsx`
- `apps/frontend/app/(authenticated)/(tabs)/simulation.tsx`
- `apps/frontend/app/(authenticated)/crypto/[id].tsx`
- `apps/frontend/src/features/simulation/screens/simulationScreen.tsx`
- `apps/frontend/app/_layout.tsx`

## Project Notes

- The product direction is crypto market simulation: historical buy date, historical price, current value, and later purchasing-power comparisons.
- Use `docs/superpowers/specs/2026-05-21-crypto-simulation-mvp.md`, `docs/superpowers/specs/2026-05-22-simulation-price-api.md`, and `docs/superpowers/plans/2026-05-22-crypto-simulation-mvp-implementation.md` for current Simulation context.
- The monorepo separates product code into `apps/frontend`, `apps/backend`, and `packages/shared`.
- Current signed-in tabs are Simulation and Crypto.
- Home, Activity, transaction storage, lock/passcode, fake widgets, and transaction Worker routes were removed for a minimal simulator foundation.
- Mobile crypto screens call `EXPO_PUBLIC_API_BASE_URL`; do not reintroduce mobile-owned `apps/frontend/app/api` crypto handlers.
- Mobile Simulation calls `GET /api/simulation/prices` and `GET /api/simulation/history` through `EXPO_PUBLIC_API_BASE_URL`.
- Simulation v1 supports BTC, ETH, and SOL, uses a chart-driven historical date selector, computes hypothetical current value, and saves local Saved Simulation snapshots.
- Python owns offline historical CSV ingestion; TypeScript stays runtime-only for Worker/shared/frontend simulation behavior.
- The deployed Worker URL is `https://fintech-reliability-api.shubhkapadia2031.workers.dev`.
- Cloudflare `CRYPTO_FALLBACKS` KV is configured with production namespace `63a5d0553e734abebbfa23745ceac413` and preview namespace `1f22e8b24b014c4dacb027bfba0373b2`.
- The Cloudflare Worker uses live CoinMarketCap data when `CRYPTO_API_KEY` is configured, then falls back to `CRYPTO_FALLBACKS` KV data.
- Crypto detail chart hooks must stay above loading/error early returns.
- Metrics are centralized in `apps/frontend/src/shared/metrics/metrics.ts`; event names are cataloged in `docs/project-reference/metrics.md`.
- Every functionality change must define a measurable customer-impact signal and report before/after impact or newly added measurement coverage. Use `docs/project-reference/measurement-skill.md`.
- Use `./node_modules/.bin/jest --runInBand --watchman=false` and `./node_modules/.bin/tsc --noEmit` because the repo path contains `:` and npm/npx PATH resolution can fail.

## Agent skills

### Issue tracker

Issues and planning tasks are tracked as local markdown files in this repo for now. See `docs/agents/issue-tracker.md`.

### Triage labels

Use the default local triage vocabulary: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, and `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Use a single-context domain layout based on the crypto simulator project-reference docs and ADRs in `docs/architecture/decisions`. See `docs/agents/domain.md`.


<claude-mem-context>
# Memory Context

# [Fintech-Clone-React-Native] recent context, 2026-05-23 10:59am MST

No previous sessions found.
</claude-mem-context>
