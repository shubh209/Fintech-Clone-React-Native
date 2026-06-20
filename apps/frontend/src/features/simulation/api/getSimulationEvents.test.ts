const eventSources = [
  {
    title: 'Bitcoin ETF demand accelerates',
    publisher: 'Example Markets',
    url: 'https://example.com/btc-etf-demand',
    publishedAt: '2021-02-08T00:00:00.000Z',
  },
  {
    title: 'Institutions add Bitcoin exposure',
    publisher: 'Example Finance',
    url: 'https://example.com/institutional-bitcoin',
    publishedAt: null,
  },
];

const validSimulationEventsResponse = {
  status: 'success',
  asset: {
    symbol: 'BTC',
    name: 'Bitcoin',
    coinGeckoId: 'bitcoin',
  },
  supportedDelays: ['same_day', 'one_week', 'one_month'],
  events: [
    {
      id: 'btc-2021-etf-demand',
      assetSymbol: 'BTC',
      headline: 'ETF demand changes Bitcoin expectations',
      summary: 'Institutional demand shifted near-term expectations for Bitcoin.',
      eventDate: '2021-02-08',
      category: 'adoption',
      marketSentiment: 'positive',
      sortOrder: 1,
      sources: eventSources,
    },
  ],
};

describe('getSimulationEvents', () => {
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

  it('requests simulation events through the Worker base URL', async () => {
    fetchMock.mockResolvedValue({
      json: async () => validSimulationEventsResponse,
    });

    const { getSimulationEvents } = require('./getSimulationEvents');

    await getSimulationEvents({ asset: 'BTC' });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://worker.example.com/api/simulation/events?asset=BTC'
    );
  });

  it('rejects responses that fail the shared event list validator', async () => {
    fetchMock.mockResolvedValue({
      json: async () => ({
        status: 'success',
        events: [{ id: 'btc-2021-etf-demand', assetSymbol: 'BTC' }],
      }),
    });

    const { getSimulationEvents } = require('./getSimulationEvents');
    let error: Error | null = null;

    try {
      await getSimulationEvents({ asset: 'BTC' });
    } catch (caught) {
      error = caught as Error;
    }

    expect(error?.message).toBe('Invalid simulation event list response from cloud API');
  });

  it('records simulation events fetch latency', async () => {
    fetchMock.mockResolvedValue({
      json: async () => validSimulationEventsResponse,
    });

    const { clearMetrics, getMetricsSnapshot } = require('@/shared/metrics/metrics');
    clearMetrics();
    const { getSimulationEvents } = require('./getSimulationEvents');

    await getSimulationEvents({ asset: 'BTC' });

    expect(getMetricsSnapshot()).toEqual([
      expect.objectContaining({
        name: 'crypto.client.simulation_events.fetch',
        status: 'success',
        metadata: {
          asset: 'BTC',
        },
      }),
    ]);
  });
});
