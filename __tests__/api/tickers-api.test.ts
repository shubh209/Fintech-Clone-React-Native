import { GET, getHistoricalTickerStartDate } from '../../app/api/tickers+api';
import { clearMetrics, getMetricsSnapshot } from '@/utils/metrics';

describe('tickers API route', () => {
  beforeEach(() => {
    clearMetrics();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns live CoinPaprika ticker data when the upstream request succeeds', async () => {
    const liveTickers = [
      {
        timestamp: '2024-01-01T00:00:00Z',
        price: 123,
        volume_24h: 456,
        market_cap: 789,
      },
    ];

    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => liveTickers,
    } as Response);

    const response = await GET(new Request('https://example.test/api/tickers'));

    expect(await response.json()).toEqual(liveTickers);
    expect(getMetricsSnapshot().map((metric) => metric.name)).toEqual([
      'crypto.api.tickers.upstream',
    ]);
    expect((global.fetch as any).mock.calls[0][0]).toContain('start=');
    expect((global.fetch as any).mock.calls[0][0]).toContain('interval=1d');
  });

  it('falls back to local ticker data when the upstream request fails', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({}),
    } as Response);

    const response = await GET(new Request('https://example.test/api/tickers'));
    const metrics = getMetricsSnapshot();

    expect(Array.isArray(await response.json())).toBe(true);
    expect(metrics.map((metric) => metric.name)).toEqual([
      'crypto.api.tickers.upstream',
      'crypto.api.tickers.fallback',
    ]);
    expect(metrics.map((metric) => metric.status)).toEqual(['error', 'success']);
  });

  it('uses a 365-day historical window for free CoinPaprika daily data', () => {
    expect(getHistoricalTickerStartDate(new Date('2026-05-13T12:00:00Z'))).toBe(
      '2025-05-13'
    );
  });
});
