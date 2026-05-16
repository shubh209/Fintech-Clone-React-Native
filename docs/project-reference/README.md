# Project Reference

This folder is the durable context hub for `Fintech-Clone-React-Native`.

## Read In This Order

1. `project-overview.md`
2. `architecture.md`
3. `issues.md`
4. `troubleshooting.md`
5. `metrics.md`
6. `session-checklist.md`
7. `SKILLS.md`

## Purpose

These docs are meant to let future sessions recover context quickly without re-auditing the whole repo.

## Latest Stabilization Notes

The high-confidence stabilization pass fixed the Zustand/MMKV storage adapter contract, persisted transaction date handling, in-render transaction mutation, EUR crypto list formatting, live CoinMarketCap response usage for listings/info/ticker routes, and the sample Expo Router `origin` value in `app.json`.

The project now uses an explicit monorepo layout:

- `apps/frontend` for the Expo Router mobile app
- `apps/backend` for the Cloudflare Worker crypto API
- `packages/shared` for shared contracts and runtime validators

The crypto Worker is deployed at `https://fintech-reliability-api.shubhkapadia2031.workers.dev` with `CRYPTO_API_KEY` stored as a Worker secret and `CRYPTO_FALLBACKS` KV seeded for listings, info, and ticker fallback data.

## Product Strategy

This repo is now being steered as a reliability-first finance app, not a broad feature clone. Read `docs/product-strategy/reliable-finance-app-roadmap.md` before planning new product work.

The current implementation plan is `docs/superpowers/plans/2026-05-14-reliability-first-phase-1.md`. It starts with durable references, architecture decisions, API trust metadata, runtime validation, and visible data freshness/fallback behavior.

Architecture decisions now live in `docs/architecture/decisions/`.

Use `issues.md` for current issue status and `troubleshooting.md` for verification commands and manual test steps.

Use `metrics.md` before adding or renaming performance events.
