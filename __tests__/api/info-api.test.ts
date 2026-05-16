import { getInfo } from '../../apps/api/src/crypto/cryptoService';

describe('info cloud API service', () => {
  const fallbackInfo = {
    '1': {
      id: 1,
      name: 'Fallback Bitcoin',
      symbol: 'BTC',
      logo: 'https://example.test/btc.png',
    },
  };

  afterEach(() => {
    jest.restoreAllMocks();
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

    const response = await getInfo({
      env: {
        CRYPTO_API_KEY: 'test-key',
        CRYPTO_FALLBACKS: {
          get: async <T = unknown>() => fallbackInfo as T,
        },
      },
      ids: '999',
    });

    expect(response).toEqual(liveInfo);
  });

  it('falls back to cloud KV when live metadata is malformed', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ data: { '999': { id: 999, name: 'Broken' } } }),
    } as Response);
    const calls: unknown[][] = [];
    const get = async <T = unknown>(key: string, type: 'json') => {
      calls.push([key, type]);
      return fallbackInfo as T;
    };

    const response = await getInfo({
      env: {
        CRYPTO_API_KEY: 'test-key',
        CRYPTO_FALLBACKS: { get },
      },
      ids: '999',
    });

    expect(response).toEqual(fallbackInfo);
    expect(calls).toEqual([['crypto:info', 'json']]);
  });
});
