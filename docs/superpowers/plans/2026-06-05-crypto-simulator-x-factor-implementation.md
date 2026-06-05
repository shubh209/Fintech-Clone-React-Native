# Crypto Simulator X-Factor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the smallest production-shaped version of the simulator X factor: city-based purchasing-power comparisons, broader asset discovery, backend observability, CI confidence, and a demo-ready result summary.

**Architecture:** Keep the user story centered on one flow: a signed-in user runs a crypto simulation, picks one of five cities, and sees what the result means in monthly essentials and big purchases. Add purchasing-power contracts beside the current simulation contracts, expose calculations through the Worker, integrate the result into the Simulation screen, and use tests/metrics/CI to prove reliability.

**Tech Stack:** TypeScript, React Native, Expo Router, React Query, Cloudflare Workers, Hono, Cloudflare D1, Cloudflare KV, Jest, GitHub Actions, Python CSV ingestion, shared runtime validators.

---

## File Map

- Create `packages/shared/src/purchasingPowerTypes.ts` for city, category, comparison item, and API response types.
- Create `packages/shared/src/purchasingPowerValidators.ts` for runtime response validation.
- Modify `packages/shared/src/index.ts` to export purchasing-power contracts.
- Create `apps/backend/src/domains/purchasing-power/purchasingPowerData.ts` for curated static city cost data.
- Create `apps/backend/src/domains/purchasing-power/purchasingPowerService.ts` for comparison calculation and validation.
- Create `apps/backend/src/domains/purchasing-power/purchasingPowerRoutes.ts` for `GET /api/purchasing-power/comparisons`.
- Modify `apps/backend/src/index.ts` to mount purchasing-power routes.
- Create `apps/backend/__tests__/api/purchasing-power-api.test.ts`.
- Create `apps/frontend/src/features/simulation/api/getPurchasingPowerComparisons.ts`.
- Create `apps/frontend/src/features/simulation/api/getPurchasingPowerComparisons.test.ts`.
- Modify `apps/frontend/src/features/simulation/screens/simulationScreen.tsx` to add city selection and comparison results.
- Modify `apps/frontend/src/features/simulation/screens/simulationScreen.test.ts` for the new comparison flow.
- Create `apps/frontend/src/features/simulation/api/getSimulationAssets.ts` if no catalog client exists when this task starts.
- Modify `apps/frontend/src/features/simulation/screens/simulationScreen.tsx` to expose ready/unavailable catalog states without enabling unsupported simulations.
- Modify `apps/frontend/src/shared/metrics/metrics.ts` only if event metadata needs a typed expansion; otherwise use the existing helper.
- Modify `docs/project-reference/metrics.md` with the new event catalog entries.
- Create `.github/workflows/quality.yml` for Jest and TypeScript checks.
- Create `docs/demo/crypto-simulator-x-factor-demo.md` with deterministic demo scenarios and resume bullets.
- Modify `crypto-market-simulator.md` after implementation to replace estimates with measured claims where available.

---

### Task 1: Shared Purchasing-Power Contracts

**Files:**
- Create: `packages/shared/src/purchasingPowerTypes.ts`
- Create: `packages/shared/src/purchasingPowerValidators.ts`
- Modify: `packages/shared/src/index.ts`
- Test: `apps/frontend/src/shared/api/purchasingPowerValidators.test.ts`

**Successful outcome:** Shared contracts validate five supported cities, monthly essentials, big purchases, source metadata, and calculated purchasing-power quantities.

**Resume bullet candidate:** Designed shared TypeScript contracts and runtime validation for city-based purchasing-power comparisons, giving the mobile app and Worker one tested API language for translating crypto gains into user-readable outcomes.

- [ ] **Step 1: Add failing validator tests**

Create `apps/frontend/src/shared/api/purchasingPowerValidators.test.ts` with tests for valid success responses, invalid city ids, invalid non-positive item costs, and error responses.

Run: `./node_modules/.bin/jest --runTestsByPath apps/frontend/src/shared/api/purchasingPowerValidators.test.ts --runInBand --watchman=false`

Expected: FAIL because `@shared/purchasingPowerValidators` does not exist.

- [ ] **Step 2: Add shared types**

Create `packages/shared/src/purchasingPowerTypes.ts` with these exported shapes:

