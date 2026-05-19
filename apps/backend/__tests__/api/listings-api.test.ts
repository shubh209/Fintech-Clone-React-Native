import { getListings } from '../../src/domains/crypto-market/cryptoService';

describe('listings cloud API service', () => {
  const fallbackListings = [
    {
      id: 1,
      name: 'Fallback Bitcoin',
      symbol: 'BTC',
      quote: { EUR: { price: 10 } },
    },
  ];

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns live CoinMarketCap data when the upstream request succeeds', async () => {
    const liveListings = [
      {
        id: 999,
        name: 'Live Coin',
        symbol: 'LIVE',
        quote: { EUR: { price: 12.34 } },
      },
    ];

    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ data: liveListings }),
    } as Response);

    const response = await getListings({
      env: {
        CRYPTO_API_KEY: 'test-key',
        CRYPTO_FALLBACKS: {
          get: async <T = unknown>() => fallbackListings as T,
        },
      },
      limit: '1',
    });

    expect(response).toEqual(liveListings);
  });

  it('falls back to cloud KV when live listings are malformed', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ data: [{ id: 1, name: 'Broken', symbol: 'BRK', quote: { EUR: {} } }] }),
    } as Response);
    const calls: unknown[][] = [];
    const get = async <T = unknown>(key: string, type: 'json') => {
      calls.push([key, type]);
      return fallbackListings as T;
    };

    const response = await getListings({
      env: {
        CRYPTO_API_KEY: 'test-key',
        CRYPTO_FALLBACKS: { get },
      },
      limit: '1',
    });

    expect(response).toEqual(fallbackListings);
    expect(calls).toEqual([['crypto:listings', 'json']]);
  });
});
