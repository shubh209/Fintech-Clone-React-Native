# Event-Based Simulation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a trusted event-based Simulation mode where users choose a sourced BTC/ETH/SOL news event, select a reaction delay, and see current outcome plus historical risk metrics.

**Architecture:** Keep event content and scenario math server-owned. Store curated events and sources in Cloudflare D1, expose Worker endpoints under `/api/simulation`, validate responses through `packages/shared`, and let the React Native screen render an `Event` mode beside the existing `Date` mode. Risk metrics use static D1 historical rows for reproducible analytics while current value continues through the existing CoinGecko/cache path.

**Tech Stack:** TypeScript, Hono, Cloudflare Workers, Cloudflare D1, React Native, Expo Router, React Query, shared runtime validators, Jest, Wrangler, SQL migrations.

---

## Implementation Checkpoints

Checkpoint 1 local proof:

- Shared event contracts validate good and bad payloads.
- Local D1-style repository tests prove event/source loading.
- Risk metric unit tests prove drawdown, underwater, and rolling 30-day calculations.
- Backend route tests prove event list and event scenario responses.

Checkpoint 2 app proof:

- Frontend API clients validate Worker responses.
- Simulation screen has `Date | Event` mode without breaking Date mode.
- Saved simulations distinguish event-based results.
- Source-boundary tests prove no trading/product language drift.

Checkpoint 3 release proof:

- Full Jest and TypeScript pass.
- Remote D1 migration/import and Worker deploy are verified.
- Live endpoints return sourced events and scenario results.
- `crypto-market-simulator.md` is updated with non-technical why/where bullets.

## File Structure

Create:

- `apps/backend/migrations/0004_simulation_events.sql` - D1 event/source schema and seed rows.
- `apps/backend/src/domains/simulation/simulationEventRepository.ts` - D1 reads for events, sources, and event scenario input data.
- `apps/backend/src/domains/simulation/simulationEventRiskMetrics.ts` - pure risk metric calculations.
- `apps/backend/src/domains/simulation/simulationEventScenarioService.ts` - validates event scenario request, resolves delay date, computes result and risk journey.
- `apps/frontend/src/features/simulation/api/getSimulationEvents.ts` - fetches `/api/simulation/events`.
- `apps/frontend/src/features/simulation/api/getSimulationEventScenario.ts` - fetches `/api/simulation/event-scenarios`.
- `apps/frontend/src/features/simulation/api/getSimulationEvents.test.ts` - frontend event list client tests.
- `apps/frontend/src/features/simulation/api/getSimulationEventScenario.test.ts` - frontend event scenario client tests.
- `apps/backend/__tests__/simulation/simulationEventRepository.test.ts` - repository tests.
- `apps/backend/__tests__/simulation/simulationEventRiskMetrics.test.ts` - pure risk metrics tests.
- `apps/backend/__tests__/api/simulation-events-api.test.ts` - route tests.

Modify:

- `packages/shared/src/simulationTypes.ts` - add event list and scenario response contracts.
- `packages/shared/src/simulationValidators.ts` - add runtime validators for event responses.
- `packages/shared/src/index.ts` - export new types/validators through existing barrel.
- `apps/frontend/src/shared/api/simulationValidators.ts` - already re-exports shared validators; confirm no change needed after type additions.
- `apps/backend/src/domains/simulation/historicalPriceRepository.ts` - reuse `findHistoricalPriceSeries` for risk metric rows from the resolved buy date through `simulationHistoricalDateRange.max`.
- `apps/backend/src/domains/simulation/simulationRoutes.ts` - register `/events` and `/event-scenarios`.
- `apps/frontend/src/features/simulation/screens/simulationScreen.tsx` - add `Date | Event` mode, event feed, delay selector, event result panel, and saved event metadata.
- `apps/frontend/src/features/simulation/storage/savedSimulationsStore.ts` - extend saved simulation shape with optional event metadata.
- `apps/frontend/src/features/simulation/screens/simulationScreen.test.ts` - add source-boundary coverage for Event mode.
- `docs/project-reference/architecture.md`, `docs/project-reference/issues.md`, `docs/project-reference/troubleshooting.md`, `docs/project-reference/metrics.md` - document endpoints, metrics, and manual checks.
- `crypto-market-simulator.md` - update impact and how-it-works after verification.

## Event Seed Review Standard

Seed 15 events: 5 BTC, 5 ETH, 5 SOL.

Every active seed row must include:

- stable event id
- asset symbol
- headline
- 1-2 sentence summary
- exact event date
- category
- market sentiment
- sort order
- status `active`
- at least 2 source rows with title, publisher, URL, and published date when known

The event list should include mixed context:

- adoption or institutional access
- regulation or legal recognition
- protocol/network milestone
- crash, outage, or trust shock
- ecosystem milestone

Candidate events to validate before writing seed inserts:

| Asset | Event date | Event id | Headline |
| --- | --- | --- | --- |
| BTC | 2020-05-11 | `btc-2020-halving` | Bitcoin completes its third halving |
| BTC | 2021-02-08 | `btc-2021-tesla-bitcoin` | Tesla discloses a $1.5B Bitcoin purchase |
| BTC | 2021-09-07 | `btc-2021-el-salvador-legal-tender` | El Salvador adopts Bitcoin as legal tender |
| BTC | 2022-11-11 | `btc-2022-ftx-bankruptcy` | FTX files for bankruptcy after a liquidity crisis |
| BTC | 2024-01-10 | `btc-2024-spot-etf-approval` | U.S. spot Bitcoin ETFs are approved |
| ETH | 2020-12-01 | `eth-2020-beacon-chain` | Ethereum Beacon Chain launches |
| ETH | 2021-08-05 | `eth-2021-london-eip1559` | Ethereum activates London and EIP-1559 |
| ETH | 2022-09-15 | `eth-2022-merge` | Ethereum completes The Merge |
| ETH | 2023-04-12 | `eth-2023-shapella` | Ethereum activates Shapella staking withdrawals |
| ETH | 2024-05-23 | `eth-2024-spot-etf-approval` | U.S. spot Ether ETF listing applications are approved |
| SOL | 2021-06-09 | `sol-2021-private-token-sale` | Solana Labs announces a $314M private token sale |
| SOL | 2021-09-14 | `sol-2021-network-outage` | Solana network suffers a major outage |
| SOL | 2022-11-11 | `sol-2022-ftx-contagion` | FTX bankruptcy hits the Solana ecosystem |
| SOL | 2023-04-13 | `sol-2023-saga-launch` | Solana Mobile launches Saga |
| SOL | 2024-01-24 | `sol-2024-token-extensions` | Solana launches token extensions |

