import { GET } from '../../app/api/listings+api';
import { clearMetrics, getMetricsSnapshot } from '@/utils/metrics';

describe('listings API route', () => {
  const originalApiKey = process.env.CRYPTO_API_KEY;

  beforeEach(() => {
    clearMetrics();
    process.env.CRYPTO_API_KEY = 'test-key';
  });

  afterEach(() => {
    jest.restoreAllMocks();
    process.env.CRYPTO_API_KEY = originalApiKey;
  });

  it('returns live CoinMarketCap data when the upstream request succeeds', async () => {
    const liveListings = [
      {
        id: 999,
        name: 'Live Coin',
        symbol: 'LIVE',
        quote: { EUR: { price: 12.34, percent_change_1h: 1.2 } },
      },
    ];

    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ data: liveListings }),
    } as Response);

    const response = await GET(new Request('https://example.test/api/listings?limit=1'));

    expect(await response.json()).toEqual(liveListings);
    expect(getMetricsSnapshot().map((metric) => metric.name)).toEqual([
      'crypto.api.listings.upstream',
    ]);
  });
});
