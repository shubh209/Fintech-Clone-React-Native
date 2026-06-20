import app from '../../src';
import { clearCurrentPriceCache } from '../../src/domains/simulation/currentPriceCache';
import { clearMetrics, getMetricsSnapshot } from '../../src/telemetry/metrics';
import { SqlDatabase } from '../../src/types';

const eventRow = {
  id: 'btc-2024-spot-etf-approval',
  asset_symbol: 'BTC',
  headline: 'U.S. spot Bitcoin ETFs are approved',
  summary: 'U.S. regulators approved spot Bitcoin exchange-traded products.',
  event_date: '2024-01-10',
  category: 'adoption',
  market_sentiment: 'positive',
  sort_order: 1,
  status: 'active',
};

const sourceRows = [
  {
    id: 'src-a',
    event_id: 'btc-2024-spot-etf-approval',
    title: 'SEC statement',
    publisher: 'SEC',
    url: 'https://www.sec.gov/newsroom/speeches-statements/gensler-statement-spot-bitcoin-011023',
    published_at: '2024-01-10',
  },
  {
    id: 'src-b',
    event_id: 'btc-2024-spot-etf-approval',
    title: 'Reuters report',
    publisher: 'Reuters',
    url: 'https://www.reuters.com/technology/us-sec-approves-bitcoin-etfs-watershed-crypto-market-2024-01-10/',
    published_at: '2024-01-10',
  },
];

const historicalRows = [
  {
    asset_symbol: 'BTC',
    asset_name: 'bitcoin',
    date: '2024-01-17',
    close_usd: 100,
    source_name: 'Top 100 Cryptocurrency Historical Prices',
    source_path: 'crypto_top100/bitcoin_BTC.csv',
    source_version: '2026-05-22',
    imported_at: '2026-05-22T01:00:00.000Z',
  },
  {
    asset_symbol: 'BTC',
    asset_name: 'bitcoin',
    date: '2024-01-18',
    close_usd: 80,
    source_name: 'Top 100 Cryptocurrency Historical Prices',
    source_path: 'crypto_top100/bitcoin_BTC.csv',
    source_version: '2026-05-22',
    imported_at: '2026-05-22T01:00:00.000Z',
  },
  {
    asset_symbol: 'BTC',
    asset_name: 'bitcoin',
    date: '2024-02-16',
    close_usd: 160,
    source_name: 'Top 100 Cryptocurrency Historical Prices',
    source_path: 'crypto_top100/bitcoin_BTC.csv',
    source_version: '2026-05-22',
    imported_at: '2026-05-22T01:00:00.000Z',
  },
  {
    asset_symbol: 'BTC',
    asset_name: 'bitcoin',
    date: '2024-03-17',
    close_usd: 120,
    source_name: 'Top 100 Cryptocurrency Historical Prices',
    source_path: 'crypto_top100/bitcoin_BTC.csv',
    source_version: '2026-05-22',
    imported_at: '2026-05-22T01:00:00.000Z',
  },
];