Source review command:

```bash
rg -n "INSERT OR REPLACE INTO simulation_event_sources|https://" apps/backend/migrations/0004_simulation_events.sql
```

Expected result:

- At least 30 source insert rows.
- Every active event id appears in at least 2 source rows.
- No source URL is empty.

---

### Task 1: Shared Event Contracts And Validators

**Files:**

- Modify: `packages/shared/src/simulationTypes.ts`
- Modify: `packages/shared/src/simulationValidators.ts`
- Test: `apps/frontend/src/shared/api/simulationValidators.test.ts`

- [ ] **Step 1: Write failing shared validator tests**

Add tests that prove the new event list and scenario response shapes are accepted and malformed source metadata is rejected.

```ts
import {
  isSimulationEventListResponse,
  isSimulationEventScenarioResponse,
} from '@shared/simulationValidators';

describe('simulation event validators', () => {
  it('accepts a sourced simulation event list response', () => {
    expect(
      isSimulationEventListResponse({
        status: 'success',
        asset: { symbol: 'BTC', name: 'Bitcoin', coinGeckoId: 'bitcoin' },
        supportedDelays: ['same_day', 'one_week', 'one_month'],
        events: [
          {
            id: 'btc-2024-spot-etf-approval',
            assetSymbol: 'BTC',
            headline: 'U.S. spot Bitcoin ETFs are approved',
            summary: 'The SEC approved exchange rule changes allowing spot Bitcoin ETFs.',
            eventDate: '2024-01-10',
            category: 'adoption',
            marketSentiment: 'positive',
            sortOrder: 5,
            sources: [
              {
                title: 'Statement on the Approval of Spot Bitcoin Exchange-Traded Products',
                publisher: 'SEC',
                url: 'https://www.sec.gov/newsroom/speeches-statements/gensler-statement-spot-bitcoin-011023',
                publishedAt: '2024-01-10',
              },
              {
                title: 'SEC approves bitcoin ETFs',
                publisher: 'Reuters',
                url: 'https://www.reuters.com/technology/us-sec-approves-bitcoin-etfs-watershed-crypto-market-2024-01-10/',
                publishedAt: '2024-01-10',
              },
            ],
          },
        ],
      })
    ).toBe(true);
  });

  it('rejects an active event without two source rows', () => {
    expect(
      isSimulationEventListResponse({
        status: 'success',
        asset: { symbol: 'BTC', name: 'Bitcoin', coinGeckoId: 'bitcoin' },
        supportedDelays: ['same_day', 'one_week', 'one_month'],
        events: [
          {
            id: 'btc-2024-spot-etf-approval',
            assetSymbol: 'BTC',
            headline: 'U.S. spot Bitcoin ETFs are approved',
            summary: 'The SEC approved exchange rule changes allowing spot Bitcoin ETFs.',
            eventDate: '2024-01-10',
            category: 'adoption',
            marketSentiment: 'positive',
            sortOrder: 5,
            sources: [],
          },
        ],
      })
    ).toBe(false);
  });

  it('accepts an event scenario response with risk metrics', () => {
    expect(
      isSimulationEventScenarioResponse({
        status: 'success',
        event: {
          id: 'btc-2024-spot-etf-approval',
          assetSymbol: 'BTC',
          headline: 'U.S. spot Bitcoin ETFs are approved',
          summary: 'The SEC approved exchange rule changes allowing spot Bitcoin ETFs.',
          eventDate: '2024-01-10',
          category: 'adoption',
          marketSentiment: 'positive',
          sources: [
            {
              title: 'Statement on the Approval of Spot Bitcoin Exchange-Traded Products',
              publisher: 'SEC',
              url: 'https://www.sec.gov/newsroom/speeches-statements/gensler-statement-spot-bitcoin-011023',
              publishedAt: '2024-01-10',
            },
            {
              title: 'SEC approves bitcoin ETFs',
              publisher: 'Reuters',
              url: 'https://www.reuters.com/technology/us-sec-approves-bitcoin-etfs-watershed-crypto-market-2024-01-10/',
              publishedAt: '2024-01-10',
            },
          ],
        },
        asset: { symbol: 'BTC', name: 'Bitcoin', coinGeckoId: 'bitcoin' },
        input: {
          delay: 'one_week',
          amountUsd: 500,
          intendedBuyDate: '2024-01-17',
        },
        historical: {
          requestedDate: '2024-01-17',
          resolvedDate: '2024-01-17',
          dateResolution: 'exact',
          priceUsd: 42000,
          source: {
            source: 'fallback',
            provider: 'historical_csv',
            updatedAt: '2026-05-22T01:00:00.000Z',
            isFallback: true,
            reason: 'curated historical dataset',
          },
        },
        current: {
          priceUsd: 84000,
          source: {
            source: 'live',
            provider: 'coingecko',
            updatedAt: '2026-06-10T00:00:00.000Z',
            isFallback: false,
          },
          cache: { status: 'refreshed', ttlSeconds: 60 },
        },
        result: {
          impliedQuantity: 0.0119047619,
          currentValueUsd: 1000,
          gainLossUsd: 500,
          gainLossPercent: 100,
        },
        risk: {
          maxDrawdownPercent: -24,
          longestUnderwaterDays: 45,
          bestThirtyDayReturnPercent: 38,
          worstThirtyDayReturnPercent: -18,
          startDate: '2024-01-17',
          endDate: '2026-03-22',
        },
        takeaway:
          'This scenario ended profitable, but you would have sat through a 24% drawdown before the long-term gain.',
      })
    ).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
./node_modules/.bin/jest apps/frontend/src/shared/api/simulationValidators.test.ts --runInBand --watchman=false
```

Expected: fails because `isSimulationEventListResponse` and `isSimulationEventScenarioResponse` are not exported.

- [ ] **Step 3: Add event contracts**

Add to `packages/shared/src/simulationTypes.ts`:

```ts
export type SimulationEventDelay = 'same_day' | 'one_week' | 'one_month';
export type SimulationEventCategory =
  | 'adoption'
  | 'regulation'
  | 'crash'
  | 'exchange_failure'
  | 'protocol_upgrade'
  | 'ecosystem';
export type SimulationEventMarketSentiment = 'positive' | 'negative' | 'mixed';

export interface SimulationEventSource {
  title: string;
  publisher: string;
  url: string;
  publishedAt: string | null;
}

export interface SimulationEventSummary {
  id: string;
  assetSymbol: SimulationAssetSymbol;
  headline: string;
  summary: string;
  eventDate: string;
  category: SimulationEventCategory;
  marketSentiment: SimulationEventMarketSentiment;
  sortOrder?: number;
  sources: SimulationEventSource[];
}

export interface SimulationEventListSuccessResponse {
  status: 'success';
  asset: {
    symbol: SimulationAssetSymbol;
    name: string;
    coinGeckoId: string;
  };
  supportedDelays: SimulationEventDelay[];
  events: SimulationEventSummary[];
}

export interface SimulationEventRiskMetrics {
  maxDrawdownPercent: number;
  longestUnderwaterDays: number;
  bestThirtyDayReturnPercent: number;
  worstThirtyDayReturnPercent: number;
  startDate: string;
  endDate: string;
}

export interface SimulationEventScenarioSuccessResponse extends SimulationPriceSuccessResponse {
  event: Omit<SimulationEventSummary, 'sortOrder'>;
  input: SimulationPriceSuccessResponse['input'] & {
    delay: SimulationEventDelay;
    intendedBuyDate: string;
  };
  risk: SimulationEventRiskMetrics;
  takeaway: string;
}

export type SimulationEventListResponse =
  | SimulationEventListSuccessResponse
  | SimulationPriceErrorResponse
  | SimulationPriceUnavailableResponse;

export type SimulationEventScenarioResponse =
  | SimulationEventScenarioSuccessResponse
  | SimulationPriceErrorResponse
  | SimulationPriceUnavailableResponse;
```

- [ ] **Step 4: Add validators**

Add focused helpers to `packages/shared/src/simulationValidators.ts`:

```ts
function isSimulationEventDelay(value: unknown) {
  return value === 'same_day' || value === 'one_week' || value === 'one_month';
}

function isSimulationEventCategory(value: unknown) {
  return (
    value === 'adoption' ||
    value === 'regulation' ||
    value === 'crash' ||
    value === 'exchange_failure' ||
    value === 'protocol_upgrade' ||
    value === 'ecosystem'
  );
}

function isSimulationEventMarketSentiment(value: unknown) {
  return value === 'positive' || value === 'negative' || value === 'mixed';
}

function isSimulationEventSource(value: unknown) {
  if (!isRecord(value)) return false;
  return (
    isString(value.title) &&
    isString(value.publisher) &&
    isString(value.url) &&
    (value.publishedAt === null || isString(value.publishedAt))
  );
}

function isSimulationEventSummary(value: unknown) {
  if (!isRecord(value)) return false;
  return (
    isString(value.id) &&
    isSimulationAssetSymbol(value.assetSymbol) &&
    isString(value.headline) &&
    isString(value.summary) &&
    isString(value.eventDate) &&
    isSimulationEventCategory(value.category) &&
    isSimulationEventMarketSentiment(value.marketSentiment) &&
    (value.sortOrder === undefined || isFiniteNumber(value.sortOrder)) &&
    Array.isArray(value.sources) &&
    value.sources.length >= 2 &&
    value.sources.every(isSimulationEventSource)
  );
}
```

Export `isSimulationEventListResponse` and `isSimulationEventScenarioResponse` using the same error/unavailable pattern as existing simulation responses.

- [ ] **Step 5: Run validator tests**

Run:

```bash
./node_modules/.bin/jest apps/frontend/src/shared/api/simulationValidators.test.ts --runInBand --watchman=false
```

Expected: PASS.

**Measurable result:** Shared response validation coverage increases from price/history only to price/history/event-list/event-scenario contracts.

**Resume bullet candidate:** Added TypeScript runtime contracts and validators for event-driven crypto simulations, keeping mobile and Worker API behavior aligned so sourced historical scenarios render safely for non-technical users.

---

### Task 2: D1 Event Schema And Seed Migration

**Files:**

- Create: `apps/backend/migrations/0004_simulation_events.sql`
- Test: `apps/backend/__tests__/simulation/simulationEventRepository.test.ts`

- [ ] **Step 1: Create the D1 schema migration**

Create `apps/backend/migrations/0004_simulation_events.sql` with this schema first:

```sql
CREATE TABLE IF NOT EXISTS simulation_events (
  id TEXT PRIMARY KEY,
  asset_symbol TEXT NOT NULL,
  headline TEXT NOT NULL,
  summary TEXT NOT NULL,
  event_date TEXT NOT NULL,
  category TEXT NOT NULL,
  market_sentiment TEXT NOT NULL,
  sort_order INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  provider TEXT,
  external_id TEXT,
  confidence_score REAL,
  ingested_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS simulation_event_sources (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL,
  title TEXT NOT NULL,
  publisher TEXT NOT NULL,
  url TEXT NOT NULL,
  published_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (event_id) REFERENCES simulation_events(id)
);

CREATE INDEX IF NOT EXISTS idx_simulation_events_asset_status_sort
  ON simulation_events(asset_symbol, status, sort_order);

CREATE INDEX IF NOT EXISTS idx_simulation_event_sources_event
  ON simulation_event_sources(event_id);
```

- [ ] **Step 2: Add seed rows after source review**

For each event in the seed review matrix, insert one `simulation_events` row and at least two `simulation_event_sources` rows. Use `INSERT OR REPLACE` so local and remote D1 can reapply safely during iteration.

Use this row shape:

```sql
INSERT OR REPLACE INTO simulation_events (
  id,
  asset_symbol,
  headline,
  summary,
  event_date,
  category,
  market_sentiment,
  sort_order,
  status,
  provider,
  external_id,
  confidence_score,
  ingested_at
) VALUES (
  'btc-2024-spot-etf-approval',
  'BTC',
  'U.S. spot Bitcoin ETFs are approved',
  'The SEC approved exchange rule changes that allowed spot Bitcoin ETF products, giving everyday investors a more familiar way to access Bitcoin exposure through brokerage accounts.',
  '2024-01-10',
  'adoption',
  'positive',
  5,
  'active',
  'manual',
  NULL,
  1.0,
  NULL
);

INSERT OR REPLACE INTO simulation_event_sources (
  id,
  event_id,
  title,
  publisher,
  url,
  published_at
) VALUES (
  'src-btc-2024-spot-etf-approval-sec',
  'btc-2024-spot-etf-approval',
  'Statement on the Approval of Spot Bitcoin Exchange-Traded Products',
  'SEC',
  'https://www.sec.gov/newsroom/speeches-statements/gensler-statement-spot-bitcoin-011023',
  '2024-01-10'
);
```