```ts
import { ApiResultMetadata } from './apiResult';

export type PurchasingPowerCityId = 'phoenix' | 'san_francisco' | 'new_york' | 'austin' | 'seattle';
export type PurchasingPowerCategory = 'monthly_essentials' | 'big_purchase';

export interface PurchasingPowerCity {
  id: PurchasingPowerCityId;
  name: string;
  state: string;
}

export interface PurchasingPowerItem {
  id: string;
  label: string;
  category: PurchasingPowerCategory;
  costUsd: number;
  sourceLabel: string;
}

export interface PurchasingPowerComparison {
  itemId: string;
  label: string;
  category: PurchasingPowerCategory;
  costUsd: number;
  quantity: number;
  summary: string;
}

export interface PurchasingPowerSuccessResponse {
  status: 'success';
  city: PurchasingPowerCity;
  input: {
    amountUsd: number;
  };
  comparisons: {
    monthlyEssentials: PurchasingPowerComparison[];
    bigPurchases: PurchasingPowerComparison[];
  };
  source: ApiResultMetadata & {
    datasetVersion: string;
  };
}

export interface PurchasingPowerErrorResponse {
  status: 'error';
  code: 'missing_city' | 'unsupported_city' | 'missing_amount' | 'invalid_amount';
  message: string;
}

export type PurchasingPowerResponse =
  | PurchasingPowerSuccessResponse
  | PurchasingPowerErrorResponse;
```

- [ ] **Step 3: Add validators and exports**

Create `packages/shared/src/purchasingPowerValidators.ts` with type guards matching the types above. Export both new files from `packages/shared/src/index.ts`.

- [ ] **Step 4: Run focused tests**

Run: `./node_modules/.bin/jest --runTestsByPath apps/frontend/src/shared/api/purchasingPowerValidators.test.ts --runInBand --watchman=false`

Expected: PASS with validator coverage for success and error responses.

---

### Task 2: Curated Five-City Purchasing-Power Dataset

**Files:**
- Create: `apps/backend/src/domains/purchasing-power/purchasingPowerData.ts`
- Create: `apps/backend/src/domains/purchasing-power/purchasingPowerData.test.ts`

**Successful outcome:** The backend has a deterministic, versioned dataset for Phoenix, San Francisco, New York, Austin, and Seattle with monthly essentials and big purchases.

**Resume bullet candidate:** Built a versioned cost-of-living dataset for five US cities, giving the simulator deterministic demo data that converts crypto performance into rent, groceries, transportation, and big-purchase equivalents.

- [ ] **Step 1: Write dataset tests**

Create tests that assert:
- exactly 5 city ids exist
- each city has at least 4 monthly essentials
- each city has at least 3 big purchases
- each item has a positive `costUsd`
- `datasetVersion` matches `2026-06-05.v1`

Run: `./node_modules/.bin/jest --runTestsByPath apps/backend/src/domains/purchasing-power/purchasingPowerData.test.ts --runInBand --watchman=false`

Expected: FAIL because the dataset file does not exist.

- [ ] **Step 2: Create deterministic data**

Create `apps/backend/src/domains/purchasing-power/purchasingPowerData.ts` with:
- `datasetVersion = '2026-06-05.v1'`
- five city records: Phoenix, San Francisco, New York, Austin, Seattle
- monthly essentials: rent, groceries, gas/transportation, phone/internet
- big purchases: used car down payment, laptop, vacation flight/hotel budget

Use rounded, recruiter-readable numbers. Mark source labels as curated estimates for portfolio simulation, not live consumer-price data.

- [ ] **Step 3: Run focused tests**

Run: `./node_modules/.bin/jest --runTestsByPath apps/backend/src/domains/purchasing-power/purchasingPowerData.test.ts --runInBand --watchman=false`

Expected: PASS.

---

### Task 3: Purchasing-Power Worker API

**Files:**
- Create: `apps/backend/src/domains/purchasing-power/purchasingPowerService.ts`
- Create: `apps/backend/src/domains/purchasing-power/purchasingPowerRoutes.ts`
- Modify: `apps/backend/src/index.ts`
- Test: `apps/backend/__tests__/api/purchasing-power-api.test.ts`

**Successful outcome:** `GET /api/purchasing-power/comparisons?city=phoenix&amountUsd=2500` returns monthly essentials and big purchases with calculated quantities and source metadata.

**Resume bullet candidate:** Implemented a Cloudflare Worker REST API that turns a simulated crypto value into real-world city comparisons, helping non-technical users understand market gains through familiar expenses instead of abstract percentages.

- [ ] **Step 1: Write API tests**

