const validSimulationAssetsResponse = {
  status: 'success',
  assets: {
    ready: [
      {
        assetId: 'bitcoin',
        symbol: 'BTC',
        name: 'Bitcoin',
        category: 'store_of_value',
        status: 'ready',
        historical: {
          firstDate: '2021-01-01',
          lastDate: '2026-03-22',
          rowCount: 1910,
          missingDateCount: 0,
          largestGapDays: 1,
        },
        dataQuality: {
          repairedRowCount: 0,
          quarantinedRowCount: 0,
          eligibleRowCount: 1910,
          quarantineRate: 0,
          status: 'clean',
        },
        market: {
          coinGeckoId: 'bitcoin',
          rank: 1,
          imageUrl: 'https://example.com/btc.png',
          currentPriceUsd: 100000,
          priceChangePercentage24h: 1.2,
          updatedAt: '2026-06-05T00:00:00.000Z',
          status: 'fresh',
        },
        availability: {
          canSimulate: true,
          reason: null,
          detail: null,
        },
      },
    ],
    unavailable: [
      {
        assetId: 'dogecoin',
        symbol: 'DOGE',
        name: 'Dogecoin',
        category: 'meme',
        status: 'needs_market_mapping',
        historical: {
          firstDate: '2021-01-01',
          lastDate: '2026-03-22',
          rowCount: 1910,
          missingDateCount: 0,
          largestGapDays: 1,
        },
        dataQuality: {
          repairedRowCount: 0,
          quarantinedRowCount: 0,
          eligibleRowCount: 1910,
          quarantineRate: 0,
          status: 'clean',
        },
        market: {
          coinGeckoId: null,
          rank: null,
          imageUrl: null,
          currentPriceUsd: null,
          priceChangePercentage24h: null,
          updatedAt: null,
          status: 'unavailable',
        },
        availability: {
          canSimulate: false,
          reason: 'Current market price is unavailable.',
          detail: 'This asset does not have a CoinGecko market mapping.',
        },
      },
    ],
  },
  source: {
    historicalProvider: 'historical_csv',
    marketProvider: 'coingecko',
    importedAt: '2026-06-05T00:00:00.000Z',
    marketDataUpdatedAt: '2026-06-05T00:00:00.000Z',
    marketCacheStatus: 'fresh',
  },
};

describe('getSimulationAssets', () => {
  const originalApiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
  const fetchMock = jest.fn();
  const jestWithResetModules = jest as typeof jest & { resetModules(): void };

  beforeEach(() => {
    jestWithResetModules.resetModules();
    fetchMock.mockReset();
    process.env.EXPO_PUBLIC_API_BASE_URL = 'https://worker.example.com/';
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  afterEach(() => {
    process.env.EXPO_PUBLIC_API_BASE_URL = originalApiBaseUrl;
  });

  it('requests simulation assets through the Worker base URL', async () => {
    fetchMock.mockResolvedValue({
      json: async () => validSimulationAssetsResponse,
    });

    const { getSimulationAssets } = require('./getSimulationAssets');

    await getSimulationAssets();

    expect(fetchMock).toHaveBeenCalledWith(
      'https://worker.example.com/api/simulation/assets'
    );
  });

  it('rejects responses that fail the shared asset catalog validator', async () => {
    fetchMock.mockResolvedValue({
      json: async () => ({
        status: 'success',
        assets: { ready: [{ symbol: 'BTC' }] },
      }),
    });

    const { getSimulationAssets } = require('./getSimulationAssets');

    let error: Error | null = null;

    try {
      await getSimulationAssets();
    } catch (caught) {
      error = caught as Error;
    }

    expect(error?.message).toBe('Invalid simulation asset catalog response from cloud API');
  });

  it('records simulation asset catalog fetch latency', async () => {
    fetchMock.mockResolvedValue({
      json: async () => validSimulationAssetsResponse,
    });

    const { clearMetrics, getMetricsSnapshot } = require('@/shared/metrics/metrics');
    clearMetrics();
    const { getSimulationAssets } = require('./getSimulationAssets');

    await getSimulationAssets();

    expect(getMetricsSnapshot()).toEqual([
      expect.objectContaining({
        name: 'crypto.client.simulation_assets.fetch',
        status: 'success',
      }),
    ]);
  });
});
