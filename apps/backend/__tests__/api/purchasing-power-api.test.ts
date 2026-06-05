import app from '../../src';
import {
  clearMetrics,
  getMetricsSnapshot,
} from '../../src/telemetry/metrics';

describe('purchasing power API', () => {
  beforeEach(() => {
    clearMetrics();
  });

  it('returns city comparisons for a valid city and amount', async () => {
    const response = await app.request(
      '/api/purchasing-power/comparisons?city=phoenix&amountUsd=2500'
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.status).toBe('success');
    expect(body.city).toEqual({ id: 'phoenix', name: 'Phoenix', state: 'AZ' });
    expect(body.input.amountUsd).toBe(2500);
    expect(body.comparisons.monthlyEssentials).toHaveLength(4);
    expect(body.comparisons.bigPurchases).toHaveLength(3);
    expect(body.comparisons.monthlyEssentials[0]).toEqual(expect.objectContaining({
      itemId: 'rent',
      label: 'Monthly rent',
      category: 'monthly_essentials',
      costUsd: 1650,
      quantity: 1.52,
      summary: '1.52x monthly rent in Phoenix',
    }));
    expect(body.source).toEqual(expect.objectContaining({
      source: 'fallback',
      provider: 'curated_cost_of_living_dataset',
      datasetVersion: '2026-06-05.v1',
      isFallback: true,
    }));
    expect(getMetricsSnapshot()).toEqual([
      expect.objectContaining({
        name: 'crypto.api.purchasing_power.compute',
        status: 'success',
        metadata: expect.objectContaining({
          city: 'phoenix',
          amountBucket: '1000_4999',
        }),
      }),
    ]);
  });

  it('returns a validation error when city is missing', async () => {
    const response = await app.request('/api/purchasing-power/comparisons?amountUsd=2500');
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({
      status: 'error',
      code: 'missing_city',
      message: 'City is required.',
    });
  });

  it('returns a validation error for unsupported cities', async () => {
    const response = await app.request(
      '/api/purchasing-power/comparisons?city=los_angeles&amountUsd=2500'
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.status).toBe('error');
    expect(body.code).toBe('unsupported_city');
  });

  it('returns a validation error for invalid amounts', async () => {
    const response = await app.request(
      '/api/purchasing-power/comparisons?city=phoenix&amountUsd=0'
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.status).toBe('error');
    expect(body.code).toBe('invalid_amount');
  });
});
