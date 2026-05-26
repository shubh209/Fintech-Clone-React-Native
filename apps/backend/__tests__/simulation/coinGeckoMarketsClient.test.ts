import { fetchCoinGeckoMarkets } from '../../src/domains/simulation/coinGeckoMarketsClient';

describe('fetchCoinGeckoMarkets', () => {
  it('calls Demo coins markets endpoint with x-cg-demo-api-key', async () => {
    const fetchImpl = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => [
        {
          id: 'bitcoin',
          symbol: 'btc',
          name: 'Bitcoin',
          image: 'https://example.com/btc.png',
          market_cap_rank: 1,
          current_price: 77000,
          price_change_percentage_24h: -1.2,
          last_updated: '2026-05-26T00:00:00.000Z',
        },
      ],
    }) as unknown as typeof fetch;

    const markets = await fetchCoinGeckoMarkets({
      coinGeckoIds: ['bitcoin'],
      apiKey: 'CG-demo',
      fetchImpl,
    });

    const [url, init] = (fetchImpl as any).mock.calls[0];
    const parsedUrl = new URL(url);
    expect(parsedUrl.origin + parsedUrl.pathname).toBe(
      'https://api.coingecko.com/api/v3/coins/markets'
    );
    expect(init).toEqual({ headers: { 'x-cg-demo-api-key': 'CG-demo' } });
    expect(parsedUrl.searchParams.get('vs_currency')).toBe('usd');
    expect(parsedUrl.searchParams.get('ids')).toBe('bitcoin');
    expect(parsedUrl.searchParams.get('order')).toBe('market_cap_desc');
    expect(parsedUrl.searchParams.get('per_page')).toBe('1');
    expect(parsedUrl.searchParams.get('page')).toBe('1');
    expect(parsedUrl.searchParams.get('sparkline')).toBe('false');
    expect(parsedUrl.searchParams.get('price_change_percentage')).toBe('24h');
    expect(markets.bitcoin).toEqual({
      coinGeckoId: 'bitcoin',
      rank: 1,
      imageUrl: 'https://example.com/btc.png',
      currentPriceUsd: 77000,
      priceChangePercentage24h: -1.2,
      updatedAt: '2026-05-26T00:00:00.000Z',
    });
  });

  it('rejects invalid market rows', async () => {
    const fetchImpl = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => [{ id: 'bitcoin', current_price: -1 }],
    }) as unknown as typeof fetch;

    let message = '';
    try {
      await fetchCoinGeckoMarkets({ coinGeckoIds: ['bitcoin'], fetchImpl });
    } catch (error) {
      message = error instanceof Error ? error.message : '';
    }

    expect(message).toBe('invalid CoinGecko market row');
  });

  it('throws with the response status when CoinGecko returns a non-ok response', async () => {
    const fetchImpl = jest.fn().mockResolvedValue({
      ok: false,
      status: 429,
    }) as unknown as typeof fetch;

    let message = '';
    try {
      await fetchCoinGeckoMarkets({ coinGeckoIds: ['bitcoin'], fetchImpl });
    } catch (error) {
      message = error instanceof Error ? error.message : '';
    }

    expect(message).toBe('CoinGecko markets request failed: 429');
  });

  it('rejects market rows missing a CoinGecko id', async () => {
    const fetchImpl = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => [{ current_price: 77000 }],
    }) as unknown as typeof fetch;

    let message = '';
    try {
      await fetchCoinGeckoMarkets({ coinGeckoIds: ['bitcoin'], fetchImpl });
    } catch (error) {
      message = error instanceof Error ? error.message : '';
    }

    expect(message).toBe('invalid CoinGecko market row');
  });

  it('maps invalid or missing optional market fields to null', async () => {
    const fetchImpl = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => [
        {
          id: 'bitcoin',
          current_price: 77000,
          market_cap_rank: '1',
          image: '',
          price_change_percentage_24h: Number.NaN,
        },
      ],
    }) as unknown as typeof fetch;

    const markets = await fetchCoinGeckoMarkets({ coinGeckoIds: ['bitcoin'], fetchImpl });

    expect(markets.bitcoin).toEqual({
      coinGeckoId: 'bitcoin',
      rank: null,
      imageUrl: null,
      currentPriceUsd: 77000,
      priceChangePercentage24h: null,
      updatedAt: null,
    });
  });
});
