import {
  SimulationAssetCatalogErrorResponse,
  SimulationAssetCatalogItem,
  SimulationAssetCatalogResponse,
  SimulationAssetCatalogStatus,
  SimulationAssetDataQualityStatus,
  SimulationAssetCatalogSuccessResponse,
  SimulationAssetMarketCacheStatus,
  SimulationAssetMarketStatus,
} from './simulationAssetCatalogTypes';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isNonNegativeInteger(value: unknown): value is number {
  return Number.isInteger(value) && (value as number) >= 0;
}

function isPositiveFiniteNumber(value: unknown): value is number {
  return isFiniteNumber(value) && value > 0;
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function isStringOrNull(value: unknown): value is string | null {
  return value === null || isString(value);
}

function isFiniteNumberOrNull(value: unknown): value is number | null {
  return value === null || isFiniteNumber(value);
}

function isPositiveFiniteNumberOrNull(value: unknown): value is number | null {
  return value === null || isPositiveFiniteNumber(value);
}

function isCatalogStatus(value: unknown): value is SimulationAssetCatalogStatus {
  return value === 'ready' || value === 'needs_market_mapping' || value === 'historical_invalid';
}

function isMarketStatus(value: unknown): value is SimulationAssetMarketStatus {
  return value === 'fresh' || value === 'stale' || value === 'unavailable';
}

function isMarketCacheStatus(value: unknown): value is SimulationAssetMarketCacheStatus {
  return value === 'fresh' || value === 'stale' || value === 'unavailable';
}

function isDataQualityStatus(value: unknown): value is SimulationAssetDataQualityStatus {
  return (
    value === 'clean' ||
    value === 'repaired' ||
    value === 'quarantined' ||
    value === 'repaired_and_quarantined'
  );
}

function isHistoricalMetadata(value: unknown) {
  if (!isRecord(value)) return false;

  return (
    isStringOrNull(value.firstDate) &&
    isStringOrNull(value.lastDate) &&
    isNonNegativeInteger(value.rowCount) &&
    isNonNegativeInteger(value.missingDateCount) &&
    isNonNegativeInteger(value.largestGapDays)
  );
}

function isDataQualityMetadata(value: unknown) {
  if (!isRecord(value)) return false;

  return (
    isNonNegativeInteger(value.repairedRowCount) &&
    isNonNegativeInteger(value.quarantinedRowCount) &&
    isNonNegativeInteger(value.eligibleRowCount) &&
    isFiniteNumber(value.quarantineRate) &&
    value.quarantineRate >= 0 &&
    value.quarantineRate <= 1 &&
    isDataQualityStatus(value.status)
  );
}

function isMarketMetadata(value: unknown) {
  if (!isRecord(value)) return false;

  return (
    isStringOrNull(value.coinGeckoId) &&
    isFiniteNumberOrNull(value.rank) &&
    isStringOrNull(value.imageUrl) &&
    isPositiveFiniteNumberOrNull(value.currentPriceUsd) &&
    isFiniteNumberOrNull(value.priceChangePercentage24h) &&
    isStringOrNull(value.updatedAt) &&
    isMarketStatus(value.status)
  );
}

function isAvailabilityMetadata(value: unknown) {
  if (!isRecord(value)) return false;

  return (
    typeof value.canSimulate === 'boolean' &&
    isStringOrNull(value.reason) &&
    isStringOrNull(value.detail)
  );
}

export function isSimulationAssetCatalogItem(
  value: unknown
): value is SimulationAssetCatalogItem {
  if (!isRecord(value)) return false;

  return (
    isString(value.assetId) &&
    isString(value.symbol) &&
    isString(value.name) &&
    isString(value.category) &&
    isCatalogStatus(value.status) &&
    isHistoricalMetadata(value.historical) &&
    isDataQualityMetadata(value.dataQuality) &&
    isMarketMetadata(value.market) &&
    isAvailabilityMetadata(value.availability)
  );
}

function isSimulationAssetCatalogSuccessResponse(
  value: unknown
): value is SimulationAssetCatalogSuccessResponse {
  if (!isRecord(value) || value.status !== 'success') return false;

  const assets = value.assets;
  if (!isRecord(assets)) return false;
  if (!Array.isArray(assets.ready) || !assets.ready.every(isSimulationAssetCatalogItem)) {
    return false;
  }
  if (
    !Array.isArray(assets.unavailable) ||
    !assets.unavailable.every(isSimulationAssetCatalogItem)
  ) {
    return false;
  }

  const source = value.source;
  if (!isRecord(source)) return false;

  return (
    source.historicalProvider === 'historical_csv' &&
    source.marketProvider === 'coingecko' &&
    isString(source.importedAt) &&
    isStringOrNull(source.marketDataUpdatedAt) &&
    isMarketCacheStatus(source.marketCacheStatus)
  );
}

function isSimulationAssetCatalogErrorResponse(
  value: unknown
): value is SimulationAssetCatalogErrorResponse {
  if (!isRecord(value) || value.status !== 'error') return false;

  return value.code === 'simulation_assets_unavailable' && isString(value.message);
}

export function isSimulationAssetCatalogResponse(
  value: unknown
): value is SimulationAssetCatalogResponse {
  return (
    isSimulationAssetCatalogSuccessResponse(value) ||
    isSimulationAssetCatalogErrorResponse(value)
  );
}
