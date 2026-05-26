jest.mock('../../src/telemetry/metrics', () => ({
  recordMetric: jest.fn(),
}));

import { recordMetric } from '../../src/telemetry/metrics';
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

const updatedMarket = {
  ...market,
  currentPriceUsd: 88000,
  updatedAt: '2026-05-26T01:00:00.000Z',
};

describe('simulationMarketCache', () => {
  beforeEach(() => {
    clearSimulationMarketCache();
    (recordMetric as any).mockClear();
  });

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

  it('refreshes expired fresh cache and returns new market data', async () => {
    let refreshCalls = 0;
    const refresh = jest.fn();
    refresh.mockImplementation(async () => {
      refreshCalls += 1;
      return refreshCalls === 1 ? { bitcoin: market } : { bitcoin: updatedMarket };
    });

    await getCachedSimulationMarkets({ refresh: refresh as any, nowMs: 1000 });
    const refreshed = await getCachedSimulationMarkets({ refresh: refresh as any, nowMs: 62_000 });

    expect((refresh as any).mock.calls.length).toBe(2);
    expect(refreshed).toEqual({
      markets: { bitcoin: updatedMarket },
      cacheStatus: 'refreshed',
      cachedAtMs: 62_000,
    });
  });

  it('throws unavailable when refresh fails without a cache', async () => {
    let message = '';
    try {
      await getCachedSimulationMarkets({
        refresh: jest.fn().mockRejectedValue(new Error('network')) as any,
        nowMs: 1000,
      });
    } catch (error) {
      message = error instanceof Error ? error.message : '';
    }

    expect(message).toBe('Simulation market data unavailable');
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

  it('records metrics for fresh, refreshed, stale, and unavailable cache states', async () => {
    await getCachedSimulationMarkets({
      refresh: jest.fn().mockResolvedValue({ bitcoin: market }) as any,
      nowMs: 1000,
    });
    await getCachedSimulationMarkets({
      refresh: jest.fn().mockResolvedValue({ bitcoin: updatedMarket }) as any,
      nowMs: 2000,
    });
    await getCachedSimulationMarkets({
      refresh: jest.fn().mockRejectedValue(new Error('network')) as any,
      nowMs: 2 * 60 * 1000,
    });
    clearSimulationMarketCache();
    try {
      await getCachedSimulationMarkets({
        refresh: jest.fn().mockRejectedValue(new Error('network')) as any,
        nowMs: 3000,
      });
    } catch (error) {
      // Expected path for unavailable metric coverage.
    }

    const cacheStatuses = (recordMetric as any).mock.calls.map(
      ([metric]: any[]) => metric.metadata.cacheStatus
    );
    expect(cacheStatuses).toEqual(['refreshed', 'fresh', 'stale', 'unavailable']);
  });
});
