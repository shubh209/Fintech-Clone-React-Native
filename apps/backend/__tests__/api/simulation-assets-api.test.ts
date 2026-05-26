import app from '../../src';
import { clearSimulationMarketCache } from '../../src/domains/simulation/simulationMarketCache';
import { SqlDatabase } from '../../src/types';

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

const originalFetch = global.fetch;

describe('GET /api/simulation/assets', () => {
  beforeEach(() => {
    clearSimulationMarketCache();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('returns split ready and unavailable assets with market and availability details', async () => {
    global.fetch = (async () => ({
      ok: true,
      json: async () => [
        {
          id: 'bitcoin',
          symbol: 'btc',
          name: 'Bitcoin',
          image: 'https://example.com/btc.png',
          market_cap_rank: 1,
          current_price: 77000,
          price_change_percentage_24h: 1.2,
          last_updated: '2026-05-26T00:00:00.000Z',
        },
      ],
    })) as unknown as typeof fetch;

    const response = await app.request(
      '/api/simulation/assets',
      {},
      {
        HISTORICAL_PRICES_DB: createDb([
          {
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
          },
          {
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
          },
        ]),
      }
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.assets.ready[0].assetId).toBe('bitcoin');
    expect(body.assets.ready[0].market.currentPriceUsd).toBe(77000);
    expect(body.assets.unavailable[0].assetId).toBe('sui');
    expect(body.assets.unavailable[0].availability.detail).toContain('non-positive');
  });
});