Test success for Phoenix at `$2,500`, unsupported city, missing city, invalid amount, and source metadata.

Run: `./node_modules/.bin/jest --runTestsByPath apps/backend/__tests__/api/purchasing-power-api.test.ts --runInBand --watchman=false`

Expected: FAIL because the route is not mounted.

- [ ] **Step 2: Implement service calculation**

In `purchasingPowerService.ts`, validate `city` and `amountUsd`. Calculate `quantity = amountUsd / costUsd` rounded to 2 decimals. Generate summaries such as:

```ts
`${quantity.toFixed(2)}x ${item.label.toLowerCase()} in ${city.name}`
```

Return `PurchasingPowerResponse`.

- [ ] **Step 3: Mount route**

Create `purchasingPowerRoutes.ts` with Hono and mount it in `apps/backend/src/index.ts`:

```ts
import { purchasingPowerRoutes } from './domains/purchasing-power/purchasingPowerRoutes';

app.route('/api/purchasing-power', purchasingPowerRoutes);
```

- [ ] **Step 4: Run focused tests**

Run: `./node_modules/.bin/jest --runTestsByPath apps/backend/__tests__/api/purchasing-power-api.test.ts --runInBand --watchman=false`

Expected: PASS.

---

### Task 4: Mobile Purchasing-Power Client

**Files:**
- Create: `apps/frontend/src/features/simulation/api/getPurchasingPowerComparisons.ts`
- Create: `apps/frontend/src/features/simulation/api/getPurchasingPowerComparisons.test.ts`
- Create: `apps/frontend/src/shared/api/purchasingPowerValidators.ts`

**Successful outcome:** The mobile app can fetch and validate purchasing-power comparisons through `EXPO_PUBLIC_API_BASE_URL` and record fetch latency through the metrics helper.

**Resume bullet candidate:** Connected the React Native app to a validated purchasing-power REST API with React Query-ready client code, ensuring mobile users see tested city comparisons from the cloud backend instead of hardcoded screen data.

- [ ] **Step 1: Write client tests**

Mock `fetch` and assert the client calls `/api/purchasing-power/comparisons?city=phoenix&amountUsd=2500`, validates the payload, and records `crypto.client.purchasing_power.fetch`.

Run: `./node_modules/.bin/jest --runTestsByPath apps/frontend/src/features/simulation/api/getPurchasingPowerComparisons.test.ts --runInBand --watchman=false`

Expected: FAIL because the client does not exist.

- [ ] **Step 2: Add frontend validator re-export**

Create `apps/frontend/src/shared/api/purchasingPowerValidators.ts` that re-exports from `@shared/purchasingPowerValidators`.

- [ ] **Step 3: Add API client**

Create `getPurchasingPowerComparisons.ts` using `getCryptoApiUrl`, `timeAsync`, and `isPurchasingPowerResponse`. The client accepts `{ city, amountUsd }` and returns `PurchasingPowerResponse`.

- [ ] **Step 4: Run focused tests**

Run: `./node_modules/.bin/jest --runTestsByPath apps/frontend/src/features/simulation/api/getPurchasingPowerComparisons.test.ts --runInBand --watchman=false`

Expected: PASS.

---

### Task 5: Simulation Screen City Selector and Comparisons

**Files:**
- Modify: `apps/frontend/src/features/simulation/screens/simulationScreen.tsx`
- Modify: `apps/frontend/src/features/simulation/screens/simulationScreen.test.ts`

**Successful outcome:** After a successful simulation, the user can choose Phoenix, San Francisco, New York, Austin, or Seattle and see monthly essentials plus big-purchase comparisons.

**Resume bullet candidate:** Added a React Native comparison experience that explains crypto simulation results through city-specific rent, groceries, transportation, laptop, vacation, and used-car budget equivalents, making the app demo understandable to non-technical users.

- [ ] **Step 1: Add failing screen tests**

Extend `simulationScreen.test.ts` to assert:
- Phoenix is selected by default
- city chips render for all five cities
- successful simulation triggers purchasing-power fetch with `currentValueUsd`
- comparison cards render monthly essentials and big purchases
- API error renders a short retryable message

Run: `./node_modules/.bin/jest --runTestsByPath apps/frontend/src/features/simulation/screens/simulationScreen.test.ts --runInBand --watchman=false`

Expected: FAIL because comparison UI is absent.

- [ ] **Step 2: Add city state and query**

