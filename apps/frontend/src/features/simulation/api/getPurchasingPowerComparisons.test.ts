const validPurchasingPowerResponse = {
  status: 'success',
  city: {
    id: 'phoenix',
    name: 'Phoenix',
    state: 'AZ',
  },
  input: {
    amountUsd: 2500,
  },
  comparisons: {
    monthlyEssentials: [
      {
        itemId: 'rent',
        label: 'Monthly rent',
        category: 'monthly_essentials',
        costUsd: 1650,
        quantity: 1.52,
        summary: '1.52x monthly rent in Phoenix',
      },
    ],
    bigPurchases: [
      {
        itemId: 'laptop',
        label: 'Laptop',
        category: 'big_purchase',
        costUsd: 1600,
        quantity: 1.56,
        summary: '1.56x laptop in Phoenix',
      },
    ],
  },
  source: {
    source: 'fallback',
    provider: 'curated_cost_of_living_dataset',
    updatedAt: '2026-06-05T00:00:00.000Z',
    reason: 'curated portfolio simulation dataset',
    isFallback: true,
    datasetVersion: '2026-06-05.v1',
  },
};

describe('getPurchasingPowerComparisons', () => {
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

  it('requests purchasing power comparisons through the Worker base URL', async () => {
    fetchMock.mockResolvedValue({
      json: async () => validPurchasingPowerResponse,
    });

    const { getPurchasingPowerComparisons } = require('./getPurchasingPowerComparisons');

    await getPurchasingPowerComparisons({
      city: 'phoenix',
      amountUsd: 2500,
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://worker.example.com/api/purchasing-power/comparisons?city=phoenix&amountUsd=2500'
    );
  });

  it('rejects responses that fail the shared purchasing power validator', async () => {
    fetchMock.mockResolvedValue({
      json: async () => ({
        status: 'success',
        city: { id: 'los_angeles' },
      }),
    });

    const { getPurchasingPowerComparisons } = require('./getPurchasingPowerComparisons');

    let error: Error | null = null;

    try {
      await getPurchasingPowerComparisons({
        city: 'phoenix',
        amountUsd: 2500,
      });
    } catch (caught) {
      error = caught as Error;
    }

    expect(error?.message).toBe('Invalid purchasing power response from cloud API');
  });

  it('records purchasing power fetch latency', async () => {
    fetchMock.mockResolvedValue({
      json: async () => validPurchasingPowerResponse,
    });

    const { clearMetrics, getMetricsSnapshot } = require('@/shared/metrics/metrics');
    clearMetrics();
    const { getPurchasingPowerComparisons } = require('./getPurchasingPowerComparisons');

    await getPurchasingPowerComparisons({
      city: 'phoenix',
      amountUsd: 2500,
    });

    expect(getMetricsSnapshot()).toEqual([
      expect.objectContaining({
        name: 'crypto.client.purchasing_power.fetch',
        status: 'success',
        metadata: {
          city: 'phoenix',
        },
      }),
    ]);
  });
});
