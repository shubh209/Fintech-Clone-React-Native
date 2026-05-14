import { GET } from '../../app/api/tickers+api';
import { clearMetrics, getMetricsSnapshot } from '@/utils/metrics';

describe('tickers API route', () => {
  beforeEach(() => {
    clearMetrics();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns local ticker data immediately without waiting on CoinPaprika', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch');
    const response = await GET(new Request('https://example.test/api/tickers'));

    expect(Array.isArray(await response.json())).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(getMetricsSnapshot().map((metric) => metric.name)).toEqual([
      'crypto.api.tickers.local',
    ]);
  });
});