In `simulationScreen.tsx`, add `selectedCity`, a `useQuery` keyed by successful `latestResult.result.currentValueUsd`, and call `getPurchasingPowerComparisons`.

- [ ] **Step 3: Render comparison sections**

After the simulation result grid, render:
- city selector chips
- `Monthly essentials` section
- `Big purchases` section
- data source line with dataset version
- loading and retry states

- [ ] **Step 4: Run focused tests**

Run: `./node_modules/.bin/jest --runTestsByPath apps/frontend/src/features/simulation/screens/simulationScreen.test.ts --runInBand --watchman=false`

Expected: PASS.

---

### Task 6: Simulation Asset Catalog Expansion UI

**Files:**
- Create: `apps/frontend/src/features/simulation/api/getSimulationAssets.ts`
- Create: `apps/frontend/src/features/simulation/api/getSimulationAssets.test.ts`
- Modify: `apps/frontend/src/features/simulation/screens/simulationScreen.tsx`
- Modify: `apps/frontend/src/features/simulation/screens/simulationScreen.test.ts`

**Successful outcome:** The Simulation screen shows a broader asset catalog summary from `/api/simulation/assets`, while only ready simulation assets can be selected for the v1 scenario builder.

**Resume bullet candidate:** Expanded the simulator from a three-coin selector into a catalog-aware discovery experience, showing 100 imported crypto assets with ready/unavailable states so users understand product scale and data limitations.

- [ ] **Step 1: Add client tests**

Mock `/api/simulation/assets` and validate success/error responses through the existing shared asset catalog validator.

Run: `./node_modules/.bin/jest --runTestsByPath apps/frontend/src/features/simulation/api/getSimulationAssets.test.ts --runInBand --watchman=false`

Expected: FAIL because the client does not exist.

- [ ] **Step 2: Add API client**

Create `getSimulationAssets.ts` using `timeAsync('crypto.client.simulation_assets.fetch', ...)` and `isSimulationAssetCatalogResponse`.

- [ ] **Step 3: Add catalog summary UI**

In `simulationScreen.tsx`, add a compact section that displays:
- ready count
- unavailable count
- current market cache status
- top ready assets by market rank when present
- unavailable reason for at least the first unavailable asset

Do not enable non-BTC/ETH/SOL simulation until the backend price/history services support dynamic asset symbols.

- [ ] **Step 4: Run focused tests**

Run: `./node_modules/.bin/jest --runTestsByPath apps/frontend/src/features/simulation/api/getSimulationAssets.test.ts apps/frontend/src/features/simulation/screens/simulationScreen.test.ts --runInBand --watchman=false`

Expected: PASS.

---

### Task 7: Backend Observability Metrics

**Files:**
- Modify: `apps/backend/src/domains/purchasing-power/purchasingPowerService.ts`
- Modify: `apps/backend/src/domains/simulation/simulationAssetsService.ts`
- Modify: `apps/backend/src/domains/simulation/simulationPriceService.ts`
- Modify: `docs/project-reference/metrics.md`
- Test: `apps/backend/__tests__/api/purchasing-power-api.test.ts`
- Test: `apps/backend/__tests__/api/simulation-assets-api.test.ts`
- Test: `apps/backend/__tests__/api/simulation-prices-api.test.ts`

**Successful outcome:** Backend metrics capture purchasing-power calculation count, city id, amount bucket, simulation cache status, D1 lookup outcome, and asset catalog readiness counts.

**Resume bullet candidate:** Added backend observability for simulation calculations, cache behavior, and city comparison usage, creating measurable reliability signals instead of relying on manual API inspection.

- [ ] **Step 1: Add metric expectations to tests**

Assert that purchasing-power success records `crypto.api.purchasing_power.compute`, simulation asset catalog records `crypto.api.simulation_assets.catalog`, and simulation price success includes current cache status metadata.

Run: `./node_modules/.bin/jest --runTestsByPath apps/backend/__tests__/api/purchasing-power-api.test.ts apps/backend/__tests__/api/simulation-assets-api.test.ts apps/backend/__tests__/api/simulation-prices-api.test.ts --runInBand --watchman=false`

Expected: FAIL for new metric expectations.

- [ ] **Step 2: Add backend metric calls**

Use the existing `recordMetric` helper in backend services. Metadata must stay small: city id, amount bucket, ready count, unavailable count, asset symbol, date resolution, cache status.

- [ ] **Step 3: Document event catalog**

