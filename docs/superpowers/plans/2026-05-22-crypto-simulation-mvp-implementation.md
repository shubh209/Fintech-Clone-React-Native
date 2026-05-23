# Crypto Simulation MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the signed-in Simulation v1 workflow end-to-end: a user enters asset, historical buy date, and USD amount, then sees and can save a hypothetical result.

**Architecture:** Keep the current crypto market browsing screens intact. Add a Simulation feature backed by the Cloudflare Worker. Historical prices come from Cloudflare D1 rows imported from the curated CSV dataset. Current USD prices come from CoinGecko Simple Price through the Worker with a 60-second cache. The Worker owns all simulation math and Data Trust metadata.

**Tech Stack:** Expo Router, React Native, React Query, Clerk, Cloudflare Workers, Hono, D1, TypeScript, Jest, Python, pandas, Wrangler, local source-level tests where UI rendering tests would be heavy.

---

## Reference Docs

- Spec: `docs/superpowers/specs/2026-05-21-crypto-simulation-mvp.md`
- Spec: `docs/superpowers/specs/2026-05-22-historical-price-ingestion.md`
- Spec: `docs/superpowers/specs/2026-05-22-simulation-price-api.md`
- ADR: `docs/architecture/decisions/0018-historical-price-provider.md`
- Metrics catalog: `docs/project-reference/metrics.md`
- Measurement rule: `docs/project-reference/measurement-skill.md`

## Current Implementation Status

Updated 2026-05-23 after the signed-in Simulation vertical slice.

Completed:

- Tasks 1-7 are implemented for shared contracts, D1 schema/binding, Python ingestion, backend historical lookup, CoinGecko current-price client/cache, Worker route, and backend/shared metrics documentation.
- The historical CSV importer is Python-only at `scripts/historical_prices/import_historical_prices.py`.
- TypeScript is used only for runtime Worker/shared/frontend code, not offline CSV ingestion.
- Remote D1 database `fintech-historical-prices` is created and bound as `HISTORICAL_PRICES_DB`.
- Remote D1 import verified: `120740` rows, `88` assets, date range `2021-01-01` through `2026-03-22`, BTC/ETH/SOL present.
- `COINGECKO_API_KEY` is configured as a Worker secret.
- Task 8 frontend Simulation API client is implemented.
- Task 9 local saved simulation storage is implemented.
- Task 10 signed-in Simulation tab and UI are implemented.
- A yearly Simulation history endpoint and frontend history client are implemented for chart-driven date selection.
- The Simulation screen uses a chart-inspired year explorer with compact y-axis labels, month shortcuts, and press-and-drag chart date selection.
- The deployed Worker was updated once for `/api/simulation/prices`; deploy again after the latest `/api/simulation/history` route changes before testing chart data on device.

Fresh verification from this checkpoint:

```bash
/Users/shubhkapadia/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3 -m unittest scripts/historical_prices/test_import_historical_prices.py
./node_modules/.bin/jest --runTestsByPath apps/frontend/src/shared/api/simulationValidators.test.ts apps/backend/__tests__/simulation/historicalPriceRepository.test.ts apps/backend/__tests__/simulation/coinGeckoCurrentPriceClient.test.ts apps/backend/__tests__/simulation/currentPriceCache.test.ts apps/backend/__tests__/api/simulation-prices-api.test.ts --runInBand --watchman=false
./node_modules/.bin/tsc --noEmit
```

Next implementation step:

- Deploy the Worker again so `/api/simulation/history` is live.
- Manual QA the Simulation chart/date-selection flow and saved simulation flow on device.
- Then continue beyond MVP into purchasing-power comparison design or UI polish based on product priority.

## File Structure

Expected new backend files:

- `apps/backend/migrations/0001_historical_crypto_prices.sql`
- `scripts/historical_prices/import_historical_prices.py`
- `scripts/historical_prices/test_import_historical_prices.py`
- `apps/backend/src/domains/simulation/simulationAssets.ts`
- `apps/backend/src/domains/simulation/historicalPriceRepository.ts`
- `apps/backend/src/domains/simulation/coinGeckoCurrentPriceClient.ts`
- `apps/backend/src/domains/simulation/currentPriceCache.ts`
- `apps/backend/src/domains/simulation/simulationPriceService.ts`
- `apps/backend/src/domains/simulation/simulationHistoryService.ts`
- `apps/backend/src/domains/simulation/simulationRoutes.ts`
- `apps/backend/__tests__/api/simulation-prices-api.test.ts`