- [ ] **Step 3: Run source review**

Run:

```bash
rg -n "INSERT OR REPLACE INTO simulation_events|INSERT OR REPLACE INTO simulation_event_sources|https://" apps/backend/migrations/0004_simulation_events.sql
```

Expected:

- 15 event inserts.
- At least 30 source inserts.
- At least 30 `https://` source URLs.

**Measurable result:** D1 seed coverage starts at 15 curated events and 30+ source rows across 3 simulation assets.

**Resume bullet candidate:** Designed a Cloudflare D1 event dataset with 15 curated BTC/ETH/SOL market events and 30+ source records, giving users sourced historical decision points instead of abstract chart dates.

---

### Task 3: Event Repository

**Files:**

- Create: `apps/backend/src/domains/simulation/simulationEventRepository.ts`
- Test: `apps/backend/__tests__/simulation/simulationEventRepository.test.ts`

- [ ] **Step 1: Write failing repository tests**

Test source grouping, active filtering, and two-source readiness.

```ts
import {
  listSimulationEvents,
  getSimulationEventById,
} from '../../../src/domains/simulation/simulationEventRepository';
import { SqlDatabase } from '../../../src/types';

function fakeEventDb(): SqlDatabase {
  const events = [
    {
      id: 'btc-2024-spot-etf-approval',
      asset_symbol: 'BTC',
      headline: 'U.S. spot Bitcoin ETFs are approved',
      summary: 'The SEC approved exchange rule changes for spot Bitcoin ETFs.',
      event_date: '2024-01-10',
      category: 'adoption',
      market_sentiment: 'positive',
      sort_order: 1,
      status: 'active',
    },
  ];
  const sources = [
    {
      id: 'src-1',
      event_id: 'btc-2024-spot-etf-approval',
      title: 'SEC statement',
      publisher: 'SEC',
      url: 'https://www.sec.gov/newsroom/speeches-statements/gensler-statement-spot-bitcoin-011023',
      published_at: '2024-01-10',
    },
    {
      id: 'src-2',
      event_id: 'btc-2024-spot-etf-approval',
      title: 'Reuters report',
      publisher: 'Reuters',
      url: 'https://www.reuters.com/technology/us-sec-approves-bitcoin-etfs-watershed-crypto-market-2024-01-10/',
      published_at: '2024-01-10',
    },
  ];

  return {
    prepare: (query: string) => ({
      bind: (...values: unknown[]) => ({
        all: async () => {
          if (query.includes('FROM simulation_events')) {
            const [assetSymbol] = values;
            return { results: events.filter((event) => event.asset_symbol === assetSymbol) };
          }
          if (query.includes('FROM simulation_event_sources')) {
            const [eventId] = values;
            return { results: sources.filter((source) => source.event_id === eventId) };
          }
          return { results: [] };
        },
        first: async () => {
          const [eventId] = values;
          return events.find((event) => event.id === eventId) ?? null;
        },
        run: async () => ({}),
      }),
      first: async () => null,
      all: async () => ({ results: [] }),
      run: async () => ({}),
    }),
  } as unknown as SqlDatabase;
}

describe('simulation event repository', () => {
  it('lists active sourced events for an asset', async () => {
    const events = await listSimulationEvents({ db: fakeEventDb(), assetSymbol: 'BTC' });

    expect(events).toHaveLength(1);
    expect(events[0].id).toBe('btc-2024-spot-etf-approval');
    expect(events[0].sources).toHaveLength(2);
  });

  it('loads one event by stable id with sources', async () => {
    const event = await getSimulationEventById({
      db: fakeEventDb(),
      eventId: 'btc-2024-spot-etf-approval',
    });

    expect(event?.headline).toBe('U.S. spot Bitcoin ETFs are approved');
    expect(event?.sources[0].publisher).toBe('SEC');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
./node_modules/.bin/jest apps/backend/__tests__/simulation/simulationEventRepository.test.ts --runInBand --watchman=false
```

Expected: fails because repository module does not exist.

- [ ] **Step 3: Implement repository**

Create `simulationEventRepository.ts` with:

```ts
import {
  SimulationAssetSymbol,
  SimulationEventCategory,
  SimulationEventMarketSentiment,
  SimulationEventSummary,
} from '../../../../../packages/shared/src';
import { SqlDatabase } from '../../types';

interface SimulationEventRow {
  id: string;
  asset_symbol: SimulationAssetSymbol;
  headline: string;
  summary: string;
  event_date: string;
  category: SimulationEventCategory;
  market_sentiment: SimulationEventMarketSentiment;
  sort_order: number;
  status: string;
}

interface SimulationEventSourceRow {
  title: string;
  publisher: string;
  url: string;
  published_at: string | null;
}

async function loadSources(db: SqlDatabase, eventId: string) {
  const rows = await db
    .prepare(
      `SELECT title, publisher, url, published_at
       FROM simulation_event_sources
       WHERE event_id = ?
       ORDER BY id ASC`
    )
    .bind(eventId)
    .all<SimulationEventSourceRow>();

  return rows.results.map((row) => ({
    title: row.title,
    publisher: row.publisher,
    url: row.url,
    publishedAt: row.published_at,
  }));
}

function toSummary(row: SimulationEventRow, sources: SimulationEventSummary['sources']) {
  return {
    id: row.id,
    assetSymbol: row.asset_symbol,
    headline: row.headline,
    summary: row.summary,
    eventDate: row.event_date,
    category: row.category,
    marketSentiment: row.market_sentiment,
    sortOrder: row.sort_order,
    sources,
  };
}

export async function listSimulationEvents({
  db,
  assetSymbol,
}: {
  db: SqlDatabase;
  assetSymbol: SimulationAssetSymbol;
}) {
  const rows = await db
    .prepare(
      `SELECT id, asset_symbol, headline, summary, event_date, category, market_sentiment, sort_order, status
       FROM simulation_events
       WHERE asset_symbol = ?
         AND status = 'active'
       ORDER BY sort_order ASC, event_date ASC`
    )
    .bind(assetSymbol)
    .all<SimulationEventRow>();

  const events = await Promise.all(
    rows.results.map(async (row) => toSummary(row, await loadSources(db, row.id)))
  );

  return events.filter((event) => event.sources.length >= 2);
}

export async function getSimulationEventById({
  db,
  eventId,
}: {
  db: SqlDatabase;
  eventId: string;
}) {
  const row = await db
    .prepare(
      `SELECT id, asset_symbol, headline, summary, event_date, category, market_sentiment, sort_order, status
       FROM simulation_events
       WHERE id = ?
         AND status = 'active'
       LIMIT 1`
    )
    .bind(eventId)
    .first<SimulationEventRow>();

  if (!row) return null;

  const sources = await loadSources(db, row.id);
  if (sources.length < 2) return null;

  return toSummary(row, sources);
}
```

