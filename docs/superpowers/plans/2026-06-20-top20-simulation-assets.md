# Top 20 Simulation Assets Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand Simulation from the BTC/ETH/SOL hardcoded runtime to the top 20 ready catalog assets, with data-quality gating, five sourced events per asset, and storage/API verification at every stage.

**Architecture:** Backend simulation support becomes database-backed instead of hardcoded. Each new behavior lives in a focused file under a feature-specific folder: asset support, current price lookup, event seed generation, and frontend picker gating stay separated. The frontend consumes backend support status and does not invent simulation readiness beyond the API contract.

**Tech Stack:** Expo Router, React Native, Hono Worker, Cloudflare D1, TypeScript shared contracts, Python historical-price importer, Jest, `tsc --noEmit`, Wrangler D1 commands.

---

## Stage 1 Accepted Scope

Top 20 ready assets by current deployed catalog market rank as of June 20, 2026:

| Rank | Symbol | CoinGecko ID | Name | Category | First Historical Date | Last Historical Date | Rows |
|---:|---|---|---|---|---|---|---:|
| 1 | BTC | bitcoin | bitcoin | Layer 1 | 2014-09-17 | 2026-03-22 | 4204 |
| 2 | ETH | ethereum | ethereum | Layer 1 | 2017-11-09 | 2026-03-22 | 3055 |
| 3 | USDT | tether | tether | Stablecoin | 2017-11-09 | 2026-03-22 | 3055 |
| 4 | BNB | binancecoin | binancecoin | Exchange Token | 2017-11-09 | 2026-03-22 | 3055 |
| 5 | USDC | usd-coin | usd-coin | Stablecoin | 2018-10-08 | 2026-03-22 | 2722 |
| 6 | XRP | ripple | ripple | Crypto | 2017-11-09 | 2026-03-22 | 3055 |
| 7 | SOL | solana | solana | Layer 1 | 2020-04-10 | 2026-03-22 | 2172 |
| 8 | TRX | tron | tron | Layer 1 | 2017-11-09 | 2026-03-22 | 3055 |
| 10 | HYPE | hyperliquid | hyperliquid | DeFi | 2021-01-12 | 2024-08-27 | 1324 |
| 11 | DOGE | dogecoin | dogecoin | Meme | 2017-11-09 | 2026-03-22 | 3055 |
| 12 | USDS | usds | usds | Stablecoin | 2019-02-06 | 2023-04-11 | 1420 |
| 13 | RAIN | rain | rain | Other | 2021-12-21 | 2026-03-22 | 1552 |
| 14 | LEO | leo-token | leo-token | Exchange Token | 2019-05-21 | 2026-03-22 | 2497 |
| 15 | ZEC | zcash | zcash | Privacy | 2017-11-09 | 2026-03-22 | 3055 |
| 16 | XLM | stellar | stellar | Crypto | 2017-11-09 | 2026-03-22 | 3055 |
| 17 | WBT | whitebit | whitebit | Exchange Token | 2022-08-26 | 2026-03-22 | 1304 |
| 18 | ADA | cardano | cardano | Layer 1 | 2017-11-09 | 2026-03-22 | 3055 |
| 19 | LINK | chainlink | chainlink | Oracle | 2017-11-09 | 2026-03-22 | 3055 |
| 20 | CC | canton-network | canton-network | Crypto | 2020-11-12 | 2023-01-12 | 792 |
| 21 | XMR | monero | monero | Privacy | 2017-11-09 | 2026-03-22 | 3055 |

Stage 1 acceptance criteria:

- [ ] User approves this exact top-20 scope before backend support changes.
- [ ] If any asset is excluded, replace it with the next ready asset by market rank.

## File And Folder Boundaries

Backend new folders:

- `apps/backend/src/domains/simulation/assets/`
  - `simulationSupportedAssetRepository.ts`: D1 reads for supported simulation assets.
  - `simulationSupportedAssetService.ts`: support-list business logic.
  - `simulationSupportedAssetTypes.ts`: backend-only asset support types.
  - `simulationSupportedAssetSelection.ts`: top-20 selection logic.