function fakeDb({
  events = [eventRow],
  sources = sourceRows,
  prices = historicalRows,
}: {
  events?: Array<Record<string, unknown>>;
  sources?: Array<Record<string, unknown>>;
  prices?: Array<Record<string, unknown>>;
} = {}): SqlDatabase {
  return {
    prepare: (query: string) => ({
      bind: (...values: unknown[]) => ({
        first: async () => {
          if (query.includes('FROM simulation_events')) {
            const [eventId] = values;
            return events.find((row) => row.id === eventId && row.status === 'active') ?? null;
          }

          if (query.includes('FROM historical_crypto_prices')) {
            const [assetSymbol, requestedDate, upperBound] = values;
            return (
              prices
                .filter(
                  (row) =>
                    row.asset_symbol === assetSymbol &&
                    typeof row.date === 'string' &&
                    row.date >= String(requestedDate) &&
                    row.date <= String(upperBound)
                )
                .sort((left, right) => String(left.date).localeCompare(String(right.date)))[0] ??
              null
            );
          }

          return null;
        },
        all: async () => {
          if (query.includes('FROM simulation_events')) {
            const [assetSymbol] = values;
            return {
              results: events
                .filter((row) => row.asset_symbol === assetSymbol && row.status === 'active')
                .sort((left, right) => Number(left.sort_order) - Number(right.sort_order)),
            };
          }

          if (query.includes('FROM simulation_event_sources')) {
            const [eventId] = values;
            return {
              results: sources
                .filter((row) => row.event_id === eventId)
                .sort((left, right) => String(left.id).localeCompare(String(right.id))),
            };
          }

          if (query.includes('FROM historical_crypto_prices')) {
            const [assetSymbol, startDate, endDate] = values;
            return {
              results: prices
                .filter(
                  (row) =>
                    row.asset_symbol === assetSymbol &&
                    typeof row.date === 'string' &&
                    row.date >= String(startDate) &&
                    row.date <= String(endDate)
                )
                .sort((left, right) => String(left.date).localeCompare(String(right.date))),
            };
          }

          return { results: [] };
        },
        run: async () => ({}),
      }),
      first: async () => null,
      all: async () => ({ results: [] }),
      run: async () => ({}),
    }),
  } as unknown as SqlDatabase;
}

const env = {
  COINGECKO_API_KEY: 'demo-key',
  HISTORICAL_PRICES_DB: fakeDb(),
};

describe('simulation events API', () => {
  beforeEach(() => {
    clearCurrentPriceCache();
    clearMetrics();
    jest.restoreAllMocks();
  });

  it('returns sourced events for a supported simulation asset', async () => {
    const response = await app.request('/api/simulation/events?asset=BTC', {}, env);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.status).toBe('success');
    expect(body.asset.symbol).toBe('BTC');
    expect(body.supportedDelays).toEqual(['same_day', 'one_week', 'one_month']);
    expect(body.events).toHaveLength(1);
    expect(body.events[0]).toEqual(
      expect.objectContaining({
        id: 'btc-2024-spot-etf-approval',
        headline: 'U.S. spot Bitcoin ETFs are approved',
      })
    );
    expect(body.events[0].sources.map((source: { publisher: string }) => source.publisher)).toEqual([
      'SEC',
      'Reuters',
    ]);
  });

  it('returns validation errors for unsupported event assets', async () => {
    const response = await app.request('/api/simulation/events?asset=DOGE', {}, env);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.status).toBe('error');
    expect(body.code).toBe('unsupported_asset');
  });

  it('runs an event scenario with risk metrics and event metadata', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        bitcoin: { usd: 250, last_updated_at: 1_780_000_000 },
        ethereum: { usd: 200, last_updated_at: 1_780_000_000 },
        solana: { usd: 50, last_updated_at: 1_780_000_000 },
      }),
    } as Response);

    const response = await app.request(
      '/api/simulation/event-scenarios?eventId=btc-2024-spot-etf-approval&delay=one_week&amountUsd=100',
      {},
      env
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.status).toBe('success');
    expect('sortOrder' in body.event).toBe(false);
    expect(body.event.id).toBe('btc-2024-spot-etf-approval');
    expect(body.input.delay).toBe('one_week');
    expect(body.input.intendedBuyDate).toBe('2024-01-17');
    expect(body.historical.resolvedDate).toBe('2024-01-17');
    expect(body.result.currentValueUsd).toBe(250);
    expect(body.risk).toEqual(
      expect.objectContaining({
        maxDrawdownPercent: -25,
        longestUnderwaterDays: 29,
        bestThirtyDayReturnPercent: 60,
        worstThirtyDayReturnPercent: -25,
        startDate: '2024-01-17',
      })
    );
    expect(body.takeaway).toContain('This scenario ended profitable');
    expect(
      getMetricsSnapshot().some(
        (metric) => metric.name === 'crypto.api.simulation_event_scenarios.compute'
      )
    ).toBe(true);
  });

  it('returns validation errors when event id is missing', async () => {
    const response = await app.request(
      '/api/simulation/event-scenarios?delay=one_week&amountUsd=100',
      {},
      env
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.status).toBe('error');
    expect(body.code).toBe('missing_event');
  });
});
