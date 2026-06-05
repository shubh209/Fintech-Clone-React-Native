import {
  SimulationAssetCatalogItem,
  SimulationAssetCatalogResponse,
  SimulationAssetMarketCacheStatus,
} from '../../../../../packages/shared/src';
import { ApiEnv } from '../../types';
import { fetchCoinGeckoMarkets } from './coinGeckoMarketsClient';
import {
  listSimulationAssets,
  SimulationAssetMetadataRecord,
} from './simulationAssetRepository';
import { getCachedSimulationMarkets } from './simulationMarketCache';
import { recordMetric } from '../../telemetry/metrics';

interface ServiceResult {
  status: number;
  body: SimulationAssetCatalogResponse;
}

type MarketCacheResult = Awaited<ReturnType<typeof getCachedSimulationMarkets>>;

function unavailableCatalogResult(): ServiceResult {
  return {
    status: 503,
    body: {
      status: 'error',
      code: 'simulation_assets_unavailable',
      message: 'Simulation asset catalog is unavailable.',
    },
  };
}

function emptyMarket(coinGeckoId: string | null): SimulationAssetCatalogItem['market'] {
  return {
    coinGeckoId,
    rank: null,
    imageUrl: null,
    currentPriceUsd: null,
    priceChangePercentage24h: null,
    updatedAt: null,
    status: 'unavailable',
  };
}

function normalizeMarketCacheStatus(
  cacheStatus: MarketCacheResult['cacheStatus'] | undefined
): SimulationAssetMarketCacheStatus {
  if (!cacheStatus) {
    return 'unavailable';
  }

  return cacheStatus === 'refreshed' ? 'fresh' : cacheStatus;
}

function getAvailability({
  asset,
  market,
  marketStatus,
}: {
  asset: SimulationAssetMetadataRecord;
  market: SimulationAssetCatalogItem['market'];
  marketStatus: SimulationAssetMarketCacheStatus;
}): SimulationAssetCatalogItem['availability'] {
  if (asset.status !== 'ready') {
    return {
      canSimulate: false,
      reason: asset.unavailableReason,
      detail: asset.unavailableDetail,
    };
  }

  if (!market.currentPriceUsd) {
    return {
      canSimulate: false,
      reason: 'Current market price is unavailable.',
      detail: asset.coinGeckoId
        ? `CoinGecko did not return a positive current USD price for ${asset.coinGeckoId}.`
        : 'This asset does not have a CoinGecko market mapping.',
    };
  }

  if (marketStatus !== 'fresh') {
    return {
      canSimulate: false,
      reason: 'Current market price needs refresh.',
      detail: `Market cache status is ${marketStatus}.`,
    };
  }

  return {
    canSimulate: true,
    reason: null,
    detail: null,
  };
}

function toCatalogItem({
  asset,
  market,
  marketStatus,
}: {
  asset: SimulationAssetMetadataRecord;
  market: SimulationAssetCatalogItem['market'];
  marketStatus: SimulationAssetMarketCacheStatus;
}): SimulationAssetCatalogItem {
  return {
    assetId: asset.assetId,
    symbol: asset.symbol,
    name: asset.name,
    category: asset.category,
    status: asset.status,
    historical: {
      firstDate: asset.firstImportedDate,
      lastDate: asset.lastImportedDate,
      rowCount: asset.importedRowCount,
      missingDateCount: asset.missingDateCount,
      largestGapDays: asset.largestGapDays,
    },
    market,
    availability: getAvailability({ asset, market, marketStatus }),
  };
}

export async function getSimulationAssets({
  env,
  now = new Date(),
}: {
  env: ApiEnv;
  now?: Date;
}): Promise<ServiceResult> {
  if (!env.HISTORICAL_PRICES_DB) {
    return unavailableCatalogResult();
  }

  let assets: SimulationAssetMetadataRecord[];
  try {
    assets = await listSimulationAssets({ db: env.HISTORICAL_PRICES_DB });
  } catch {
    return unavailableCatalogResult();
  }

  const readyCoinGeckoIds = assets
    .filter((asset) => asset.status === 'ready' && asset.coinGeckoId)
    .map((asset) => asset.coinGeckoId as string);

  let markets: MarketCacheResult | null = null;

  try {
    markets = await getCachedSimulationMarkets({
      refresh: () =>
        fetchCoinGeckoMarkets({
          coinGeckoIds: readyCoinGeckoIds,
          apiKey: env.COINGECKO_API_KEY,
        }),
      nowMs: now.getTime(),
    });
  } catch {
    markets = null;
  }

  const marketCacheStatus = normalizeMarketCacheStatus(markets?.cacheStatus);
  const items = assets.map((asset) => {
    const cachedMarket = asset.coinGeckoId ? markets?.markets[asset.coinGeckoId] : null;
    const market: SimulationAssetCatalogItem['market'] = cachedMarket
      ? {
          coinGeckoId: cachedMarket.coinGeckoId,
          rank: cachedMarket.rank,
          imageUrl: cachedMarket.imageUrl,
          currentPriceUsd: cachedMarket.currentPriceUsd,
          priceChangePercentage24h: cachedMarket.priceChangePercentage24h,
          updatedAt: cachedMarket.updatedAt,
          status: marketCacheStatus,
        }
      : emptyMarket(asset.coinGeckoId);

    return toCatalogItem({ asset, market, marketStatus: marketCacheStatus });
  });
  const ready = items.filter((item) => item.status === 'ready');
  const unavailable = items.filter((item) => item.status !== 'ready');

  recordMetric({
    name: 'crypto.api.simulation_assets.catalog',
    durationMs: 0,
    status: 'success',
    metadata: {
      readyCount: ready.length,
      unavailableCount: unavailable.length,
      marketCacheStatus,
    },
  });

  return {
    status: 200,
    body: {
      status: 'success',
      assets: {
        ready,
        unavailable,
      },
      source: {
        historicalProvider: 'historical_csv',
        marketProvider: 'coingecko',
        importedAt: assets[0]?.importedAt ?? now.toISOString(),
        marketDataUpdatedAt: markets ? new Date(markets.cachedAtMs).toISOString() : null,
        marketCacheStatus,
      },
    },
  };
}
