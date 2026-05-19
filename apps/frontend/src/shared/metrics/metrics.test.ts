import {
  clearMetrics,
  getMetricsSnapshot,
  recordMetric,
  timeAsync,
  timeSync,
} from './metrics';

describe('metrics', () => {
  beforeEach(() => {
    clearMetrics();
  });

  it('records structured metric events', () => {
    recordMetric({
      name: 'crypto.simulation.create',
      durationMs: 12,
      status: 'success',
      metadata: { asset: 'BTC' },
    });

    expect(getMetricsSnapshot()).toEqual([
      {
        name: 'crypto.simulation.create',
        durationMs: 12,
        status: 'success',
        timestamp: expect.any(Number),
        metadata: { asset: 'BTC' },
      },
    ]);
  });

  it('records success latency for async operations', async () => {
    const result = await timeAsync('crypto.api.listings.upstream', () =>
      Promise.resolve('ok')
    );

    const [metric] = getMetricsSnapshot();

    expect(result).toBe('ok');
    expect(metric.name).toBe('crypto.api.listings.upstream');
    expect(metric.status).toBe('success');
    expect(typeof metric.durationMs).toBe('number');
  });

  it('records failure latency and rethrows async errors', async () => {
    try {
      await timeAsync('auth.sign_in.phone.prepare', async () => {
        throw new Error('failed');
      });
    } catch (error) {
      expect((error as Error).message).toBe('failed');
    }

    expect(getMetricsSnapshot()[0].status).toBe('error');
  });

  it('records sync operation latency', () => {
    const value = timeSync('crypto.simulation.create', () => 42);

    expect(value).toBe(42);
    expect(getMetricsSnapshot()[0].name).toBe('crypto.simulation.create');
  });
});