- [ ] **Step 4: Run repository tests**

Run:

```bash
./node_modules/.bin/jest apps/backend/__tests__/simulation/simulationEventRepository.test.ts --runInBand --watchman=false
```

Expected: PASS.

**Measurable result:** Repository returns only sourced active events, reducing active event trust failures from possible to blocked by code.

**Resume bullet candidate:** Built a D1-backed event repository that filters unsourced crypto events before they reach mobile users, improving trust for historical simulation decisions.

---

### Task 4: Risk Metric Engine

**Files:**

- Create: `apps/backend/src/domains/simulation/simulationEventRiskMetrics.ts`
- Test: `apps/backend/__tests__/simulation/simulationEventRiskMetrics.test.ts`

- [ ] **Step 1: Write failing risk metric tests**

```ts
import { calculateSimulationEventRiskMetrics } from '../../../src/domains/simulation/simulationEventRiskMetrics';

describe('simulation event risk metrics', () => {
  it('calculates drawdown, underwater days, and rolling 30-day returns', () => {
    const points = Array.from({ length: 61 }, (_, index) => {
      const date = new Date('2024-01-01T00:00:00.000Z');
      date.setUTCDate(date.getUTCDate() + index);
      const priceUsd = index < 10 ? 100 - index * 5 : index < 31 ? 55 + index : 86 + index * 2;
      return { date: date.toISOString().slice(0, 10), priceUsd };
    });

    const risk = calculateSimulationEventRiskMetrics(points, 100);

    expect(risk.startDate).toBe('2024-01-01');
    expect(risk.endDate).toBe('2024-03-01');
    expect(risk.maxDrawdownPercent).toBeCloseTo(-45, 2);
    expect(risk.longestUnderwaterDays).toBeGreaterThan(20);
    expect(risk.bestThirtyDayReturnPercent).toBeGreaterThan(90);
    expect(risk.worstThirtyDayReturnPercent).toBeLessThan(50);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
./node_modules/.bin/jest apps/backend/__tests__/simulation/simulationEventRiskMetrics.test.ts --runInBand --watchman=false
```

Expected: fails because risk module does not exist.

- [ ] **Step 3: Implement pure risk metric engine**

```ts
import { SimulationEventRiskMetrics } from '../../../../../packages/shared/src';

interface RiskPoint {
  date: string;
  priceUsd: number;
}

function roundPercent(value: number) {
  return Math.round(value * 100) / 100;
}

function daysBetween(startDate: string, endDate: string) {
  const start = Date.parse(`${startDate}T00:00:00.000Z`);
  const end = Date.parse(`${endDate}T00:00:00.000Z`);
  return Math.max(0, Math.round((end - start) / 86_400_000));
}

export function calculateSimulationEventRiskMetrics(
  points: RiskPoint[],
  initialPriceUsd: number
): SimulationEventRiskMetrics {
  if (points.length === 0 || initialPriceUsd <= 0) {
    throw new Error('Risk metrics require at least one positive historical point.');
  }

  let peak = points[0].priceUsd;
  let maxDrawdownPercent = 0;
  let currentUnderwaterStart: string | null = null;
  let longestUnderwaterDays = 0;
  let bestThirtyDayReturnPercent = 0;
  let worstThirtyDayReturnPercent = 0;

  for (const point of points) {
    peak = Math.max(peak, point.priceUsd);
    const drawdown = ((point.priceUsd - peak) / peak) * 100;
    maxDrawdownPercent = Math.min(maxDrawdownPercent, drawdown);

    if (point.priceUsd < initialPriceUsd && currentUnderwaterStart === null) {
      currentUnderwaterStart = point.date;
    }

    if (point.priceUsd >= initialPriceUsd && currentUnderwaterStart !== null) {
      longestUnderwaterDays = Math.max(longestUnderwaterDays, daysBetween(currentUnderwaterStart, point.date));
      currentUnderwaterStart = null;
    }
  }

  if (currentUnderwaterStart !== null) {
    longestUnderwaterDays = Math.max(
      longestUnderwaterDays,
      daysBetween(currentUnderwaterStart, points[points.length - 1].date)
    );
  }

  for (let startIndex = 0; startIndex < points.length; startIndex += 1) {
    const start = points[startIndex];
    const targetEndDate = new Date(`${start.date}T00:00:00.000Z`);
    targetEndDate.setUTCDate(targetEndDate.getUTCDate() + 30);
    const endDateText = targetEndDate.toISOString().slice(0, 10);
    const end = points.find((point) => point.date >= endDateText);
    if (!end) continue;

    const returnPercent = ((end.priceUsd - start.priceUsd) / start.priceUsd) * 100;
    bestThirtyDayReturnPercent = Math.max(bestThirtyDayReturnPercent, returnPercent);
    worstThirtyDayReturnPercent = Math.min(worstThirtyDayReturnPercent, returnPercent);
  }

  return {
    maxDrawdownPercent: roundPercent(maxDrawdownPercent),
    longestUnderwaterDays,
    bestThirtyDayReturnPercent: roundPercent(bestThirtyDayReturnPercent),
    worstThirtyDayReturnPercent: roundPercent(worstThirtyDayReturnPercent),
    startDate: points[0].date,
    endDate: points[points.length - 1].date,
  };
}
```

- [ ] **Step 4: Run risk tests**

Run:

