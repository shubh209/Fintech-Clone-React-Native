import app from '../../src';
import { clearCurrentPriceCache } from '../../src/domains/simulation/currentPriceCache';
import { clearMetrics, getMetricsSnapshot } from '../../src/telemetry/metrics';
import { SqlDatabase } from '../../src/types';

function supportedAssetRow(symbol: string, coinGeckoId: string, marketRank: number) {
  return {
    asset_id: coinGeckoId,
    symbol,
    name: coinGeckoId,
    status: 'ready',
    coin_gecko_id: coinGeckoId,
    historical_symbol: symbol,
    first_imported_date: '2017-11-09',
    last_imported_date: '2026-03-22',
    imported_row_count: 3055,
    market_rank: marketRank,
  };
}

const defaultAssetRows = [
  supportedAssetRow('BTC', 'bitcoin', 1),
  supportedAssetRow('ETH', 'ethereum', 2),
  supportedAssetRow('SOL', 'solana', 7),
  supportedAssetRow('BNB', 'binancecoin', 4),
  supportedAssetRow('AAVE', 'aave', 64),
];

const top20AssetSpecs = [
  ['BTC', 'bitcoin', 1],
  ['ETH', 'ethereum', 2],
  ['USDT', 'tether', 3],
  ['BNB', 'binancecoin', 4],
  ['USDC', 'usd-coin', 5],
  ['XRP', 'ripple', 6],
  ['SOL', 'solana', 7],
  ['TRX', 'tron', 8],
  ['HYPE', 'hyperliquid', 9],
  ['DOGE', 'dogecoin', 10],
  ['USDS', 'usds', 11],
  ['RAIN', 'rain', 12],
  ['LEO', 'leo-token', 13],
  ['ZEC', 'zcash', 14],
  ['XLM', 'stellar', 15],
  ['WBT', 'whitebit', 16],
  ['ADA', 'cardano', 17],
  ['LINK', 'chainlink', 18],
  ['CC', 'canton-network', 19],
  ['XMR', 'monero', 20],
] as const;

const top20AssetRows = top20AssetSpecs.map(([symbol, coinGeckoId, marketRank]) =>
  supportedAssetRow(symbol, coinGeckoId, marketRank)
);

