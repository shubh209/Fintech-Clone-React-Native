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

These docs let future sessions recover context quickly without re-auditing the whole repo.

## Latest Pivot Notes

The app is being reset from a broad fintech clone into a crypto market simulator foundation.

The latest deep cleanup removed:

- Home balance screen
- Activity transaction ledger
- random Add Money behavior
- destructive Exchange behavior
- fake More menu
- static widgets
- lock/passcode and inactivity lock code
- transaction Zustand/MMKV store
- transaction frontend repository/client
- transaction Worker routes and KV binding
- shared transaction contracts

The project now keeps:

- Clerk phone auth screens
- signed-in Simulation and Crypto tabs
- Simulation v1 for BTC/ETH/SOL historical scenarios
- saved hypothetical simulations on device
- crypto detail screen
- Cloudflare Worker crypto API
- Cloudflare Worker Simulation API backed by historical D1 data and CoinGecko current prices
- `CRYPTO_FALLBACKS` KV fallback data
- shared crypto and simulation validators
- local metrics helpers

## Product Strategy

The current simulator direction is:

- choose asset
- explore historical prices by year on a press-and-drag chart
- choose historical buy date
- enter a hypothetical USD amount
- compare historical price against current value
- save the simulation locally
- later compare simulated crypto value against purchasable assets by region

Use `docs/superpowers/specs/2026-05-19-product-cleanup-for-crypto-simulator-pivot.md` and `docs/superpowers/plans/2026-05-19-product-cleanup-for-crypto-simulator-pivot.md` for pivot context.

Architecture decisions live in `docs/architecture/decisions/`.

Use `issues.md` for current issue status and `troubleshooting.md` for verification commands and manual test steps.

Use `metrics.md` before adding or renaming performance events.