```bash
./node_modules/.bin/jest apps/backend/__tests__/simulation/simulationEventRiskMetrics.test.ts --runInBand --watchman=false
```

Expected: PASS.

**Measurable result:** Risk analytics coverage increases from 0 to 4 calculated metrics: max drawdown, underwater days, best 30-day return, worst 30-day return.

**Resume bullet candidate:** Implemented a deterministic historical risk engine using daily D1 price series, helping non-technical users understand the downside journey after reacting to major crypto news.

---

### Task 5: Worker Event APIs

**Files:**

- Create: `apps/backend/src/domains/simulation/simulationEventScenarioService.ts`
- Modify: `apps/backend/src/domains/simulation/simulationRoutes.ts`
- Test: `apps/backend/__tests__/api/simulation-events-api.test.ts`

- [ ] **Step 1: Write failing route tests**

Cover:

- `/api/simulation/events?asset=BTC` returns sourced events.
- unsupported asset returns `unsupported_asset`.
- `/api/simulation/event-scenarios` returns risk metrics and event metadata.
- missing event id returns validation error.

Use the fake DB style from `apps/backend/__tests__/api/simulation-prices-api.test.ts`, extended to return event rows, source rows, and historical price rows based on the incoming SQL table name.

- [ ] **Step 2: Run route tests to verify failure**

Run:

```bash
./node_modules/.bin/jest apps/backend/__tests__/api/simulation-events-api.test.ts --runInBand --watchman=false
```

Expected: fails with missing routes.

- [ ] **Step 3: Implement service request validation**

In `simulationEventScenarioService.ts`, define:

```ts
const supportedDelays = ['same_day', 'one_week', 'one_month'] as const;

function addDelay(eventDate: string, delay: string) {
  const value = new Date(`${eventDate}T00:00:00.000Z`);
  if (delay === 'one_week') value.setUTCDate(value.getUTCDate() + 7);
  if (delay === 'one_month') value.setUTCMonth(value.getUTCMonth() + 1);
  return value.toISOString().slice(0, 10);
}

function isSupportedDelay(value: unknown): value is (typeof supportedDelays)[number] {
  return value === 'same_day' || value === 'one_week' || value === 'one_month';
}
```

- [ ] **Step 4: Implement event list service**

Create `getSimulationEvents({ env, asset })` that:

- validates asset with `isSimulationAssetSymbol`
- checks `env.HISTORICAL_PRICES_DB`
- calls `listSimulationEvents`
- returns `SimulationEventListResponse`
- records metric `crypto.api.simulation_events.list`

- [ ] **Step 5: Implement event scenario service**

Create `getSimulationEventScenario({ env, eventId, delay, amountUsd, now })` that:

- validates event id, delay, and amount
- loads event from `getSimulationEventById`
- calculates intended buy date
- resolves historical buy price with `findHistoricalPrice`
- loads price series with `findHistoricalPriceSeries`
- gets current price through existing `getCachedCurrentPrices`
- computes result using the same formula as `getSimulationPrice`
- computes risk with `calculateSimulationEventRiskMetrics`
- returns deterministic takeaway
- records metric `crypto.api.simulation_event_scenarios.compute`

Takeaway template:

```ts
function createTakeaway({
  gainLossPercent,
  maxDrawdownPercent,
  longestUnderwaterDays,
}: {
  gainLossPercent: number;
  maxDrawdownPercent: number;
  longestUnderwaterDays: number;
}) {
  const outcome = gainLossPercent >= 0 ? 'ended profitable' : 'ended down';
  return `This scenario ${outcome}, but you would have sat through a ${Math.abs(
    Math.round(maxDrawdownPercent)
  )}% drawdown and ${longestUnderwaterDays} days below the starting value before the final outcome.`;
}
```

- [ ] **Step 6: Register routes**

Modify `simulationRoutes.ts`:

```ts
simulationRoutes.get('/events', async (context) => {
  const result = await getSimulationEvents({
    env: context.env,
    asset: context.req.query('asset'),
  });

  return context.json(result.body, result.status as 200);
});

simulationRoutes.get('/event-scenarios', async (context) => {
  const result = await getSimulationEventScenario({
    env: context.env,
    eventId: context.req.query('eventId'),
    delay: context.req.query('delay'),
    amountUsd: context.req.query('amountUsd'),
  });

  return context.json(result.body, result.status as 200);
});
```

- [ ] **Step 7: Run backend event tests**

Run:

```bash
./node_modules/.bin/jest apps/backend/__tests__/api/simulation-events-api.test.ts apps/backend/__tests__/simulation/simulationEventRepository.test.ts apps/backend/__tests__/simulation/simulationEventRiskMetrics.test.ts --runInBand --watchman=false
```

Expected: PASS.

**Measurable result:** Worker simulation API expands from 3 simulation endpoints to 5 simulation endpoints with event list and event scenario support.

**Resume bullet candidate:** Built backend-owned event scenario APIs that resolve public crypto news dates, reaction delays, historical prices, current value, and risk metrics server-side so mobile users receive trusted educational outcomes.

---

### Task 6: Frontend API Clients

**Files:**

- Create: `apps/frontend/src/features/simulation/api/getSimulationEvents.ts`
- Create: `apps/frontend/src/features/simulation/api/getSimulationEventScenario.ts`
- Create: `apps/frontend/src/features/simulation/api/getSimulationEvents.test.ts`
- Create: `apps/frontend/src/features/simulation/api/getSimulationEventScenario.test.ts`
- Modify: `docs/project-reference/metrics.md`

- [ ] **Step 1: Write failing client tests**

Follow `getSimulationPrice.test.ts` style. Tests must assert:

- Worker base URL is used.
- invalid payload throws.
- latency metric is recorded.

- [ ] **Step 2: Implement clients**

`getSimulationEvents.ts`:

```ts
import { getCryptoApiUrl } from '@/features/crypto-market/api/getCryptoApiUrl';
import { isSimulationEventListResponse } from '@/shared/api/simulationValidators';
import { timeAsync } from '@/shared/metrics/metrics';
import { SimulationAssetSymbol, SimulationEventListResponse } from '@shared/simulationTypes';

export async function getSimulationEvents({
  asset,
}: {
  asset: SimulationAssetSymbol;
}): Promise<SimulationEventListResponse> {
  const query = new URLSearchParams({ asset });

  return timeAsync(
    'crypto.client.simulation_events.fetch',
    async () => {
      const response = await fetch(getCryptoApiUrl(`/api/simulation/events?${query.toString()}`));
      const payload = await response.json();

      if (!isSimulationEventListResponse(payload)) {
        throw new Error('Invalid simulation event list response from cloud API');
      }

      return payload;
    },
    { asset }
  );
}
```

