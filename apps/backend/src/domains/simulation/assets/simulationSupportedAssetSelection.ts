import {
  SimulationSupportedAsset,
  SimulationSupportedAssetCandidate,
} from './simulationSupportedAssetTypes';

function hasRequiredSupportFields(
  asset: SimulationSupportedAssetCandidate
): asset is SimulationSupportedAssetCandidate & {
  coinGeckoId: string;
  firstImportedDate: string;
  lastImportedDate: string;
} {
  return (
    asset.status === 'ready' &&
    typeof asset.coinGeckoId === 'string' &&
    asset.coinGeckoId.length > 0 &&
    typeof asset.firstImportedDate === 'string' &&
    typeof asset.lastImportedDate === 'string'
  );
}

function compareByMarketRank(
  left: SimulationSupportedAssetCandidate,
  right: SimulationSupportedAssetCandidate
) {
  const leftRank = left.marketRank ?? Number.MAX_SAFE_INTEGER;
  const rightRank = right.marketRank ?? Number.MAX_SAFE_INTEGER;
  if (leftRank !== rightRank) return leftRank - rightRank;
  return left.symbol.localeCompare(right.symbol);
}

export function selectReadySimulationAssets(
  assets: SimulationSupportedAssetCandidate[]
): SimulationSupportedAsset[] {
  return assets
    .filter(hasRequiredSupportFields)
    .sort(compareByMarketRank)
    .map((asset) => ({
      assetId: asset.assetId,
      symbol: asset.symbol,
      name: asset.name,
      coinGeckoId: asset.coinGeckoId,
      historicalSymbol: asset.historicalSymbol,
      firstImportedDate: asset.firstImportedDate,
      lastImportedDate: asset.lastImportedDate,
      importedRowCount: asset.importedRowCount,
      marketRank: asset.marketRank,
    }));
}
