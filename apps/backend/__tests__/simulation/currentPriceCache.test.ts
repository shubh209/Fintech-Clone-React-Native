import {
  clearCurrentPriceCache,
  getCachedCurrentPrices,
} from '../../src/domains/simulation/currentPriceCache';

const prices = {
  BTC: { assetSymbol: 'BTC' as const, coinGeckoId: 'bitcoin', priceUsd: 100, updatedAt: null },
  ETH: { assetSymbol: 'ETH' as const, coinGeckoId: 'ethereum', priceUsd: 200, updatedAt: null },
  SOL: { assetSymbol: 'SOL' as const, coinGeckoId: 'solana', priceUsd: 300, updatedAt: null },
};

describe('current price cache', () => {
  beforeEach(() => {
    clearCurrentPriceCache();
  });

  it('refreshes an empty cache', async () => {
    const refresh = jest.fn().mockResolvedValue(prices) as any;

    const result = await getCachedCurrentPrices({ refresh, nowMs: 1_000 });

    expect(result).toEqual({ prices, cacheStatus: 'refreshed' });
    expect(refresh.mock.calls.length).toBe(1);
  });

  it('reuses fresh cache without refreshing', async () => {
    const refresh = jest.fn().mockResolvedValue(prices) as any;
    await getCachedCurrentPrices({ refresh, nowMs: 1_000 });

    const result = await getCachedCurrentPrices({ refresh, nowMs: 30_000 });

    expect(result).toEqual({ prices, cacheStatus: 'fresh' });
    expect(refresh.mock.calls.length).toBe(1);
  });

  it('does not use expired cache when refresh fails', async () => {
    let calls = 0;
    const refresh = jest.fn().mockImplementation(async () => {
      calls += 1;
      if (calls === 1) return prices;
      throw new Error('down');
    }) as any;
    await getCachedCurrentPrices({ refresh, nowMs: 1_000 });

    let message = '';
    try {
      await getCachedCurrentPrices({ refresh, nowMs: 62_000 });
    } catch (error) {
      message = error instanceof Error ? error.message : '';
    }

    expect(message).toBe('down');
  });
});
