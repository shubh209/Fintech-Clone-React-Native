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

const validSimulationEventScenarioResponse = {
  status: 'success',
  asset: {
    symbol: 'BTC',
    name: 'Bitcoin',
    coinGeckoId: 'bitcoin',
  },
  event: {
    id: 'btc-2021-etf-demand',
    assetSymbol: 'BTC',
    headline: 'ETF demand changes Bitcoin expectations',
    summary: 'Institutional demand shifted near-term expectations for Bitcoin.',
    eventDate: '2021-02-08',
    category: 'adoption',
    marketSentiment: 'positive',
    sources: eventSources,
  },
  input: {
    requestedDate: '2021-02-15',
    amountUsd: 100,
    delay: 'one_week',
    intendedBuyDate: '2021-02-15',
  },
  historical: {
    requestedDate: '2021-02-15',
    resolvedDate: '2021-02-15',
    dateResolution: 'exact',
    priceUsd: 47909.33,
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
    impliedQuantity: 0.002087,
    currentValueUsd: 225.4,
    gainLossUsd: 125.4,
    gainLossPercent: 125.4,
  },
  risk: {
    maxDrawdownPercent: -30.5,
    longestUnderwaterDays: 180,
    bestThirtyDayReturnPercent: 42.3,
    worstThirtyDayReturnPercent: -18.2,
    startDate: '2021-02-15',
    endDate: '2022-02-15',
  },
  takeaway: 'Waiting one week changed the simulation risk profile.',
};

describe('getSimulationEventScenario', () => {
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

  it('requests simulation event scenarios through the Worker base URL', async () => {
    fetchMock.mockResolvedValue({
      json: async () => validSimulationEventScenarioResponse,
    });

    const { getSimulationEventScenario } = require('./getSimulationEventScenario');

    await getSimulationEventScenario({
      eventId: 'btc-2021-etf-demand',
      delay: 'one_week',
      amountUsd: 100,
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://worker.example.com/api/simulation/event-scenarios?eventId=btc-2021-etf-demand&delay=one_week&amountUsd=100'
    );
  });

  it('rejects responses that fail the shared event scenario validator', async () => {
    fetchMock.mockResolvedValue({
      json: async () => ({
        ...validSimulationEventScenarioResponse,
        event: {
          ...validSimulationEventScenarioResponse.event,
          sources: [eventSources[0]],
        },
      }),
    });

    const { getSimulationEventScenario } = require('./getSimulationEventScenario');
    let error: Error | null = null;

    try {
      await getSimulationEventScenario({
        eventId: 'btc-2021-etf-demand',
        delay: 'one_week',
        amountUsd: 100,
      });
    } catch (caught) {
      error = caught as Error;
    }

    expect(error?.message).toBe('Invalid simulation event scenario response from cloud API');
  });

  it('records simulation event scenario fetch latency', async () => {
    fetchMock.mockResolvedValue({
      json: async () => validSimulationEventScenarioResponse,
    });

    const { clearMetrics, getMetricsSnapshot } = require('@/shared/metrics/metrics');
    clearMetrics();
    const { getSimulationEventScenario } = require('./getSimulationEventScenario');

    await getSimulationEventScenario({
      eventId: 'btc-2021-etf-demand',
      delay: 'one_week',
      amountUsd: 100,
    });

    expect(getMetricsSnapshot()).toEqual([
      expect.objectContaining({
        name: 'crypto.client.simulation_event_scenarios.fetch',
        status: 'success',
        metadata: {
          eventId: 'btc-2021-etf-demand',
          delay: 'one_week',
        },
      }),
    ]);
  });
});