Expected shared/frontend files:

- `packages/shared/src/simulationTypes.ts`
- `packages/shared/src/simulationValidators.ts`
- `apps/frontend/src/features/simulation/api/getSimulationPrice.ts`
- `apps/frontend/src/features/simulation/api/getSimulationHistory.ts`
- `apps/frontend/src/features/simulation/storage/savedSimulationsStore.ts`
- `apps/frontend/src/features/simulation/screens/simulationScreen.tsx`
- `apps/frontend/src/features/simulation/types/simulationTypes.ts`
- `apps/frontend/app/(authenticated)/(tabs)/simulation.tsx`
- frontend tests beside the touched feature files.

Modify existing files:

- `apps/backend/wrangler.jsonc`
- `apps/backend/src/types.ts`
- `apps/backend/src/index.ts`
- `packages/shared/src/index.ts`
- `apps/frontend/app/(authenticated)/(tabs)/_layout.tsx`
- `apps/frontend/src/features/auth/routing/useAuthRedirects.ts` only if default signed-in landing should move from Crypto to Simulation.
- `apps/frontend/src/shared/metrics/metrics.test.ts`
- `docs/project-reference/metrics.md`
- `docs/project-reference/architecture.md`
- `docs/project-reference/troubleshooting.md`

## Task 1: Add Shared Simulation Contracts

**Files:**
- Create: `packages/shared/src/simulationTypes.ts`
- Create: `packages/shared/src/simulationValidators.ts`
- Modify: `packages/shared/src/index.ts`
- Create tests beside shared validators or under existing shared test pattern.

- [ ] **Step 1: Define response types**

Define discriminated response types for:

- success response from `GET /api/simulation/prices`.
- validation error response.
- unavailable response.
- `dateResolution: "exact" | "next_available"`.
- current cache status.

- [ ] **Step 2: Add runtime validators**

Validate:

- success response shape.
- positive finite numeric prices.
- `requestedDate` and `resolvedDate` strings.
- supported error/unavailable codes.

- [ ] **Step 3: Run shared validator tests red/green**

Use:

```bash
./node_modules/.bin/jest --runTestsByPath apps/frontend/src/shared/api/apiResult.test.ts apps/frontend/src/shared/api/cryptoValidators.test.ts --runInBand --watchman=false
```

Add the new simulation validator test path once created.

## Task 2: Add D1 Binding And Historical Schema

**Files:**
- Modify: `apps/backend/wrangler.jsonc`
- Modify: `apps/backend/src/types.ts`
- Create: `apps/backend/migrations/0001_historical_crypto_prices.sql`

- [ ] **Step 1: Add D1 binding**

Add a D1 database binding such as `HISTORICAL_PRICES_DB` in `wrangler.jsonc`.

Update `ApiEnv` with a D1-shaped binding. If local tests avoid Cloudflare types, define the smallest interface needed for `prepare().bind().first()` / `all()` usage.

- [ ] **Step 2: Add migration**

Create:

- `historical_crypto_prices`
- `historical_price_imports`
- supporting lookup index

Use the schema from `docs/superpowers/specs/2026-05-22-historical-price-ingestion.md`.

- [ ] **Step 3: Document setup**

Update troubleshooting/architecture docs with D1 binding name and migration command once known.

## Task 3: Build Historical Importer

**Files:**
- Create: `scripts/historical_prices/import_historical_prices.py`
- Create: `scripts/historical_prices/test_import_historical_prices.py`

- [ ] **Step 1: Add importer tests first**

Cover:

- valid folder shape imports multiple assets.
- BTC/ETH/SOL are required gates.
- non-product malformed asset can be skipped with provenance.
- missing required columns fail.
- duplicate asset/date rows fail for product assets.
- gaps over 3 days fail for product assets.
- derived analytics blanks become `NULL`.

- [ ] **Step 2: Implement parser/normalizer**

Use Python with pandas for offline dataset parsing, validation, and report generation. Keep the Cloudflare Worker runtime in TypeScript and do not parse raw CSV data at request time.

- [ ] **Step 3: Generate D1-compatible SQL and report**

The command should support:

```bash
/Users/shubhkapadia/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3 \
  scripts/historical_prices/import_historical_prices.py \
  --source-root ./data/crypto_data \
  --source-name "Top 100 Cryptocurrency Historical Prices" \
  --source-url "<dataset-url>" \
  --source-version "<dataset-version-or-download-date>" \
  --downloaded-at "<ISO-8601 timestamp>" \
  --output-sql ./tmp/historical_prices/historical_crypto_prices.sql \
  --output-report ./tmp/historical_prices/coverage_report.json
```

- [ ] **Step 4: Print coverage report**

Include imported assets, skipped assets, row counts, date ranges, missing date count, largest gap, and next-available usage possibility.

## Task 4: Add Historical Price Repository

**Files:**
- Create: `apps/backend/src/domains/simulation/historicalPriceRepository.ts`
- Create/update backend tests.

- [ ] **Step 1: Test exact lookup**

Given a D1 row for asset/date, return `dateResolution: "exact"`.

- [ ] **Step 2: Test next-available lookup**

Given no exact row but a row within 3 days, return `dateResolution: "next_available"` and both dates.

- [ ] **Step 3: Test unavailable lookup**

Return unavailable when no row exists within the 3-day/configured historical-max-date bound.

- [ ] **Step 4: Implement repository**

Use the bounded query from ADR 0018. Keep this module free of HTTP response concerns.

## Task 5: Add CoinGecko Current Price Client And Cache

**Files:**
- Create: `apps/backend/src/domains/simulation/coinGeckoCurrentPriceClient.ts`
- Create: `apps/backend/src/domains/simulation/currentPriceCache.ts`
- Add backend tests.

- [ ] **Step 1: Test batched CoinGecko request**

Assert request path:

```text
/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd&include_last_updated_at=true
```

- [ ] **Step 2: Test response validation**

Reject missing, zero, negative, or non-finite USD prices.

- [ ] **Step 3: Test 60-second cache behavior**

Cover fresh cache hit, expired refresh success, and expired refresh failure.

- [ ] **Step 4: Implement client/cache**

Keep cache module isolated so tests can inject `nowMs`.

## Task 6: Add Simulation Price Service And Route

**Files:**
- Create: `apps/backend/src/domains/simulation/simulationAssets.ts`
- Create: `apps/backend/src/domains/simulation/simulationPriceService.ts`
- Create: `apps/backend/src/domains/simulation/simulationRoutes.ts`
- Modify: `apps/backend/src/index.ts`
- Create: `apps/backend/__tests__/api/simulation-prices-api.test.ts`

- [ ] **Step 1: Test validation errors**

Cover:

- missing asset.
- unsupported asset.
- missing/invalid/out-of-range date.
- missing/invalid amount.

- [ ] **Step 2: Test success response**

Assert Worker computes:

- implied quantity.
- current value.
- gain/loss USD.
- gain/loss percent.
- Data Trust metadata.

- [ ] **Step 3: Test unavailable states**

Cover:

- historical unavailable.
- current unavailable after CoinGecko failure and no fresh cache.
- invalid price after lookup.

- [ ] **Step 4: Implement route**

Add:

```text
GET /api/simulation/prices
```

Return the exact status/code shapes from the Day 4 API spec.

## Task 7: Update Metrics Catalog And Backend Metrics

**Files:**
- Modify: `docs/project-reference/metrics.md`
- Modify backend simulation modules/tests.
- Modify frontend metrics tests when frontend is added.

- [ ] **Step 1: Document event names**

Add:

- `crypto.api.simulation_prices.historical_d1`
- `crypto.api.simulation_prices.current_coingecko`
- `crypto.api.simulation_prices.current_cache`
- `crypto.api.simulation_prices.compute`
- `crypto.client.simulation_prices.fetch`
- `crypto.simulation.started`
- `crypto.simulation.completed`
- `crypto.simulation.failed`
- `crypto.simulation.saved`

- [ ] **Step 2: Emit backend metrics**

Use existing backend telemetry helpers for D1 lookup, CoinGecko refresh, cache use, and compute.

- [ ] **Step 3: Add metric tests where code-owned**

Assert metric events have stable names and meaningful metadata.

## Task 8: Add Frontend Simulation API Client

**Files:**
- Create: `apps/frontend/src/features/simulation/api/getSimulationPrice.ts`
- Create tests beside API client.

- [x] **Step 1: Test endpoint construction**

Assert it calls:

```text
/api/simulation/prices?asset=BTC&date=2021-01-01&amountUsd=100
```