function fakeHistoricalDb(
  rows: Array<Record<string, unknown>>,
  assetRows: Array<Record<string, unknown>> = defaultAssetRows
): SqlDatabase {
  return {
    prepare: (query: string) => ({
      bind: (...values: unknown[]) => ({
        first: async () => {
          if (query.includes('FROM simulation_assets')) return null;

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
          if (query.includes('FROM simulation_assets')) {
            return { results: assetRows };
          }

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
      all: async () => {
        if (query.includes('FROM simulation_assets')) {
          return { results: assetRows };
        }
        return { results: [] };
      },
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

const bnbHistoricalRow = {
  ...historicalRow,
  asset_symbol: 'BNB',
  asset_name: 'binancecoin',
  close_usd: 40,
  source_path: 'crypto_top100/binancecoin_BNB.csv',
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
      '/api/simulation/prices?asset=UNKNOWN&date=2021-01-01&amountUsd=100',
      {},
      env
    );

    const body = await response.json();
    expect(body.status).toBe('error');
    expect(body.code).toBe('unsupported_asset');
    expect(response.status).toBe(400);
  });

  it('combines historical and current prices for a ready asset outside the former top-20 scope', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        bitcoin: { usd: 250, last_updated_at: 1_780_000_000 },
        ethereum: { usd: 200, last_updated_at: 1_780_000_000 },
        solana: { usd: 50, last_updated_at: 1_780_000_000 },
        binancecoin: { usd: 500, last_updated_at: 1_780_000_000 },
        aave: { usd: 300, last_updated_at: 1_780_000_000 },
      }),
    } as Response);

    const response = await app.request(
      '/api/simulation/prices?asset=AAVE&date=2021-01-01&amountUsd=100',
      {},
      {
        ...env,
        HISTORICAL_PRICES_DB: fakeHistoricalDb([
          {
            ...historicalRow,
            asset_symbol: 'AAVE',
            asset_name: 'aave',
            close_usd: 50,
            source_path: 'crypto_top100/aave_AAVE.csv',
          },
        ]),
      }
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.status).toBe('success');
    expect(body.asset.symbol).toBe('AAVE');
    expect(body.current.priceUsd).toBe(300);
    expect(body.result.currentValueUsd).toBe(600);
  });

  it('combines historical and current prices for a supported top-20 non-v1 asset', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        bitcoin: { usd: 250, last_updated_at: 1_780_000_000 },
        ethereum: { usd: 200, last_updated_at: 1_780_000_000 },
        solana: { usd: 50, last_updated_at: 1_780_000_000 },
        binancecoin: { usd: 500, last_updated_at: 1_780_000_000 },
        aave: { usd: 300, last_updated_at: 1_780_000_000 },
      }),
    } as Response);

    const response = await app.request(
      '/api/simulation/prices?asset=BNB&date=2021-01-01&amountUsd=100',
      {},
      { ...env, HISTORICAL_PRICES_DB: fakeHistoricalDb([bnbHistoricalRow]) }
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.status).toBe('success');
    expect(body.asset.symbol).toBe('BNB');
    expect(body.asset.coinGeckoId).toBe('binancecoin');
    expect(body.historical.priceUsd).toBe(40);
    expect(body.current.priceUsd).toBe(500);
    expect(body.result.currentValueUsd).toBe(1250);
  });

  it('runs price simulations for every ready asset in the support set', async () => {
    const readyAssetSpecs = [...top20AssetSpecs, ['AAVE', 'aave', 64] as const];
    const historicalRows = readyAssetSpecs.map(([symbol, coinGeckoId], index) => ({
      ...historicalRow,
      asset_symbol: symbol,
      asset_name: coinGeckoId,
      close_usd: 10 + index,
      source_path: `crypto_top100/${coinGeckoId}_${symbol}.csv`,
    }));
    const currentPrices = Object.fromEntries(
      readyAssetSpecs.map(([, coinGeckoId], index) => [
        coinGeckoId,
        { usd: 100 + index, last_updated_at: 1_780_000_000 },
      ])
    );
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => currentPrices,
    } as Response);

    for (const [symbol] of readyAssetSpecs) {
      clearCurrentPriceCache();
      const response = await app.request(
        `/api/simulation/prices?asset=${symbol}&date=2021-01-01&amountUsd=100`,
        {},
        {
          ...env,
          HISTORICAL_PRICES_DB: fakeHistoricalDb(historicalRows, [
            ...top20AssetRows,
            supportedAssetRow('AAVE', 'aave', 64),
          ]),
        }
      );
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.status).toBe('success');
      expect(body.asset.symbol).toBe(symbol);
      expect(body.result.currentValueUsd).toBeGreaterThan(0);
    }
  });

  it('combines historical and current prices into a simulation result', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        bitcoin: { usd: 250, last_updated_at: 1_780_000_000 },
        ethereum: { usd: 200, last_updated_at: 1_780_000_000 },
        solana: { usd: 50, last_updated_at: 1_780_000_000 },
        binancecoin: { usd: 500, last_updated_at: 1_780_000_000 },
        aave: { usd: 300, last_updated_at: 1_780_000_000 },
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
        binancecoin: { usd: 500, last_updated_at: 1_780_000_000 },
        aave: { usd: 300, last_updated_at: 1_780_000_000 },
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

  it('returns a yearly historical chart series for a supported top-20 non-v1 asset', async () => {
    const response = await app.request(
      '/api/simulation/history?asset=BNB&year=2021',
      {},
      {
        ...env,
        HISTORICAL_PRICES_DB: fakeHistoricalDb([
          bnbHistoricalRow,
          { ...bnbHistoricalRow, date: '2021-02-01', close_usd: 55 },
        ]),
      }
    );

    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.status).toBe('success');
    expect(body.asset.symbol).toBe('BNB');
    expect(body.asset.coinGeckoId).toBe('binancecoin');
    expect(body.points).toEqual([
      { date: '2021-01-01', priceUsd: 40 },
      { date: '2021-02-01', priceUsd: 55 },
    ]);
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
