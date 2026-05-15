# Reliability First Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the app from a feature demo into a reliability-first finance portfolio project with fewer, credible surfaces and explicit data trust behavior.

**Architecture:** Keep Expo Router, Clerk, Zustand/MMKV, React Query, and local API handlers. Add small focused reliability modules around API requests, response validation, data freshness, and documentation so screens consume normalized state instead of raw network responses.

**Tech Stack:** Expo Router, React Native, TypeScript, React Query, Zustand, MMKV, Jest, local Expo Router API handlers, CoinMarketCap.

---

## File Structure

- Create `docs/architecture/decisions/0001-reliability-first-product-scope.md`: records why the app now prioritizes reliability over feature count.
- Create `docs/architecture/decisions/0002-api-data-trust-boundaries.md`: records how API freshness, fallback, and validation should work.
- Create `utils/apiResult.ts`: shared API result metadata types and helpers for stale/fallback states.
- Create `utils/apiResult.test.ts`: verifies helper behavior without React Native.
- Create `utils/cryptoValidators.ts`: runtime guards for CoinMarketCap listing, info, and ticker payloads.
- Create `utils/cryptoValidators.test.ts`: contract-style tests for valid/invalid crypto payloads.
- Modify `app/api/listings+api.ts`, `app/api/info+api.ts`, `app/api/tickers+api.ts`: return or internally use validated payloads and preserve fallback behavior.
- Modify `app/(authenticated)/(tabs)/crypto.tsx` and `app/(authenticated)/crypto/[id].tsx`: show data freshness/source/fallback state consistently.
- Modify `app/(authenticated)/(tabs)/_layout.tsx`: replace placeholder tab names only after corresponding screens are credible.
- Modify docs in `docs/project-reference/`: make the reliability-first roadmap part of the startup context.
- Modify `README.md`: explain the project as a reliability-focused finance app, not a generic Expo app.

## Task 1: Record Product And Reliability Decisions

**Files:**
- Create: `docs/architecture/decisions/0001-reliability-first-product-scope.md`
- Create: `docs/architecture/decisions/0002-api-data-trust-boundaries.md`
- Modify: `docs/project-reference/README.md`
- Modify: `docs/project-reference/project-overview.md`
- Modify: `docs/project-reference/architecture.md`

- [ ] **Step 1: Write ADR 0001**

Create `docs/architecture/decisions/0001-reliability-first-product-scope.md`:

```markdown
# ADR 0001: Reliability-First Product Scope

## Status

Accepted

## Context

The app started as a fintech clone with several placeholder tabs. For a portfolio project, many shallow features make the project look less credible than fewer features with strong correctness, observability, and failure handling.

## Decision

The app will prioritize a small set of reliable finance workflows:

- account overview and transaction state
- activity and spending visibility
- live crypto market data with freshness and fallback states
- goals and responsible guidance
- profile/security/privacy controls

Placeholder tabs should be removed, renamed, or converted into real workflows before they are presented as product features.

## Consequences

- New features need tests and explicit failure states.
- UI polish is valuable only when the underlying data behavior is reliable.
- AI features must be explainable, scoped, and privacy-aware.
```

- [ ] **Step 2: Write ADR 0002**

Create `docs/architecture/decisions/0002-api-data-trust-boundaries.md`:

```markdown
# ADR 0002: API Data Trust Boundaries

## Status

Accepted

## Context

Finance users need to know whether data is live, stale, fallback, or unavailable. The app currently relies on local Expo Router API handlers for crypto data and can fall back to local fixtures.

## Decision

API-backed features must expose:

- source: `live` or `fallback`
- provider name when known
- `updatedAt` timestamp when available
- user-visible loading, retry, error, and fallback states
- runtime validation before rendering external payloads

Screens should not rely on raw provider response shapes when a focused normalizer can make the contract explicit.

## Consequences

- API route tests should cover live success and fallback paths.
- UI tests should guard against hiding stale/fallback data.
- Docs must explain which data is live and which data is fixture-backed.
```

- [ ] **Step 3: Link ADRs from project reference**

Modify `docs/project-reference/README.md` to add:

```markdown
## Product Strategy

- `docs/product-strategy/reliable-finance-app-roadmap.md` is the guiding product roadmap.
- `docs/architecture/decisions/` records reliability and scope decisions.
```

- [ ] **Step 4: Verify docs hygiene**

Run: `git diff --check`

Expected: exit code `0`.

## Task 2: Add Shared API Result Metadata

**Files:**
- Create: `utils/apiResult.ts`
- Create: `utils/apiResult.test.ts`

- [ ] **Step 1: Write failing tests**

Create `utils/apiResult.test.ts`:

```typescript
import {
  createFallbackResult,
  createLiveResult,
  isApiResultStale,
} from './apiResult';

describe('api result metadata', () => {
  it('creates live result metadata with provider and timestamp', () => {
    expect(
      createLiveResult({ provider: 'coinmarketcap', updatedAt: '2026-05-14T15:00:00.000Z' })
    ).toEqual({
      source: 'live',
      provider: 'coinmarketcap',
      updatedAt: '2026-05-14T15:00:00.000Z',
      isFallback: false,
    });
  });

  it('creates fallback result metadata with reason', () => {
    expect(createFallbackResult({ reason: 'missing-api-key' })).toEqual({
      source: 'fallback',
      provider: 'local',
      updatedAt: null,
      reason: 'missing-api-key',
      isFallback: true,
    });
  });

  it('detects stale timestamps', () => {
    expect(
      isApiResultStale('2026-05-14T12:00:00.000Z', {
        nowMs: Date.parse('2026-05-14T12:02:01.000Z'),
        staleAfterMs: 120_000,
      })
    ).toBe(true);
  });
});
```

- [ ] **Step 2: Run red test**

Run: `npx jest --runTestsByPath utils/apiResult.test.ts --runInBand --watchman=false`

Expected: FAIL because `utils/apiResult.ts` does not exist.

- [ ] **Step 3: Implement helper**

Create `utils/apiResult.ts`:

```typescript
export type ApiResultSource = 'live' | 'fallback';

export interface ApiResultMetadata {
  source: ApiResultSource;
  provider: string;
  updatedAt: string | null;
  reason?: string;
  isFallback: boolean;
}

export function createLiveResult({
  provider,
  updatedAt,
}: {
  provider: string;
  updatedAt: string;
}): ApiResultMetadata {
  return {
    source: 'live',
    provider,
    updatedAt,
    isFallback: false,
  };
}

export function createFallbackResult({
  reason,
}: {
  reason: string;
}): ApiResultMetadata {
  return {
    source: 'fallback',
    provider: 'local',
    updatedAt: null,
    reason,
    isFallback: true,
  };
}

export function isApiResultStale(
  updatedAt: string | null | undefined,
  {
    nowMs = Date.now(),
    staleAfterMs,
  }: {
    nowMs?: number;
    staleAfterMs: number;
  }
) {
  if (!updatedAt) return true;

  const updatedAtMs = Date.parse(updatedAt);
  if (!Number.isFinite(updatedAtMs)) return true;

  return nowMs - updatedAtMs > staleAfterMs;
}
```

- [ ] **Step 4: Run green test**

Run: `npx jest --runTestsByPath utils/apiResult.test.ts --runInBand --watchman=false`

Expected: PASS.

## Task 3: Add Crypto Runtime Validators

**Files:**
- Create: `utils/cryptoValidators.ts`
- Create: `utils/cryptoValidators.test.ts`

- [ ] **Step 1: Write failing validator tests**

Create `utils/cryptoValidators.test.ts`:

```typescript
import {
  isCryptoListing,
  isCryptoInfoMap,
  normalizeQuoteTicker,
} from './cryptoValidators';

describe('crypto validators', () => {
  it('accepts a valid listing with EUR quote', () => {
    expect(
      isCryptoListing({
        id: 1,
        name: 'Bitcoin',
        symbol: 'BTC',
        quote: {
          EUR: {
            price: 100,
            percent_change_24h: 1,
            last_updated: '2026-05-14T15:00:00.000Z',
          },
        },
      })
    ).toBe(true);
  });

  it('rejects a listing without numeric price', () => {
    expect(
      isCryptoListing({
        id: 1,
        name: 'Bitcoin',
        symbol: 'BTC',
        quote: { EUR: { price: '100' } },
      })
    ).toBe(false);
  });

  it('accepts an info map with logos', () => {
    expect(
      isCryptoInfoMap({
        '1': { id: 1, name: 'Bitcoin', symbol: 'BTC', logo: 'https://example.test/btc.png' },
      })
    ).toBe(true);
  });

  it('normalizes latest quote payloads into ticker points', () => {
    expect(
      normalizeQuoteTicker({
        last_updated: '2026-05-14T15:00:00.000Z',
        quote: {
          EUR: {
            price: 100,
            volume_24h: 200,
            market_cap: 300,
            last_updated: '2026-05-14T15:01:00.000Z',
          },
        },
      })
    ).toEqual({
      timestamp: '2026-05-14T15:01:00.000Z',
      price: 100,
      volume_24h: 200,
      market_cap: 300,
    });
  });
});
```

- [ ] **Step 2: Run red test**

Run: `npx jest --runTestsByPath utils/cryptoValidators.test.ts --runInBand --watchman=false`

Expected: FAIL because `utils/cryptoValidators.ts` does not exist.

- [ ] **Step 3: Implement validators**

Create `utils/cryptoValidators.ts` with focused guards for only the fields the app renders:

