import { getTickers } from '../../src/domains/crypto-market/cryptoService';

describe('tickers cloud API service', () => {
  const fallbackTickers = [
    {
      timestamp: '2024-01-01T00:00:00.000Z',
      price: 100,
      volume_24h: 200,
      market_cap: 300,
    },
  ];

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns latest CoinMarketCap quote data for the requested asset when upstream succeeds', async () => {
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

    const response = await getTickers({
      env: {
        CRYPTO_API_KEY: 'test-key',
        CRYPTO_FALLBACKS: {
          get: async <T = unknown>() => fallbackTickers as T,
        },
      },
      id: '1027',
    });

    expect(fetchSpy.mock.calls[0]).toEqual([
      'https://pro-api.coinmarketcap.com/v2/cryptocurrency/quotes/latest?id=1027&convert=EUR',
      {
        headers: {
          'X-CMC_PRO_API_KEY': 'test-key',
        },
      },
    ]);
    expect(response).toEqual([
      {
        timestamp: '2026-05-14T15:00:00.000Z',
        price: 3210.45,
        volume_24h: 123456,
        market_cap: 789012,
      },
    ]);
  });

  it('returns cloud KV fallback data without waiting on upstream when no API key is configured', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch');
    const calls: unknown[][] = [];
    const get = async <T = unknown>(key: string, type: 'json') => {
      calls.push([key, type]);
      return fallbackTickers as T;
    };
    const response = await getTickers({
      env: { CRYPTO_FALLBACKS: { get } },
      id: '1027',
    });

    expect(response).toEqual(fallbackTickers);
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(calls).toEqual([['crypto:tickers', 'json']]);
  });

  it('falls back to cloud KV when live ticker quote is malformed', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ data: { '1027': { quote: { EUR: {} } } } }),
    } as Response);
    const calls: unknown[][] = [];
    const get = async <T = unknown>(key: string, type: 'json') => {
      calls.push([key, type]);
      return fallbackTickers as T;
    };

    const response = await getTickers({
      env: {
        CRYPTO_API_KEY: 'test-key',
        CRYPTO_FALLBACKS: { get },
      },
      id: '1027',
    });

    expect(response).toEqual(fallbackTickers);
    expect(calls).toEqual([['crypto:tickers', 'json']]);
  });
});
