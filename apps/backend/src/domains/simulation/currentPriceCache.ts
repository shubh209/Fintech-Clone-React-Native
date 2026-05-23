import { recordMetric } from '../../telemetry/metrics';
import { CurrentPrice } from './coinGeckoCurrentPriceClient';
import { SimulationAssetSymbol } from './simulationAssets';

export const currentPriceCacheTtlMs = 60_000;

export interface CurrentPriceCacheEntry {
  prices: Record<SimulationAssetSymbol, CurrentPrice>;
  cachedAtMs: number;
}

let cacheEntry: CurrentPriceCacheEntry | null = null;

export function clearCurrentPriceCache() {
  cacheEntry = null;
}

function getFreshCache(nowMs: number) {
  if (!cacheEntry) return null;
  const ageMs = nowMs - cacheEntry.cachedAtMs;
  if (ageMs < 0 || ageMs > currentPriceCacheTtlMs) return null;

  recordMetric({
    name: 'crypto.api.simulation_prices.current_cache',
    durationMs: 0,
    status: 'success',
    metadata: { assets: Object.keys(cacheEntry.prices), cacheStatus: 'fresh', ageMs },
  });

  return cacheEntry;
}

export async function getCachedCurrentPrices({
  refresh,
  nowMs = Date.now(),
}: {
  refresh: () => Promise<Record<SimulationAssetSymbol, CurrentPrice>>;
  nowMs?: number;
}): Promise<{
  prices: Record<SimulationAssetSymbol, CurrentPrice>;
  cacheStatus: 'fresh' | 'refreshed';
}> {
  const fresh = getFreshCache(nowMs);
  if (fresh) {
    return { prices: fresh.prices, cacheStatus: 'fresh' };
  }

  const prices = await refresh();
  cacheEntry = { prices, cachedAtMs: nowMs };

  recordMetric({
    name: 'crypto.api.simulation_prices.current_cache',
    durationMs: 0,
    status: 'success',
    metadata: { assets: Object.keys(prices), cacheStatus: 'refreshed', ageMs: 0 },
  });

  return { prices, cacheStatus: 'refreshed' };
}