- `apps/backend/src/domains/simulation/current-prices/`
  - `coinGeckoSimplePriceClient.ts`: generic CoinGecko simple-price fetch by IDs.
  - `simulationCurrentPriceRepository.ts`: maps symbol to current price record.
  - `simulationCurrentPriceCache.ts`: cache wrapper for supported assets.

- `apps/backend/src/domains/simulation/events/`
  - `simulationEventSeedTypes.ts`: seed row and source row types.
  - `simulationEventSeedSql.ts`: SQL generation helpers.
  - `top20SimulationEvents.ts`: curated top-20 event seed data.
  - `validateSimulationEventCoverage.ts`: coverage validator.

Backend modified files:

- `apps/backend/src/domains/simulation/simulationPriceService.ts`
- `apps/backend/src/domains/simulation/simulationHistoryService.ts`
- `apps/backend/src/domains/simulation/simulationEventScenarioService.ts`
- `apps/backend/src/domains/simulation/simulationEventRepository.ts`
- `apps/backend/src/domains/simulation/simulationRoutes.ts`

Frontend new folders:

- `apps/frontend/src/features/simulation/asset-picker/`
  - `simulationAssetPickerFilters.ts`: search/filter/recommendation functions.
  - `simulationAssetPickerTypes.ts`: picker filter types.
  - `SimulationAssetPicker.tsx`: picker modal.
  - `SelectedSimulationAssetField.tsx`: compact selected-coin field.

Frontend modified files:

- `apps/frontend/src/features/simulation/screens/simulationScreen.tsx`
- `apps/frontend/src/features/simulation/api/getSimulationAssets.ts`

Shared modified files:

- `packages/shared/src/simulationTypes.ts`
- `packages/shared/src/simulationValidators.ts`
- `packages/shared/src/simulationAssetCatalogTypes.ts`
- `packages/shared/src/simulationAssetCatalogValidators.ts`

Migration files:

- `apps/backend/migrations/0005_top20_simulation_assets.sql`
- `apps/backend/migrations/0006_top20_simulation_events.sql`

## Task 1: Lock Top-20 Support Scope

**Files:**
- Create: `apps/backend/src/domains/simulation/assets/simulationSupportedAssetSelection.ts`
- Create: `apps/backend/src/domains/simulation/assets/simulationSupportedAssetSelection.test.ts`

- [ ] **Step 1: Write failing test**

Test that the top-20 selector returns the approved symbols from ready catalog rows sorted by market rank:

```ts
expect(selectTopSimulationAssets(rows, 20).map((asset) => asset.symbol)).toEqual([
  'BTC', 'ETH', 'USDT', 'BNB', 'USDC', 'XRP', 'SOL', 'TRX', 'HYPE', 'DOGE',
  'USDS', 'RAIN', 'LEO', 'ZEC', 'XLM', 'WBT', 'ADA', 'LINK', 'CC', 'XMR',
]);
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
./node_modules/.bin/jest --runTestsByPath apps/backend/src/domains/simulation/assets/simulationSupportedAssetSelection.test.ts --runInBand --watchman=false
```

Expected: fail because the file/function does not exist.

- [ ] **Step 3: Implement selection helper**

Implement only a pure selector that accepts rows already enriched with market rank, filters to `status === "ready"`, requires a `coinGeckoId`, sorts by rank, and returns `limit` rows.

- [ ] **Step 4: Verify**

Run the same Jest command and `./node_modules/.bin/tsc --noEmit`.

## Task 2: Add Database-Backed Supported Asset Repository

**Files:**
- Create: `apps/backend/src/domains/simulation/assets/simulationSupportedAssetRepository.ts`
- Create: `apps/backend/src/domains/simulation/assets/simulationSupportedAssetService.ts`
- Create: `apps/backend/__tests__/simulation/simulationSupportedAssetRepository.test.ts`

- [ ] **Step 1: Write failing repository tests**

Cover:

- returns supported top-20 symbols and CoinGecko IDs
- rejects historical-invalid rows
- rejects rows without `coin_gecko_id`
- preserves `first_imported_date` / `last_imported_date`

- [ ] **Step 2: Implement D1 query**

Repository should read from `simulation_assets`; it should not inspect `historical_crypto_prices` directly.

- [ ] **Step 3: Verify**

Run:

