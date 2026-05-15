import { GET } from '../../app/api/tickers+api';
import { clearMetrics, getMetricsSnapshot } from '@/utils/metrics';

describe('tickers API route', () => {
  const originalApiKey = process.env.CRYPTO_API_KEY;

  beforeEach(() => {
    clearMetrics();
    delete process.env.CRYPTO_API_KEY;
  });

  afterEach(() => {
    jest.restoreAllMocks();
    process.env.CRYPTO_API_KEY = originalApiKey;
  });

  it('returns latest CoinMarketCap quote data for the requested asset when upstream succeeds', async () => {
    process.env.CRYPTO_API_KEY = 'test-key';
    const liveQuote = {
      id: 1027,
      quote: {
        EUR: {
          price: 3210.45,
          volume_24h: 123456,
          market_cap: 789012,
          last_updated: '2026-05-14T15:00:00.000Z',
        },
      },
    };

    const fetchSpy = jest.spyOn(global, 'fetch') as unknown as {
      mock: { calls: unknown[][] };
      mockResolvedValue(value: Response): void;
    };

    fetchSpy.mockResolvedValue({
      ok: true,
      json: async () => ({ data: { '1027': liveQuote } }),
    } as Response);

    const response = await GET(new Request('https://example.test/api/tickers?id=1027'));

    expect(fetchSpy.mock.calls[0]).toEqual([
      'https://pro-api.coinmarketcap.com/v2/cryptocurrency/quotes/latest?id=1027&convert=EUR',
      {
        headers: {
          'X-CMC_PRO_API_KEY': 'test-key',
        },
      },
    ]);
    expect(await response.json()).toEqual([
      {
        timestamp: '2026-05-14T15:00:00.000Z',
        price: 3210.45,
        volume_24h: 123456,
        market_cap: 789012,
      },
    ]);
    expect(getMetricsSnapshot().map((metric) => metric.name)).toEqual([
      'crypto.api.tickers.upstream',
    ]);
  });

  it('returns local ticker data immediately without waiting on upstream when no API key is configured', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch');
    const response = await GET(new Request('https://example.test/api/tickers?id=1027'));

    expect(Array.isArray(await response.json())).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(getMetricsSnapshot().map((metric) => metric.name)).toEqual([
      'crypto.api.tickers.local',
    ]);
  });

  it('falls back when live ticker quote is malformed', async () => {
    process.env.CRYPTO_API_KEY = 'test-key';
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ data: { '1027': { quote: { EUR: {} } } } }),
    } as Response);

    const response = await GET(new Request('https://example.test/api/tickers?id=1027'));

    expect(Array.isArray(await response.json())).toBe(true);
    expect(getMetricsSnapshot().map((metric) => metric.name)).toEqual([
      'crypto.api.tickers.upstream',
      'crypto.api.tickers.local',
    ]);
  });
});
