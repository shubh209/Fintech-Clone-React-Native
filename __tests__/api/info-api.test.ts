import { GET } from '../../app/api/info+api';
import { clearMetrics, getMetricsSnapshot } from '@/utils/metrics';

describe('info API route', () => {
  const originalApiKey = process.env.CRYPTO_API_KEY;

  beforeEach(() => {
    clearMetrics();
    process.env.CRYPTO_API_KEY = 'test-key';
  });

  afterEach(() => {
    jest.restoreAllMocks();
    process.env.CRYPTO_API_KEY = originalApiKey;
  });

  it('returns live CoinMarketCap metadata when the upstream request succeeds', async () => {
    const liveInfo = {
      '999': {
        id: 999,
        name: 'Live Coin',
        symbol: 'LIVE',
        logo: 'https://example.test/live.png',
      },
    };

    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ data: liveInfo }),
    } as Response);

    const response = await GET(new Request('https://example.test/api/info?ids=999'));

    expect(await response.json()).toEqual(liveInfo);
    expect(getMetricsSnapshot().map((metric) => metric.name)).toEqual([
      'crypto.api.info.upstream',
    ]);
  });
});
