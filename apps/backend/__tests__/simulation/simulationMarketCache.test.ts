import {
  clearSimulationMarketCache,
  getCachedSimulationMarkets,
} from '../../src/domains/simulation/simulationMarketCache';

const market = {
  coinGeckoId: 'bitcoin',
  rank: 1,
  imageUrl: 'https://example.com/btc.png',
  currentPriceUsd: 77000,
  priceChangePercentage24h: 1,
  updatedAt: '2026-05-26T00:00:00.000Z',
};

describe('simulationMarketCache', () => {
  beforeEach(() => clearSimulationMarketCache());

  it('returns fresh cache within 60 seconds', async () => {
    const refresh = jest.fn().mockResolvedValue({ bitcoin: market }) as any;

    await getCachedSimulationMarkets({ refresh, nowMs: 1000 });
    const second = await getCachedSimulationMarkets({ refresh, nowMs: 2000 });

    expect(refresh.mock.calls.length).toBe(1);
    expect(second).toEqual({
      markets: { bitcoin: market },
      cacheStatus: 'fresh',
      cachedAtMs: 1000,
    });
  });

  it('returns stale cache on refresh failure within 24 hours', async () => {
    await getCachedSimulationMarkets({
      refresh: jest.fn().mockResolvedValue({ bitcoin: market }) as any,
      nowMs: 1000,
    });

    const stale = await getCachedSimulationMarkets({
      refresh: jest.fn().mockRejectedValue(new Error('network')) as any,
      nowMs: 2 * 60 * 1000,
    });

    expect(stale.cacheStatus).toBe('stale');
    expect(stale.cachedAtMs).toBe(1000);
    expect(stale.markets.bitcoin.currentPriceUsd).toBe(77000);
  });

  it('throws when stale cache is older than 24 hours and refresh fails', async () => {
    await getCachedSimulationMarkets({
      refresh: jest.fn().mockResolvedValue({ bitcoin: market }) as any,
      nowMs: 1000,
    });

    let message = '';
    try {
      await getCachedSimulationMarkets({
        refresh: jest.fn().mockRejectedValue(new Error('network')) as any,
        nowMs: 25 * 60 * 60 * 1000,
      });
    } catch (error) {
      message = error instanceof Error ? error.message : '';
    }

    expect(message).toBe('Simulation market data unavailable');
  });
});