```typescript
import { TickerApiPoint } from './tickers';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

export function isCryptoListing(value: unknown) {
  if (!isRecord(value)) return false;
  if (!isFiniteNumber(value.id)) return false;
  if (typeof value.name !== 'string') return false;
  if (typeof value.symbol !== 'string') return false;

  const quote = value.quote;
  if (!isRecord(quote)) return false;

  const eur = quote.EUR;
  if (!isRecord(eur)) return false;

  return isFiniteNumber(eur.price);
}

export function isCryptoInfoMap(value: unknown) {
  if (!isRecord(value)) return false;

  return Object.values(value).every((entry) => {
    if (!isRecord(entry)) return false;
    return (
      isFiniteNumber(entry.id) &&
      typeof entry.name === 'string' &&
      typeof entry.symbol === 'string' &&
      typeof entry.logo === 'string'
    );
  });
}

export function normalizeQuoteTicker(value: unknown): TickerApiPoint | null {
  if (!isRecord(value)) return null;

  const quote = value.quote;
  if (!isRecord(quote)) return null;

  const eur = quote.EUR;
  if (!isRecord(eur)) return null;
  if (!isFiniteNumber(eur.price)) return null;

  return {
    timestamp:
      typeof eur.last_updated === 'string'
        ? eur.last_updated
        : typeof value.last_updated === 'string'
          ? value.last_updated
          : new Date().toISOString(),
    price: eur.price,
    volume_24h: isFiniteNumber(eur.volume_24h) ? eur.volume_24h : 0,
    market_cap: isFiniteNumber(eur.market_cap) ? eur.market_cap : 0,
  };
}
```

- [ ] **Step 4: Run green test**

Run: `npx jest --runTestsByPath utils/cryptoValidators.test.ts --runInBand --watchman=false`

Expected: PASS.

## Task 4: Apply Validators To Crypto API Routes

**Files:**
- Modify: `app/api/listings+api.ts`
- Modify: `app/api/info+api.ts`
- Modify: `app/api/tickers+api.ts`
- Test: `__tests__/api/listings-api.test.ts`
- Test: `__tests__/api/info-api.test.ts`
- Test: `__tests__/api/tickers-api.test.ts`

- [ ] **Step 1: Add failing invalid-live-response tests**

Add to `__tests__/api/listings-api.test.ts`:

```typescript
it('falls back when live listings are malformed', async () => {
  jest.spyOn(global, 'fetch').mockResolvedValue({
    ok: true,
    json: async () => ({ data: [{ id: 1, name: 'Broken', symbol: 'BRK', quote: { EUR: {} } }] }),
  } as Response);

  const response = await GET(new Request('https://example.test/api/listings?limit=1'));
  const body = await response.json();

  expect(body[0].symbol).toBe('BTC');
  expect(getMetricsSnapshot().map((metric) => metric.name)).toEqual([
    'crypto.api.listings.upstream',
    'crypto.api.listings.fallback',
  ]);
});
```

Add to `__tests__/api/tickers-api.test.ts`:

```typescript
it('falls back when live ticker quote is malformed', async () => {
  process.env.CRYPTO_API_KEY = 'test-key';
  jest.spyOn(global, 'fetch').mockResolvedValue({
    ok: true,
    json: async () => ({ data: { '1027': { quote: { EUR: {} } } } }),
  } as Response);

  const response = await GET(new Request('https://example.test/api/tickers?id=1027'));

  expect(Array.isArray(await response.json())).toBe(true);
  expect(getMetricsSnapshot().map((metric) => metric.name)).toEqual([
    'crypto.api.tickers.upstream',
    'crypto.api.tickers.local',
  ]);
});
```

- [ ] **Step 2: Run red API tests**

Run: `npx jest --runTestsByPath __tests__/api/listings-api.test.ts __tests__/api/tickers-api.test.ts --runInBand --watchman=false`

Expected: FAIL because malformed live data is not validated yet.

- [ ] **Step 3: Use validators in API routes**

Implementation rules:

- In `app/api/listings+api.ts`, import `isCryptoListing` and only return `res.data` when `Array.isArray(res.data) && res.data.every(isCryptoListing)`.
- In `app/api/info+api.ts`, import `isCryptoInfoMap` and only return `res.data` when `isCryptoInfoMap(res.data)`.
- In `app/api/tickers+api.ts`, import `normalizeQuoteTicker` and return `[ticker]` only when the normalizer returns a non-null ticker point.
- Preserve existing fallback metrics.

- [ ] **Step 4: Run green API tests**

Run: `npx jest --runTestsByPath __tests__/api/listings-api.test.ts __tests__/api/info-api.test.ts __tests__/api/tickers-api.test.ts --runInBand --watchman=false`

Expected: PASS.

## Task 5: Surface Data Trust In Crypto UI