`getSimulationEventScenario.ts`:

```ts
import { getCryptoApiUrl } from '@/features/crypto-market/api/getCryptoApiUrl';
import { isSimulationEventScenarioResponse } from '@/shared/api/simulationValidators';
import { timeAsync } from '@/shared/metrics/metrics';
import {
  SimulationEventDelay,
  SimulationEventScenarioResponse,
} from '@shared/simulationTypes';

export async function getSimulationEventScenario({
  eventId,
  delay,
  amountUsd,
}: {
  eventId: string;
  delay: SimulationEventDelay;
  amountUsd: number;
}): Promise<SimulationEventScenarioResponse> {
  const query = new URLSearchParams({
    eventId,
    delay,
    amountUsd: String(amountUsd),
  });

  return timeAsync(
    'crypto.client.simulation_event_scenarios.fetch',
    async () => {
      const response = await fetch(
        getCryptoApiUrl(`/api/simulation/event-scenarios?${query.toString()}`)
      );
      const payload = await response.json();

      if (!isSimulationEventScenarioResponse(payload)) {
        throw new Error('Invalid simulation event scenario response from cloud API');
      }

      return payload;
    },
    { eventId, delay }
  );
}
```

- [ ] **Step 3: Run frontend client tests**

Run:

```bash
./node_modules/.bin/jest apps/frontend/src/features/simulation/api/getSimulationEvents.test.ts apps/frontend/src/features/simulation/api/getSimulationEventScenario.test.ts --runInBand --watchman=false
```

Expected: PASS.

**Measurable result:** Client metric coverage increases by 2 events: `crypto.client.simulation_events.fetch` and `crypto.client.simulation_event_scenarios.fetch`.

**Resume bullet candidate:** Added React Native API clients with shared response validation and latency metrics for event-driven simulations, keeping mobile behavior observable and resilient to malformed Worker responses.

---

### Task 7: Simulation Screen Event Mode

**Files:**

- Modify: `apps/frontend/src/features/simulation/screens/simulationScreen.tsx`
- Modify: `apps/frontend/src/features/simulation/screens/simulationScreen.test.ts`
- Modify: `apps/frontend/src/features/simulation/storage/savedSimulationsStore.ts`

- [ ] **Step 1: Add source-boundary tests**

Add tests that inspect the screen source for:

```ts
it('adds event-based simulation mode with sourced headlines and delay options', () => {
  const source = screenSource();

  expect(source).toContain("Date");
  expect(source).toContain("Event");
  expect(source).toContain('getSimulationEvents');
  expect(source).toContain('getSimulationEventScenario');
  expect(source).toContain('Same day');
  expect(source).toContain('1 week');
  expect(source).toContain('1 month');
  expect(source).toContain('Risk journey');
  expect(source).toContain('Source');
});
```

- [ ] **Step 2: Run test to verify failure**

Run:

```bash
./node_modules/.bin/jest apps/frontend/src/features/simulation/screens/simulationScreen.test.ts --runInBand --watchman=false
```

Expected: fails because Event mode text and clients are not wired.

- [ ] **Step 3: Add mode state and queries**

In `simulationScreen.tsx`, add:

```ts
type SimulationMode = 'date' | 'event';

const EVENT_DELAYS = [
  { value: 'same_day', label: 'Same day' },
  { value: 'one_week', label: '1 week' },
  { value: 'one_month', label: '1 month' },
] as const;
```

Add state:

```ts
const [mode, setMode] = useState<SimulationMode>('date');
const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
const [selectedDelay, setSelectedDelay] = useState<SimulationEventDelay>('same_day');
const [latestEventResult, setLatestEventResult] =
  useState<SimulationEventScenarioSuccessResponse | null>(null);
```

Add query:

```ts
const eventsQuery = useQuery({
  queryKey: ['simulation-events', asset],
  queryFn: () => getSimulationEvents({ asset }),
  enabled: mode === 'event',
});

const eventList = eventsQuery.data?.status === 'success' ? eventsQuery.data.events : [];
const selectedEvent = eventList.find((event) => event.id === selectedEventId) ?? eventList[0] ?? null;
```

- [ ] **Step 4: Add event scenario mutation**

```ts
const eventScenarioMutation = useMutation({
  mutationFn: () => {
    if (!selectedEvent) throw new Error('Select an event before running an event simulation.');
    return getSimulationEventScenario({
      eventId: selectedEvent.id,
      delay: selectedDelay,
      amountUsd: Number(amountUsd),
    });
  },
  onSuccess: (response) => {
    if (response.status === 'success') {
      setLatestEventResult(response);
      recordMetric({
        name: 'crypto.simulation.completed',
        durationMs: 0,
        status: 'success',
        metadata: { mode: 'event', eventId: response.event.id, delay: response.input.delay },
      });
      return;
    }

    setLatestEventResult(null);
    recordMetric({
      name: 'crypto.simulation.failed',
      durationMs: 0,
      status: 'error',
      metadata: { mode: 'event', code: response.code },
    });
  },
});
```

- [ ] **Step 5: Render Event mode**

Add the event feed below the asset catalog and before the chart/date controls when `mode === 'event'`:

```tsx
{mode === 'event' && (
  <View style={styles.panel}>
    <Text style={styles.panelTitle}>Market events</Text>
    {eventList.map((event) => (
      <TouchableOpacity
        key={event.id}
        style={[styles.eventCard, event.id === selectedEvent?.id && styles.eventCardSelected]}
        onPress={() => setSelectedEventId(event.id)}
      >
        <Text style={styles.eventHeadline}>{event.headline}</Text>
        <Text style={styles.eventMeta}>
          {event.eventDate} · {event.category.replace('_', ' ')}
        </Text>
        <Text style={styles.stateText}>{event.summary}</Text>
        <Text style={styles.resultLabel}>Source: {event.sources.length} verified sources</Text>
      </TouchableOpacity>
    ))}
  </View>
)}
```

Render delay selector:

```tsx
{mode === 'event' && (
  <View style={styles.yearRow}>
    {EVENT_DELAYS.map((delay) => (
      <TouchableOpacity
        key={delay.value}
        style={[styles.yearButton, selectedDelay === delay.value && styles.yearButtonActive]}
        onPress={() => setSelectedDelay(delay.value)}
      >
        <Text style={[styles.yearButtonText, selectedDelay === delay.value && styles.yearButtonTextActive]}>
          {delay.label}
        </Text>
      </TouchableOpacity>
    ))}
  </View>
)}
```

- [ ] **Step 6: Render event result risk journey**

When `latestEventResult` exists:

```tsx
<View style={styles.panel}>
  <Text style={styles.panelTitle}>Risk journey</Text>
  <Text style={styles.stateText}>{latestEventResult.takeaway}</Text>
  <Text style={styles.resultLabel}>Max drawdown</Text>
  <Text style={styles.resultValue}>{formatPercent(latestEventResult.risk.maxDrawdownPercent)}</Text>
  <Text style={styles.resultLabel}>Longest below starting value</Text>
  <Text style={styles.resultValue}>{latestEventResult.risk.longestUnderwaterDays} days</Text>
  <Text style={styles.resultLabel}>Best 30 days</Text>
  <Text style={styles.resultValue}>{formatPercent(latestEventResult.risk.bestThirtyDayReturnPercent)}</Text>
  <Text style={styles.resultLabel}>Worst 30 days</Text>
  <Text style={styles.resultValue}>{formatPercent(latestEventResult.risk.worstThirtyDayReturnPercent)}</Text>
</View>
```

- [ ] **Step 7: Run focused frontend tests**

Run:

```bash
./node_modules/.bin/jest apps/frontend/src/features/simulation/screens/simulationScreen.test.ts apps/frontend/src/features/simulation/storage/savedSimulationsStore.test.ts --runInBand --watchman=false
```

Expected: PASS.

**Measurable result:** Manual Simulation workflow count increases from 1 date-based workflow to 2 workflows: date-based and event-based.

**Resume bullet candidate:** Added an event-feed Simulation mode in React Native that lets users react to sourced crypto headlines and understand risk outcomes in one guided mobile workflow.

---

### Task 8: Docs, Resume MD, Verification, And Deployment

**Files:**

- Modify: `docs/project-reference/architecture.md`
- Modify: `docs/project-reference/issues.md`
- Modify: `docs/project-reference/troubleshooting.md`
- Modify: `docs/project-reference/metrics.md`
- Modify: `crypto-market-simulator.md`

- [ ] **Step 1: Run focused test suite**

Run:

```bash
./node_modules/.bin/jest apps/backend/__tests__/api/simulation-events-api.test.ts apps/backend/__tests__/simulation/simulationEventRepository.test.ts apps/backend/__tests__/simulation/simulationEventRiskMetrics.test.ts apps/frontend/src/features/simulation/api/getSimulationEvents.test.ts apps/frontend/src/features/simulation/api/getSimulationEventScenario.test.ts apps/frontend/src/features/simulation/screens/simulationScreen.test.ts --runInBand --watchman=false
```

Expected: PASS.

- [ ] **Step 2: Run full project verification**

Run:

```bash
./node_modules/.bin/jest --runInBand --watchman=false
./node_modules/.bin/tsc --noEmit
```

Expected: both PASS.

- [ ] **Step 3: Update docs with exact shipped behavior**

Document:

- `/api/simulation/events`
- `/api/simulation/event-scenarios`
- 15 curated events
- 30+ source rows
- 3 supported delays
- 4 risk metrics
- manual test path

- [ ] **Step 4: Update `crypto-market-simulator.md`**

Add one recruiter-readable impact bullet with what/how/where/why:

```md
- Built an event-driven Simulation mode using Cloudflare D1, Worker-owned date resolution, and React Native event cards across 15 sourced BTC/ETH/SOL market events, helping non-technical users understand how reacting after real crypto news would have affected both returns and risk.
```

Add one technical-depth `How It Works` paragraph:

```md
Event-based simulations are served by Worker endpoints that read curated event/source rows from D1, apply user-selected reaction delays, resolve the nearest valid historical price date, calculate current value through the existing price pipeline, and compute max drawdown, longest underwater period, and rolling 30-day return metrics from static historical rows. The frontend only renders the event feed and selected scenario result, keeping sourcing, date logic, and risk analytics out of the mobile client.
```

- [ ] **Step 5: Deploy after local verification**

From `apps/backend`, apply migration and deploy through Wrangler only after local tests and TypeScript pass.

Run the repo's established backend deployment commands from `docs/project-reference/troubleshooting.md` and verify:

```bash
curl -i 'https://fintech-reliability-api.shubhkapadia2031.workers.dev/api/simulation/events?asset=BTC'
curl -i 'https://fintech-reliability-api.shubhkapadia2031.workers.dev/api/simulation/event-scenarios?eventId=btc-2024-spot-etf-approval&delay=one_week&amountUsd=500'
```

Expected:

- first response has `status: "success"` and 5 BTC events
- second response has `status: "success"`, event metadata, current value, risk metrics, and takeaway

**Measurable result:** Production demo gains 15 sourced event scenarios, 3 reaction delays, and 4 risk metrics per scenario.

**Resume bullet candidate:** Shipped event-driven crypto simulations with 15 sourced historical events, 3 user reaction delays, and 4 risk metrics per scenario, turning historical market news into a recruiter-friendly product demo about real user decision-making.

---

## Final Verification Checklist

- [ ] `./node_modules/.bin/jest --runInBand --watchman=false` passes.
- [ ] `./node_modules/.bin/tsc --noEmit` passes.
- [ ] `/api/simulation/events?asset=BTC` returns 5 sourced active events.
- [ ] `/api/simulation/events?asset=ETH` returns 5 sourced active events.
- [ ] `/api/simulation/events?asset=SOL` returns 5 sourced active events.
- [ ] Event scenario endpoint returns max drawdown, longest underwater period, best 30-day stretch, worst 30-day stretch, and takeaway.
- [ ] Simulation tab Date mode still works.
- [ ] Simulation tab Event mode works in under 60 seconds during manual testing.
- [ ] Saved simulations distinguish event-based scenarios from manual date scenarios.
- [ ] `crypto-market-simulator.md` includes why/where language a recruiter can understand.