through `getCryptoApiUrl` or a renamed shared Worker URL helper.

- [x] **Step 2: Test response validation**

Use shared simulation validators before returning data to screens.

- [x] **Step 3: Instrument client fetch**

Wrap fetch in `timeAsync('crypto.client.simulation_prices.fetch', ...)`.

## Task 9: Add Saved Simulations Storage

**Files:**
- Create: `apps/frontend/src/features/simulation/storage/savedSimulationsStore.ts`
- Create tests beside storage.

- [x] **Step 1: Define saved simulation model**

Include:

- generated local ID.
- created timestamp.
- original inputs.
- result snapshot.
- Data Trust metadata snapshot.
- clear hypothetical labeling field or copy contract.

- [x] **Step 2: Implement local/prototype persistence**

Use a simple local store appropriate for the current app. Do not reintroduce removed transaction storage or transaction language.

- [x] **Step 3: Test save/list behavior**

Assert saved simulations are not called transactions/holdings/orders.

## Task 10: Build Simulation Screen And Route

**Files:**
- Create: `apps/frontend/src/features/simulation/screens/simulationScreen.tsx`
- Create: `apps/frontend/app/(authenticated)/(tabs)/simulation.tsx`
- Modify: `apps/frontend/app/(authenticated)/(tabs)/_layout.tsx`
- Add frontend source-level or focused unit tests.

- [x] **Step 1: Add source-level product boundary tests**

Guard:

- only BTC/ETH/SOL appear in selectable product UI.
- copy says hypothetical/simulation.
- no trading, bank, order, portfolio, transaction, or real-money language appears.

- [x] **Step 2: Build input form**

Inputs:

- asset segmented control or picker.
- date input constrained to `2021-01-01` through the latest common imported historical date.
- USD amount input.

- [x] **Step 3: Build result state**

Show:

- historical price.
- current price.
- implied quantity.
- current value.
- gain/loss USD and percent.
- requested/resolved date if next-available was used.
- Data Trust labels.

- [x] **Step 4: Build save action and saved list**

Saving emits `crypto.simulation.saved` and stores the result snapshot locally.

- [x] **Step 5: Add navigation**

Add a signed-in Simulation tab. Keep Crypto tab available unless product direction decides Simulation should replace it.

## Task 11: Verification And Manual QA

**Files:**
- Modify: `docs/project-reference/troubleshooting.md`
- Modify: `docs/project-reference/architecture.md`

- [ ] **Step 1: Run targeted backend tests**

```bash
./node_modules/.bin/jest --runTestsByPath apps/backend/__tests__/api/simulation-prices-api.test.ts --runInBand --watchman=false
/Users/shubhkapadia/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3 -m unittest scripts/historical_prices/test_import_historical_prices.py
```

- [ ] **Step 2: Run existing API trust tests**

```bash
./node_modules/.bin/jest --runTestsByPath apps/frontend/src/shared/api/apiResult.test.ts apps/frontend/src/shared/api/cryptoValidators.test.ts apps/backend/__tests__/api/listings-api.test.ts apps/backend/__tests__/api/info-api.test.ts apps/backend/__tests__/api/tickers-api.test.ts apps/frontend/src/features/crypto-market/api/cryptoListApiWiring.test.ts apps/frontend/src/features/crypto-market/api/cryptoDetailApiWiring.test.ts --runInBand --watchman=false
```

- [ ] **Step 3: Run full verification**

```bash
./node_modules/.bin/jest --runInBand --watchman=false
./node_modules/.bin/tsc --noEmit
node -e "JSON.parse(require('fs').readFileSync('app.json','utf8')); console.log('app.json valid')"
```

- [ ] **Step 4: Manual QA**

Exercise:

- exact historical date.
- next-available historical date.
- current price cache hit.
- current price unavailable.
- save simulation.
- revisit saved simulation.

Watch logs for `[metric]` events.

## Measurement

Before:

- no simulation endpoint.
- no historical D1 lookup coverage.
- no current CoinGecko cache coverage.
- no completed simulation workflow.
- no saved simulation count.

After:

- simulation completion measured by `crypto.simulation.started` and `crypto.simulation.completed`.
- API success/fallback measured by D1/current provider/cache metrics.
- time to completed simulation measured by frontend fetch and completion events.
- saved simulation count measured by `crypto.simulation.saved`.
- tests cover exact date, next-available date, unavailable current price, and product asset allowlist.