```bash
./node_modules/.bin/jest --runTestsByPath apps/backend/__tests__/simulation/simulationSupportedAssetRepository.test.ts --runInBand --watchman=false
./node_modules/.bin/tsc --noEmit
```

## Task 3: Replace Hardcoded Backend Simulation Asset Contract

**Files:**
- Modify: `apps/backend/src/domains/simulation/simulationPriceService.ts`
- Modify: `apps/backend/src/domains/simulation/simulationHistoryService.ts`
- Modify: `apps/backend/src/domains/simulation/simulationEventScenarioService.ts`
- Modify: `apps/backend/src/domains/simulation/simulationAssets.ts`
- Test: `apps/backend/__tests__/api/simulation-prices-api.test.ts`
- Test: `apps/backend/__tests__/api/simulation-events-api.test.ts`

- [ ] **Step 1: Write failing API tests**

Add a successful non-v1 scenario for `BNB`:

```ts
const response = await app.request(
  '/api/simulation/prices?asset=BNB&date=2021-01-01&amountUsd=100',
  {},
  env
);
expect(response.status).toBe(200);
expect(await response.json()).toMatchObject({
  status: 'success',
  asset: { symbol: 'BNB', coinGeckoId: 'binancecoin' },
});
```

Add an unsupported test for a ready-but-not-top20 asset if present.

- [ ] **Step 2: Implement service lookup**

Each simulation service should load supported asset metadata from the repository and validate against that metadata. Remove TypeScript-only hardcoded asset validation from runtime request validation.

- [ ] **Step 3: Verify**

Run:

```bash
./node_modules/.bin/jest --runTestsByPath apps/backend/__tests__/api/simulation-prices-api.test.ts apps/backend/__tests__/api/simulation-events-api.test.ts --runInBand --watchman=false
./node_modules/.bin/tsc --noEmit
```

## Task 4: Generalize Current Price Fetching

**Files:**
- Create: `apps/backend/src/domains/simulation/current-prices/coinGeckoSimplePriceClient.ts`
- Create: `apps/backend/src/domains/simulation/current-prices/simulationCurrentPriceCache.ts`
- Create: `apps/backend/__tests__/simulation/coinGeckoSimplePriceClient.test.ts`
- Modify: `apps/backend/src/domains/simulation/simulationPriceService.ts`
- Modify: `apps/backend/src/domains/simulation/simulationEventScenarioService.ts`

- [ ] **Step 1: Write failing current-price tests**

Test that the client accepts arbitrary CoinGecko IDs and maps results back to supported symbols.

- [ ] **Step 2: Implement generic CoinGecko simple price client**

Do not modify the existing BTC/ETH/SOL client in-place. Build the generic client in `current-prices/`, then migrate services to it.

- [ ] **Step 3: Verify sampled API calls**

Run local or deployed Worker checks for:

```bash
curl -i '<worker>/api/simulation/prices?asset=BNB&date=2021-01-01&amountUsd=100'
curl -i '<worker>/api/simulation/prices?asset=ADA&date=2021-01-01&amountUsd=100'
curl -i '<worker>/api/simulation/history?asset=XMR&year=2021'
```

## Task 5: Curate And Seed Five Events Per Top-20 Asset

**Files:**
- Create: `apps/backend/src/domains/simulation/events/top20SimulationEvents.ts`
- Create: `apps/backend/src/domains/simulation/events/validateSimulationEventCoverage.ts`
- Create: `apps/backend/src/domains/simulation/events/simulationEventSeedSql.ts`
- Create: `apps/backend/__tests__/simulation/validateSimulationEventCoverage.test.ts`
- Create: `apps/backend/migrations/0006_top20_simulation_events.sql`

- [ ] **Step 1: Build event source checklist**

For each of the 20 symbols, collect 5 market events with at least 2 source records each.

Rules:

- use primary/project sources where possible: official foundation blogs, SEC filings/orders, exchange/company announcements
- use reputable news only when primary sources are unavailable
- event date must fall inside the asset historical date range
- each event must have category and sentiment

- [ ] **Step 2: Write failing coverage validator test**

Validator must fail unless every top-20 symbol has exactly 5 active events and every event has at least 2 sources.

