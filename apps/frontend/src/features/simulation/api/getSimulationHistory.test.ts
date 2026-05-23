const validSimulationHistoryResponse = {
  status: 'success',
  asset: {
    symbol: 'BTC',
    name: 'Bitcoin',
    coinGeckoId: 'bitcoin',
  },
  range: {
    year: 2021,
    startDate: '2021-01-01',
    endDate: '2021-12-31',
  },
  points: [
    { date: '2021-01-01', priceUsd: 29374.15 },
    { date: '2021-02-01', priceUsd: 33537.17 },
  ],
  source: {
    source: 'fallback',
    provider: 'historical_csv',
    updatedAt: '2026-05-22T00:00:00.000Z',
    reason: 'curated historical dataset',
    isFallback: true,
  },
};

describe('getSimulationHistory', () => {
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

  it('requests yearly simulation history through the Worker base URL', async () => {
    fetchMock.mockResolvedValue({
      json: async () => validSimulationHistoryResponse,
    });

    const { getSimulationHistory } = require('./getSimulationHistory');

    await getSimulationHistory({ asset: 'BTC', year: 2021 });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://worker.example.com/api/simulation/history?asset=BTC&year=2021'
    );
  });

  it('rejects responses that fail the shared history validator', async () => {
    fetchMock.mockResolvedValue({
      json: async () => ({
        status: 'success',
        points: [{ date: '2021-01-01', priceUsd: 0 }],
      }),
    });

    const { getSimulationHistory } = require('./getSimulationHistory');
    let error: Error | null = null;

    try {
      await getSimulationHistory({ asset: 'BTC', year: 2021 });
    } catch (caught) {
      error = caught as Error;
    }

    expect(error?.message).toBe('Invalid simulation history response from cloud API');
  });

  it('records simulation history fetch latency', async () => {
    fetchMock.mockResolvedValue({
      json: async () => validSimulationHistoryResponse,
    });

    const { clearMetrics, getMetricsSnapshot } = require('@/shared/metrics/metrics');
    clearMetrics();
    const { getSimulationHistory } = require('./getSimulationHistory');

    await getSimulationHistory({ asset: 'BTC', year: 2021 });

    expect(getMetricsSnapshot()).toEqual([
      expect.objectContaining({
        name: 'crypto.client.simulation_history.fetch',
        status: 'success',
        metadata: {
          asset: 'BTC',
          year: 2021,
        },
      }),
    ]);
  });
});
