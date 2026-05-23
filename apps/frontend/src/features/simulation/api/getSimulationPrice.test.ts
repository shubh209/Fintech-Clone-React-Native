const validSimulationPriceResponse = {
  status: 'success',
  asset: {
    symbol: 'BTC',
    name: 'Bitcoin',
    coinGeckoId: 'bitcoin',
  },
  input: {
    requestedDate: '2021-01-01',
    amountUsd: 100,
  },
  historical: {
    requestedDate: '2021-01-01',
    resolvedDate: '2021-01-01',
    dateResolution: 'exact',
    priceUsd: 29374.15,
    source: {
      source: 'live',
      provider: 'Cloudflare D1 historical_crypto_prices',
      updatedAt: '2026-05-22T00:00:00.000Z',
      isFallback: false,
    },
  },
  current: {
    priceUsd: 108000,
    source: {
      source: 'live',
      provider: 'CoinGecko Simple Price',
      updatedAt: '2026-05-23T00:00:00.000Z',
      isFallback: false,
    },
    cache: {
      status: 'refreshed',
      ttlSeconds: 60,
    },
  },
  result: {
    impliedQuantity: 0.003404,
    currentValueUsd: 367.63,
    gainLossUsd: 267.63,
    gainLossPercent: 267.63,
  },
};

describe('getSimulationPrice', () => {
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

  it('requests the simulation price endpoint through the Worker base URL', async () => {
    fetchMock.mockResolvedValue({
      json: async () => validSimulationPriceResponse,
    });

    const { getSimulationPrice } = require('./getSimulationPrice');

    await getSimulationPrice({
      asset: 'BTC',
      date: '2021-01-01',
      amountUsd: 100,
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://worker.example.com/api/simulation/prices?asset=BTC&date=2021-01-01&amountUsd=100'
    );
  });

  it('rejects responses that fail the shared simulation validator', async () => {
    fetchMock.mockResolvedValue({
      json: async () => ({
        status: 'success',
        asset: { symbol: 'DOGE' },
      }),
    });

    const { getSimulationPrice } = require('./getSimulationPrice');

    let error: Error | null = null;

    try {
      await getSimulationPrice({
        asset: 'BTC',
        date: '2021-01-01',
        amountUsd: 100,
      });
    } catch (caught) {
      error = caught as Error;
    }

    expect(error?.message).toBe('Invalid simulation price response from cloud API');
  });

  it('records simulation price fetch latency', async () => {
    fetchMock.mockResolvedValue({
      json: async () => validSimulationPriceResponse,
    });

    const { clearMetrics, getMetricsSnapshot } = require('@/shared/metrics/metrics');
    clearMetrics();
    const { getSimulationPrice } = require('./getSimulationPrice');

    await getSimulationPrice({
      asset: 'BTC',
      date: '2021-01-01',
      amountUsd: 100,
    });

    expect(getMetricsSnapshot()).toEqual([
      expect.objectContaining({
        name: 'crypto.client.simulation_prices.fetch',
        status: 'success',
        metadata: {
          asset: 'BTC',
          date: '2021-01-01',
        },
      }),
    ]);
  });
});