Update `docs/project-reference/metrics.md` with:
- `crypto.api.purchasing_power.compute`
- `crypto.client.purchasing_power.fetch`
- `crypto.client.simulation_assets.fetch`
- `crypto.api.simulation_assets.catalog`

- [ ] **Step 4: Run focused tests**

Run: `./node_modules/.bin/jest --runTestsByPath apps/backend/__tests__/api/purchasing-power-api.test.ts apps/backend/__tests__/api/simulation-assets-api.test.ts apps/backend/__tests__/api/simulation-prices-api.test.ts apps/frontend/src/features/simulation/api/getPurchasingPowerComparisons.test.ts apps/frontend/src/features/simulation/api/getSimulationAssets.test.ts --runInBand --watchman=false`

Expected: PASS.

---

### Task 8: CI/CD Quality Workflow

**Files:**
- Create: `.github/workflows/quality.yml`
- Modify: `README.md`
- Modify: `docs/project-reference/troubleshooting.md`

**Successful outcome:** GitHub Actions runs install, Jest, and TypeScript checks on pull requests and pushes.

**Resume bullet candidate:** Added CI/CD quality gates with GitHub Actions, Jest, and TypeScript checks, giving the project an automated regression signal before backend or mobile changes are merged.

- [ ] **Step 1: Create workflow**

Create `.github/workflows/quality.yml`:

```yaml
name: Quality

on:
  pull_request:
  push:
    branches:
      - main

jobs:
  test-and-typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: ./node_modules/.bin/jest --runInBand --watchman=false
      - run: ./node_modules/.bin/tsc --noEmit
```

- [ ] **Step 2: Document verification**

Add the same commands to `README.md` and `docs/project-reference/troubleshooting.md` under project quality checks.

- [ ] **Step 3: Run local verification**

Run: `./node_modules/.bin/jest --runInBand --watchman=false`

Expected: PASS.

Run: `./node_modules/.bin/tsc --noEmit`

Expected: PASS.

---

### Task 9: Demo Result Summary

**Files:**
- Create: `docs/demo/crypto-simulator-x-factor-demo.md`
- Modify: `crypto-market-simulator.md`

**Successful outcome:** The repo contains a deterministic demo script and updated resume project file with measurable, recruiter-readable bullets.

**Resume bullet candidate:** Created a demo-ready project narrative that shows one crypto simulation across five cities, translating backend data work into user outcomes a recruiter can understand in under 15 seconds.

- [ ] **Step 1: Write demo script**

Create `docs/demo/crypto-simulator-x-factor-demo.md` with:
- setup command
- user flow
- sample scenario: BTC, 2021-01-01, `$500`, Phoenix
- expected comparison sections
- API endpoints to call manually
- screenshots to capture after local app verification

- [ ] **Step 2: Update resume project file**

Update `crypto-market-simulator.md` Impact bullets to include:
- five-city purchasing-power comparisons
- 100-asset catalog visibility
- backend metric events
- CI quality gate

Only keep `[ESTIMATE]` on values that are not code-owned or directly measured.

- [ ] **Step 3: Verify docs**

Run: `rg 'UNRESOLVED_PLACEHOLDER|UNRESOLVED_DECISION|UNWRITTEN_SECTION' docs/demo/crypto-simulator-x-factor-demo.md crypto-market-simulator.md`

Expected: no matches.

---

## Final Verification

- [ ] Run all Jest tests:

```bash
./node_modules/.bin/jest --runInBand --watchman=false
```

Expected: PASS.

- [ ] Run TypeScript:

```bash
./node_modules/.bin/tsc --noEmit
```

Expected: PASS.

- [ ] Run focused backend API smoke checks after local Worker dev starts:

```bash
npm run backend:dev
```

Then verify:

```bash
curl 'http://127.0.0.1:8787/api/purchasing-power/comparisons?city=phoenix&amountUsd=2500'
curl 'http://127.0.0.1:8787/api/simulation/assets'
```

Expected: JSON success responses with city comparisons and asset catalog counts.

---

## Plan Self-Review

- Spec coverage: all five requested X-factor elements are covered by Tasks 1-9.
- Placeholder scan: no placeholder tokens should remain in this plan.
- Type consistency: purchasing-power city ids, response names, metric names, and route paths are defined once and reused consistently.
- Scope control: v1 uses curated static purchasing-power data, keeps dynamic simulation assets out of the price/history services, and focuses CI on existing Jest/TypeScript checks.
