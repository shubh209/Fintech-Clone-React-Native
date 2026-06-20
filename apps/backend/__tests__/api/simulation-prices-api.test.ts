import app from '../../src';
import { clearCurrentPriceCache } from '../../src/domains/simulation/currentPriceCache';
import { clearMetrics, getMetricsSnapshot } from '../../src/telemetry/metrics';
import { SqlDatabase } from '../../src/types';

function fakeHistoricalDb(rows: Array<Record<string, unknown>>): SqlDatabase {
  return {
    prepare: () => ({
      bind: (...values: unknown[]) => ({
        first: async () => {
          const [assetSymbol, requestedDate, upperBound] = values;
          return (
            rows
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
        },
        all: async () => {
          const [assetSymbol, startDate, endDate] = values;
          return {
            results: rows
              .filter(
                (row) =>
                  row.asset_symbol === assetSymbol &&
                  typeof row.date === 'string' &&
                  row.date >= String(startDate) &&
                  row.date <= String(endDate)
              )
              .sort((left, right) => String(left.date).localeCompare(String(right.date))),
          };
        },
        run: async () => ({}),
        bind: () => {
          throw new Error('nested bind not used');
        },
      }),
      first: async () => null,
      all: async () => ({ results: [] }),
      run: async () => ({}),
    }),
  } as unknown as SqlDatabase;
}

const historicalRow = {
  asset_symbol: 'BTC',
  asset_name: 'bitcoin',
  date: '2021-01-01',
  close_usd: 100,
  source_name: 'Top 100 Cryptocurrency Historical Prices',
  source_path: 'crypto_top100/bitcoin_BTC.csv',
  source_version: '2026-05-22',
  imported_at: '2026-05-22T01:00:00.000Z',
};

const env = {
  COINGECKO_API_KEY: 'demo-key',
  HISTORICAL_PRICES_DB: fakeHistoricalDb([historicalRow]),
};

describe('simulation prices API', () => {
  beforeEach(() => {
    clearCurrentPriceCache();
    clearMetrics();
    jest.restoreAllMocks();
  });

  it('returns validation errors for unsupported assets', async () => {
    const response = await app.request(
      '/api/simulation/prices?asset=DOGE&date=2021-01-01&amountUsd=100',
      {},
      env
    );

    const body = await response.json();
    expect(body.status).toBe('error');
    expect(body.code).toBe('unsupported_asset');
    expect(response.status).toBe(400);
  });

  it('combines historical and current prices into a simulation result', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        bitcoin: { usd: 250, last_updated_at: 1_780_000_000 },
        ethereum: { usd: 200, last_updated_at: 1_780_000_000 },
        solana: { usd: 50, last_updated_at: 1_780_000_000 },
      }),
    } as Response);

    const response = await app.request(
      '/api/simulation/prices?asset=BTC&date=2021-01-01&amountUsd=100',
      {},
      env
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.status).toBe('success');
    expect(body.asset.symbol).toBe('BTC');
    expect(body.asset.coinGeckoId).toBe('bitcoin');
    expect(body.historical.requestedDate).toBe('2021-01-01');
    expect(body.historical.resolvedDate).toBe('2021-01-01');
    expect(body.historical.dateResolution).toBe('exact');
    expect(body.historical.dataQuality).toBe(undefined);
    expect(body.historical.priceUsd).toBe(100);
    expect(body.current.priceUsd).toBe(250);
    expect(body.current.cache.status).toBe('refreshed');
    expect(body.current.cache.ttlSeconds).toBe(60);
    expect(body.result.impliedQuantity).toBe(1);
    expect(body.result.currentValueUsd).toBe(250);
    expect(body.result.gainLossUsd).toBe(150);
    expect(body.result.gainLossPercent).toBe(150);
    const computeMetric = getMetricsSnapshot().find(
      (metric) => metric.name === 'crypto.api.simulation_prices.compute'
    );
    expect(computeMetric).toEqual(
      expect.objectContaining({
        name: 'crypto.api.simulation_prices.compute',
        status: 'success',
        metadata: expect.objectContaining({
          asset: 'BTC',
          dateResolution: 'exact',
          cacheStatus: 'refreshed',
        }),
      })
    );
  });

  it('explains when a missing or quarantined source date resolves to the next available row', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        bitcoin: { usd: 250, last_updated_at: 1_780_000_000 },
        ethereum: { usd: 200, last_updated_at: 1_780_000_000 },
        solana: { usd: 50, last_updated_at: 1_780_000_000 },
      }),
    } as Response);

    const response = await app.request(
      '/api/simulation/prices?asset=BTC&date=2021-01-02&amountUsd=100',
      {},
      {
        ...env,
        HISTORICAL_PRICES_DB: fakeHistoricalDb([
          { ...historicalRow, date: '2021-01-04', close_usd: 125 },
        ]),
      }
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.status).toBe('success');
    expect(body.historical.requestedDate).toBe('2021-01-02');
    expect(body.historical.resolvedDate).toBe('2021-01-04');
    expect(body.historical.dateResolution).toBe('next_available');
    expect(body.historical.dataQuality).toEqual({
      status: 'resolved_to_next_available',
      message:
        'Requested date 2021-01-02 did not have a valid imported source row, so the simulator used 2021-01-04.',
    });
  });

  it('returns current unavailable when CoinGecko fails and cache is empty', async () => {
    jest.spyOn(global, 'fetch').mockRejectedValue(new Error('network down'));

    const response = await app.request(
      '/api/simulation/prices?asset=BTC&date=2021-01-01&amountUsd=100',
      {},
      env
    );

    const body = await response.json();
    expect(body.status).toBe('unavailable');
    expect(body.code).toBe('current_price_unavailable');
    expect(response.status).toBe(503);
  });

  it('returns historical unavailable when D1 has no bounded row', async () => {
    const response = await app.request(
      '/api/simulation/prices?asset=BTC&date=2021-01-01&amountUsd=100',
      {},
      { ...env, HISTORICAL_PRICES_DB: fakeHistoricalDb([]) }
    );

    const body = await response.json();
    expect(body.status).toBe('unavailable');
    expect(body.code).toBe('historical_price_unavailable');
    expect(response.status).toBe(503);
  });

  it('returns a yearly historical chart series for the simulation explorer', async () => {
    const response = await app.request(
      '/api/simulation/history?asset=BTC&year=2021',
      {},
      {
        ...env,
        HISTORICAL_PRICES_DB: fakeHistoricalDb([
          historicalRow,
          { ...historicalRow, date: '2021-02-01', close_usd: 200 },
          { ...historicalRow, date: '2022-01-01', close_usd: 300 },
        ]),
      }
    );

    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.status).toBe('success');
    expect(body.asset.symbol).toBe('BTC');
    expect(body.range).toEqual({
      year: 2021,
      startDate: '2021-01-01',
      endDate: '2021-12-31',
    });
    expect(body.points).toEqual([
      { date: '2021-01-01', priceUsd: 100 },
      { date: '2021-02-01', priceUsd: 200 },
    ]);
    expect(body.source.provider).toBe('historical_csv');
  });

  it('returns validation errors for unsupported historical chart years', async () => {
    const response = await app.request(
      '/api/simulation/history?asset=BTC&year=2013',
      {},
      env
    );

    const body = await response.json();
    expect(response.status).toBe(400);
    expect(body.status).toBe('error');
    expect(body.code).toBe('date_out_of_range');
  });
});