**Files:**
- Modify: `app/(authenticated)/(tabs)/crypto.tsx`
- Modify: `app/(authenticated)/crypto/[id].tsx`
- Create or modify source-level tests in `__tests__/crypto-list-api-wiring.test.ts` and `__tests__/crypto-detail-api-wiring.test.ts`

- [ ] **Step 1: Write failing source tests**

Add assertions that the crypto list and detail screen include:

```typescript
expect(source.includes('Data source')).toBe(true);
expect(source.includes('Last updated')).toBe(true);
expect(source.includes('Retry')).toBe(true);
```

- [ ] **Step 2: Run red UI wiring tests**

Run: `npx jest --runTestsByPath __tests__/crypto-list-api-wiring.test.ts __tests__/crypto-detail-api-wiring.test.ts --runInBand --watchman=false`

Expected: FAIL until labels/actions exist.

- [ ] **Step 3: Add visible trust labels**

In `app/(authenticated)/(tabs)/crypto.tsx`:

- Show `Data source: CoinMarketCap` below the title.
- Rename refresh copy to `Retry` inside error state while keeping the main `Refresh` action.
- Show each row's `Updated` timestamp from `currency.quote.EUR.last_updated`.

In `app/(authenticated)/crypto/[id].tsx`:

- Show `Data source: CoinMarketCap` in Overview/Market panels.
- Show `Last updated` using the latest ticker timestamp.
- In error state, include a retry action that calls both `infoQuery.refetch()` and `tickersQuery.refetch()`.

- [ ] **Step 4: Run green UI wiring tests**

Run: `npx jest --runTestsByPath __tests__/crypto-list-api-wiring.test.ts __tests__/crypto-detail-api-wiring.test.ts --runInBand --watchman=false`

Expected: PASS.

## Task 6: Project Reference And README Refresh

**Files:**
- Modify: `README.md`
- Modify: `docs/project-reference/README.md`
- Modify: `docs/project-reference/project-overview.md`
- Modify: `docs/project-reference/architecture.md`
- Modify: `docs/project-reference/issues.md`
- Modify: `docs/project-reference/session-checklist.md`
- Modify: `docs/project-reference/SKILLS.md`

- [ ] **Step 1: Update root README**

Add sections:

```markdown
## Product Direction

This project is a reliability-first finance app. The goal is not to maximize feature count; it is to demonstrate production-minded engineering around correctness, data freshness, fallback behavior, privacy boundaries, and testable financial workflows.

## Reliability Guarantees

- Persisted transaction dates are normalized to ISO strings.
- MMKV storage falls back to memory when native JSI storage is unavailable.
- Crypto data uses live CoinMarketCap responses when configured and local fallback data when unavailable.
- API-backed screens must show loading, error, retry, fallback, and data freshness states.

## Known Limits

- This is not connected to real bank accounts.
- Money movement is simulated and must not be presented as real transfer behavior.
- AI guidance is planned as educational assistance only, not investment, legal, or tax advice.
```

- [ ] **Step 2: Update project reference docs**

Ensure docs mention:

- `docs/product-strategy/reliable-finance-app-roadmap.md`
- ADRs in `docs/architecture/decisions/`
- reliability-first scope
- source/freshness/fallback expectations for API screens
- placeholder tabs must not be described as complete

- [ ] **Step 3: Run docs hygiene**

Run: `git diff --check`

Expected: PASS.

## Task 7: Final Verification

**Files:**
- All changed files.

- [ ] **Step 1: Run targeted tests**

Run:

```bash
npx jest --runTestsByPath utils/apiResult.test.ts utils/cryptoValidators.test.ts __tests__/api/listings-api.test.ts __tests__/api/info-api.test.ts __tests__/api/tickers-api.test.ts __tests__/crypto-list-api-wiring.test.ts __tests__/crypto-detail-api-wiring.test.ts --runInBand --watchman=false
```

Expected: PASS.

- [ ] **Step 2: Run full test suite**

Run:

```bash
npx jest --runInBand --watchman=false
```

Expected: PASS.

- [ ] **Step 3: Run TypeScript**

Run:

```bash
npx tsc --noEmit
```

Expected: PASS.

- [ ] **Step 4: Run diff hygiene**

Run:

```bash
git diff --check
```

Expected: PASS.

- [ ] **Step 5: Record verification in final response**

Report:

- changed files
- tests run
- any blocked manual verification, including the current Expo web `ERR_SOCKET_BAD_PORT` issue if still present

## Self-Review

- Spec coverage: The plan covers Phase 1 roadmap items: docs, ADRs, API trust metadata, runtime validators, visible data freshness, and project reference updates.
- Placeholder scan: No placeholders or TBDs remain.
- Type consistency: `ApiResultMetadata`, validator names, and test command paths are consistent across tasks.
