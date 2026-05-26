import app from '../../src';
import {
  clearSimulationMarketCache,
  simulationMarketFreshTtlMs,
} from '../../src/domains/simulation/simulationMarketCache';
import { SqlDatabase } from '../../src/types';

const catalogUnavailableError = {
  status: 'error',
  code: 'simulation_assets_unavailable',
  message: 'Simulation asset catalog is unavailable.',
};

const bitcoinAssetRow = {
  asset_id: 'bitcoin',
  symbol: 'BTC',
  name: 'bitcoin',
  csv_file_name: 'bitcoin_BTC.csv',
  category: 'Layer 1',
  status: 'ready',
  historical_symbol: 'BTC',
  first_imported_date: '2021-01-01',
  last_imported_date: '2026-03-22',
  imported_row_count: 1906,
  missing_date_count: 1,
  largest_gap_days: 2,
  unavailable_reason: null,
  unavailable_detail: null,
  coin_gecko_id: 'bitcoin',
  imported_at: '2026-05-22T00:00:00.000Z',
  updated_at: '2026-05-22T00:00:00.000Z',
};

const suiAssetRow = {
  asset_id: 'sui',
  symbol: 'SUI',
  name: 'sui',
  csv_file_name: 'sui_SUI.csv',
  category: 'Layer 1',
  status: 'historical_invalid',
  historical_symbol: 'SUI',
  first_imported_date: null,
  last_imported_date: null,
  imported_row_count: 0,
  missing_date_count: 0,
  largest_gap_days: 0,
  unavailable_reason: 'Historical data needs validation.',
  unavailable_detail: 'SUI has non-positive OHLC values',
  coin_gecko_id: null,
  imported_at: '2026-05-22T00:00:00.000Z',
  updated_at: '2026-05-22T00:00:00.000Z',
};

const bitcoinMarketRow = {
  id: 'bitcoin',
  symbol: 'btc',
  name: 'Bitcoin',
  image: 'https://example.com/btc.png',
  market_cap_rank: 1,
  current_price: 77000,
  price_change_percentage_24h: 1.2,
  last_updated: '2026-05-26T00:00:00.000Z',
};

function createDb(rows: Array<Record<string, unknown>>): SqlDatabase {
  return {
    prepare: () => ({
      bind() {
        return this;
      },
      first: async <T = unknown>() => (rows[0] as T | undefined) ?? null,
      all: async <T = unknown>() => ({ results: rows as T[] }),
      run: async () => ({}),
    }),
  };
}

function createThrowingDb(): SqlDatabase {
  return {
    prepare: () => ({
      bind() {
        return this;
      },
      first: async () => null,
      all: async () => {
        throw new Error('no such table: simulation_assets');
      },
      run: async () => ({}),
    }),
  };
}

function mockCoinGeckoMarkets(rows: Array<Record<string, unknown>>) {
  global.fetch = (async () => ({
    ok: true,
    json: async () => rows,
  })) as unknown as typeof fetch;
}

const originalFetch = global.fetch;
const OriginalDate = Date;

function setSystemDate(date: Date) {
  const fixedTime = date.getTime();

  global.Date = class extends OriginalDate {
    constructor(value?: string | number | Date) {
      if (value === undefined) {
        super(fixedTime);
        return;
      }

      super(value);
    }

    static now() {
      return fixedTime;
    }
  } as DateConstructor;
}

describe('GET /api/simulation/assets', () => {
  beforeEach(() => {
    clearSimulationMarketCache();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    global.Date = OriginalDate;
    jest.restoreAllMocks();
  });

  it('returns split ready and unavailable assets with market and availability details', async () => {
    mockCoinGeckoMarkets([bitcoinMarketRow]);

    const response = await app.request(
      '/api/simulation/assets',
      {},
      {
        HISTORICAL_PRICES_DB: createDb([bitcoinAssetRow, suiAssetRow]),
      }
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.assets.ready[0].assetId).toBe('bitcoin');
    expect(body.assets.ready[0].market.currentPriceUsd).toBe(77000);
    expect(body.assets.unavailable[0].assetId).toBe('sui');
    expect(body.assets.unavailable[0].availability.detail).toContain('non-positive');
  });

  it('returns the shared unavailable error when the D1 binding is missing', async () => {
    const response = await app.request('/api/simulation/assets', {}, {});

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual(catalogUnavailableError);
  });

  it('returns the shared unavailable error when the catalog query fails', async () => {
    const response = await app.request(
      '/api/simulation/assets',
      {},
      { HISTORICAL_PRICES_DB: createThrowingDb() }
    );

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual(catalogUnavailableError);
  });

  it('keeps the catalog available when CoinGecko is unavailable and no cache exists', async () => {
    global.fetch = (async () => {
      throw new Error('network down');
    }) as unknown as typeof fetch;

    const response = await app.request(
      '/api/simulation/assets',
      {},
      { HISTORICAL_PRICES_DB: createDb([bitcoinAssetRow]) }
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.assets.ready[0].market.status).toBe('unavailable');
    expect(body.assets.ready[0].market.currentPriceUsd).toBeNull();
    expect(body.assets.ready[0].availability.canSimulate).toBe(false);
    expect(body.source.marketCacheStatus).toBe('unavailable');
  });

  it('returns stale market data when refresh fails after the fresh TTL', async () => {
    const initialTimeMs = OriginalDate.parse('2026-05-26T00:00:00.000Z');
    setSystemDate(new OriginalDate(initialTimeMs));
    mockCoinGeckoMarkets([bitcoinMarketRow]);

    await app.request(
      '/api/simulation/assets',
      {},
      { HISTORICAL_PRICES_DB: createDb([bitcoinAssetRow]) }
    );

    setSystemDate(new OriginalDate(initialTimeMs + simulationMarketFreshTtlMs + 1));
    global.fetch = (async () => {
      throw new Error('network down');
    }) as unknown as typeof fetch;

    const response = await app.request(
      '/api/simulation/assets',
      {},
      { HISTORICAL_PRICES_DB: createDb([bitcoinAssetRow]) }
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.assets.ready[0].market.status).toBe('stale');
    expect(body.assets.ready[0].market.currentPriceUsd).toBe(77000);
    expect(body.assets.ready[0].availability.canSimulate).toBe(false);
    expect(body.source.marketCacheStatus).toBe('stale');
  });

  it('keeps ready assets visible when CoinGecko omits their market row', async () => {
    mockCoinGeckoMarkets([]);

    const response = await app.request(
      '/api/simulation/assets',
      {},
      { HISTORICAL_PRICES_DB: createDb([bitcoinAssetRow]) }
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.assets.ready[0].assetId).toBe('bitcoin');
    expect(body.assets.ready[0].market.currentPriceUsd).toBeNull();
    expect(body.assets.ready[0].market.status).toBe('unavailable');
    expect(body.assets.ready[0].availability.canSimulate).toBe(false);
    expect(body.assets.ready[0].availability.reason).toBe(
      'Current market price is unavailable.'
    );
    expect(body.assets.ready[0].availability.detail).toContain('bitcoin');
  });
});