- [ ] **Step 3: Add seed data**

Add data in `top20SimulationEvents.ts`, generate SQL into `0006_top20_simulation_events.sql`, and keep the generated SQL deterministic.

- [ ] **Step 4: Verify**

Run:

```bash
./node_modules/.bin/jest --runTestsByPath apps/backend/__tests__/simulation/validateSimulationEventCoverage.test.ts apps/backend/__tests__/api/simulation-events-api.test.ts --runInBand --watchman=false
```

## Task 6: Frontend Remove V1 Overlay And Split Picker Components

**Files:**
- Create: `apps/frontend/src/features/simulation/asset-picker/simulationAssetPickerFilters.ts`
- Create: `apps/frontend/src/features/simulation/asset-picker/simulationAssetPickerFilters.test.ts`
- Create: `apps/frontend/src/features/simulation/asset-picker/SimulationAssetPicker.tsx`
- Create: `apps/frontend/src/features/simulation/asset-picker/SelectedSimulationAssetField.tsx`
- Modify: `apps/frontend/src/features/simulation/screens/simulationScreen.tsx`

- [ ] **Step 1: Write failing picker filter tests**

Cover search, recommended, ready, unavailable, top-20, and ranking behavior.

- [ ] **Step 2: Extract picker logic out of screen**

Move helper functions out of `simulationScreen.tsx`; keep the screen responsible for state orchestration only.

- [ ] **Step 3: Remove V1-only support overlay**

Only remove the overlay after backend top-20 runtime support is verified.

- [ ] **Step 4: Verify**

Run:

```bash
./node_modules/.bin/jest --runTestsByPath apps/frontend/src/features/simulation/asset-picker/simulationAssetPickerFilters.test.ts apps/frontend/src/features/simulation/screens/simulationScreen.test.ts --runInBand --watchman=false
./node_modules/.bin/tsc --noEmit
```

## Task 7: Storage And D1 Feedback Loop

**Files:**
- Create: `docs/project-reference/top20-simulation-rollout.md`

- [ ] **Step 1: Check D1 row counts**

Run:

```bash
./node_modules/.bin/wrangler d1 execute fintech-historical-prices --remote --command "SELECT COUNT(*) AS row_count FROM historical_crypto_prices;"
./node_modules/.bin/wrangler d1 execute fintech-historical-prices --remote --command "SELECT asset_symbol, COUNT(*) AS event_count FROM simulation_events WHERE status = 'active' GROUP BY asset_symbol ORDER BY asset_symbol;"
./node_modules/.bin/wrangler d1 execute fintech-historical-prices --remote --command "SELECT COUNT(*) AS source_count FROM simulation_event_sources;"
```

- [ ] **Step 2: If storage or migration size fails**

Use batched D1 import SQL for event seed rows instead of a single monolithic migration. Keep `0006_top20_simulation_events.sql` as schema + minimal loader metadata, and store generated batches under `tmp/simulation_events/`.

- [ ] **Step 3: Sample endpoints**

Check at least 5 assets:

```bash
curl -i '<worker>/api/simulation/history?asset=BNB&year=2021'
curl -i '<worker>/api/simulation/prices?asset=BNB&date=2021-01-01&amountUsd=100'
curl -i '<worker>/api/simulation/events?asset=BNB'
curl -i '<worker>/api/simulation/event-scenarios?eventId=<bnb-event-id>&delay=one_week&amountUsd=500'
```

- [ ] **Step 4: Record acceptance output**

Update `docs/project-reference/top20-simulation-rollout.md` with:

- supported symbols
- event/source counts
- D1 row counts
- sampled curl responses
- any storage issue encountered and chosen fix

## Final Verification

Run:

```bash
/Users/shubhkapadia/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3 -m unittest scripts/historical_prices/test_import_historical_prices.py
./node_modules/.bin/jest --runInBand --watchman=false
./node_modules/.bin/tsc --noEmit
```

Manual acceptance:

- Search/select BNB in Simulation.
- Run date simulation for BNB.
- Switch to Event mode and see 5 BNB events.
- Run a BNB event scenario.
- Save it and open the saved simulation dialog.
- Repeat one sampled flow for ADA, DOGE, LINK, and XMR.
