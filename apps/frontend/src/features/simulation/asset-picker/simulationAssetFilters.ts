import { SimulationAssetCatalogItem } from '@shared/simulationAssetCatalogTypes';
import { getSelectedAssetAvailability } from './simulationAssetSupport';

export type SimulationAssetFilter = 'recommended' | 'ready' | 'unavailable' | 'top20';

export const ASSET_FILTERS: Array<{ value: SimulationAssetFilter; label: string }> = [
  { value: 'recommended', label: 'Recommended' },
  { value: 'ready', label: 'Ready' },
  { value: 'unavailable', label: 'Unavailable' },
  { value: 'top20', label: 'Top 20' },
];

const RECOMMENDED_SYMBOLS = ['BTC', 'ETH', 'SOL', 'BNB', 'XRP'];

export function sortCatalogAssets(
  left: SimulationAssetCatalogItem,
  right: SimulationAssetCatalogItem
) {
  const leftRank = left.market.rank ?? Number.MAX_SAFE_INTEGER;
  const rightRank = right.market.rank ?? Number.MAX_SAFE_INTEGER;
  if (leftRank !== rightRank) return leftRank - rightRank;
  return left.symbol.localeCompare(right.symbol);
}

function normalizeSearchText(value: string) {
  return value.trim().toLowerCase();
}

export function getRecommendedSimulationAssets(assets: SimulationAssetCatalogItem[]) {
  const recommended = new Map<string, SimulationAssetCatalogItem>();

  RECOMMENDED_SYMBOLS.forEach((symbol) => {
    const asset = assets.find(
      (item) => item.symbol === symbol && getSelectedAssetAvailability(item).canSimulate
    );
    if (asset) recommended.set(asset.assetId, asset);
  });

  assets
    .filter((item) => getSelectedAssetAvailability(item).canSimulate)
    .sort(sortCatalogAssets)
    .slice(0, 10)
    .forEach((asset) => recommended.set(asset.assetId, asset));

  return [...recommended.values()].slice(0, 10);
}

function assetMatchesSearch(asset: SimulationAssetCatalogItem, query: string) {
  if (!query) return true;

  return (
    asset.symbol.toLowerCase().includes(query) ||
    asset.name.toLowerCase().includes(query) ||
    asset.category.toLowerCase().includes(query)
  );
}

export function filterSimulationAssets(
  assets: SimulationAssetCatalogItem[],
  queryText: string,
  filter: SimulationAssetFilter
) {
  const query = normalizeSearchText(queryText);
  const baseAssets =
    filter === 'recommended'
      ? getRecommendedSimulationAssets(assets)
      : assets.filter((asset) => {
          const availability = getSelectedAssetAvailability(asset);
          if (filter === 'ready') return availability.canSimulate;
          if (filter === 'unavailable') return !availability.canSimulate;
          return (asset.market.rank ?? Number.MAX_SAFE_INTEGER) <= 20;
        });

  return baseAssets.filter((asset) => assetMatchesSearch(asset, query)).sort(sortCatalogAssets);
}
