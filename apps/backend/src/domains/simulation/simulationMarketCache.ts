import { recordMetric } from '../../telemetry/metrics';
import { CoinGeckoMarket } from './coinGeckoMarketsClient';

export const simulationMarketFreshTtlMs = 60_000;
export const simulationMarketStaleTtlMs = 24 * 60 * 60 * 1000;

let cacheEntry: { markets: Record<string, CoinGeckoMarket>; cachedAtMs: number } | null = null;

export function clearSimulationMarketCache() {
  cacheEntry = null;
}

function recordMarketCacheMetric({
  markets,
  cacheStatus,
  ageMs,
  status,
}: {
  markets?: Record<string, CoinGeckoMarket>;
  cacheStatus: 'fresh' | 'refreshed' | 'stale' | 'unavailable';
  ageMs?: number;
  status: 'success' | 'error';
}) {
  recordMetric({
    name: 'crypto.api.simulation_assets.market_cache',
    durationMs: 0,
    status,
    metadata: {
      assets: markets ? Object.keys(markets) : [],
      cacheStatus,
      ageMs,
    },
  });
}

export async function getCachedSimulationMarkets({
  refresh,
  nowMs = Date.now(),
}: {
  refresh: () => Promise<Record<string, CoinGeckoMarket>>;
  nowMs?: number;
}): Promise<{
  markets: Record<string, CoinGeckoMarket>;
  cacheStatus: 'fresh' | 'refreshed' | 'stale';
  cachedAtMs: number;
}> {
  if (cacheEntry) {
    const ageMs = nowMs - cacheEntry.cachedAtMs;
    if (ageMs >= 0 && ageMs <= simulationMarketFreshTtlMs) {
      recordMarketCacheMetric({
        markets: cacheEntry.markets,
        cacheStatus: 'fresh',
        ageMs,
        status: 'success',
      });
      return { ...cacheEntry, cacheStatus: 'fresh' };
    }
  }

  try {
    const markets = await refresh();
    cacheEntry = { markets, cachedAtMs: nowMs };
    recordMarketCacheMetric({
      markets,
      cacheStatus: 'refreshed',
      ageMs: 0,
      status: 'success',
    });
    return { ...cacheEntry, cacheStatus: 'refreshed' };
  } catch (error) {
    if (cacheEntry) {
      const ageMs = nowMs - cacheEntry.cachedAtMs;
      if (ageMs >= 0 && ageMs <= simulationMarketStaleTtlMs) {
        recordMarketCacheMetric({
          markets: cacheEntry.markets,
          cacheStatus: 'stale',
          ageMs,
          status: 'success',
        });
        return { ...cacheEntry, cacheStatus: 'stale' };
      }
    }

    recordMarketCacheMetric({ cacheStatus: 'unavailable', status: 'error' });
    throw new Error('Simulation market data unavailable');
  }
}
