import { fetchCoinGeckoCurrentPrices } from '../../src/domains/simulation/coinGeckoCurrentPriceClient';

describe('CoinGecko current price client', () => {
  it('requests batched USD current prices for product assets', async () => {
    const fetchImpl = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        bitcoin: { usd: 100, last_updated_at: 1_780_000_000 },
        ethereum: { usd: 200, last_updated_at: 1_780_000_001 },
        solana: { usd: 300, last_updated_at: 1_780_000_002 },
      }),
    });

    const prices = await fetchCoinGeckoCurrentPrices({
      apiKey: 'demo-key',
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    expect(fetchImpl).toHaveBeenCalledWith(
      'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin%2Cethereum%2Csolana&vs_currencies=usd&include_last_updated_at=true',
      { headers: { 'x-cg-demo-api-key': 'demo-key' } }
    );
    expect(prices.BTC.assetSymbol).toBe('BTC');
    expect(prices.BTC.coinGeckoId).toBe('bitcoin');
    expect(prices.BTC.priceUsd).toBe(100);
    expect(prices.BTC.updatedAt).toBe('2026-05-28T20:26:40.000Z');
  });

  it('rejects missing or invalid USD prices', async () => {
    const fetchImpl = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        bitcoin: { usd: 100 },
        ethereum: { usd: 0 },
        solana: { usd: 300 },
      }),
    });

    let message = '';
    try {
      await fetchCoinGeckoCurrentPrices({ fetchImpl: fetchImpl as unknown as typeof fetch });
    } catch (error) {
      message = error instanceof Error ? error.message : '';
    }

    expect(message).toBe('CoinGecko returned invalid USD price for ethereum');
  });
});
