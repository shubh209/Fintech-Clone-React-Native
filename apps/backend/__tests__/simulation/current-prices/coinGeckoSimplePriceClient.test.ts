import { fetchCoinGeckoSimplePrices } from '../../../src/domains/simulation/current-prices/coinGeckoSimplePriceClient';

describe('fetchCoinGeckoSimplePrices', () => {
  it('fetches arbitrary supported asset prices and maps them by symbol', async () => {
    const calls: unknown[][] = [];
    const fetchImpl = async (...args: unknown[]) => {
      calls.push(args);
      return {
        ok: true,
        json: async () => ({
          bitcoin: { usd: 100, last_updated_at: 1_780_000_000 },
          binancecoin: { usd: 500, last_updated_at: 1_780_000_001 },
        }),
      };
    };

    const prices = await fetchCoinGeckoSimplePrices({
      apiKey: 'demo-key',
      assets: [
        { symbol: 'BTC', coinGeckoId: 'bitcoin' },
        { symbol: 'BNB', coinGeckoId: 'binancecoin' },
      ],
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    expect(String(calls[0][0])).toContain('ids=bitcoin%2Cbinancecoin');
    expect(calls[0][1]).toEqual({
      headers: { 'x-cg-demo-api-key': 'demo-key' },
    });
    expect(prices.BTC.priceUsd).toBe(100);
    expect(prices.BNB.priceUsd).toBe(500);
    expect(prices.BNB.updatedAt).toBe('2026-05-28T20:26:41.000Z');
  });

  it('throws when CoinGecko omits a supported asset price', async () => {
    let message = '';

    try {
      await fetchCoinGeckoSimplePrices({
        assets: [{ symbol: 'BNB', coinGeckoId: 'binancecoin' }],
        fetchImpl: (async () => ({
          ok: true,
          json: async () => ({}),
        })) as unknown as typeof fetch,
      });
    } catch (error) {
      message = error instanceof Error ? error.message : String(error);
    }

    expect(message).toBe('CoinGecko returned invalid USD price for binancecoin');
  });
});
