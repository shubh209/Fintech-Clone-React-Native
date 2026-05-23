import {
  SimulationAssetSymbol,
  SimulationCurrentCacheStatus,
  SimulationDateResolution,
  SimulationHistoryResponse,
  SimulationHistorySuccessResponse,
  SimulationPriceErrorResponse,
  SimulationPriceResponse,
  SimulationPriceSuccessResponse,
  SimulationPriceUnavailableResponse,
  SimulationUnavailableCode,
  SimulationValidationErrorCode,
} from './simulationTypes';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isPositiveFiniteNumber(value: unknown): value is number {
  return isFiniteNumber(value) && value > 0;
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function isSimulationAssetSymbol(value: unknown): value is SimulationAssetSymbol {
  return value === 'BTC' || value === 'ETH' || value === 'SOL';
}

function isDateResolution(value: unknown): value is SimulationDateResolution {
  return value === 'exact' || value === 'next_available';
}

function isCacheStatus(value: unknown): value is SimulationCurrentCacheStatus {
  return value === 'fresh' || value === 'refreshed';
}

function isValidationErrorCode(value: unknown): value is SimulationValidationErrorCode {
  return (
    value === 'missing_asset' ||
    value === 'unsupported_asset' ||
    value === 'missing_date' ||
    value === 'invalid_date' ||
    value === 'date_out_of_range' ||
    value === 'missing_amount' ||
    value === 'invalid_amount'
  );
}

function isUnavailableCode(value: unknown): value is SimulationUnavailableCode {
  return (
    value === 'historical_price_unavailable' ||
    value === 'current_price_unavailable' ||
    value === 'simulation_price_unavailable'
  );
}

function isApiResultMetadata(value: unknown) {
  if (!isRecord(value)) return false;
  if (value.source !== 'live' && value.source !== 'fallback') return false;
  if (!isString(value.provider)) return false;
  if (value.updatedAt !== null && !isString(value.updatedAt)) return false;
  if (typeof value.isFallback !== 'boolean') return false;
  if (value.reason !== undefined && !isString(value.reason)) return false;
  return true;
}

export function isSimulationPriceSuccessResponse(
  value: unknown
): value is SimulationPriceSuccessResponse {
  if (!isRecord(value) || value.status !== 'success') return false;

  const asset = value.asset;
  if (!isRecord(asset)) return false;
  if (!isSimulationAssetSymbol(asset.symbol)) return false;
  if (!isString(asset.name)) return false;
  if (!isString(asset.coinGeckoId)) return false;

  const input = value.input;
  if (!isRecord(input)) return false;
  if (!isString(input.requestedDate)) return false;
  if (!isPositiveFiniteNumber(input.amountUsd)) return false;

  const historical = value.historical;
  if (!isRecord(historical)) return false;
  if (!isString(historical.requestedDate)) return false;
  if (!isString(historical.resolvedDate)) return false;
  if (!isDateResolution(historical.dateResolution)) return false;
  if (!isPositiveFiniteNumber(historical.priceUsd)) return false;
  if (!isApiResultMetadata(historical.source)) return false;

  const current = value.current;
  if (!isRecord(current)) return false;
  if (!isPositiveFiniteNumber(current.priceUsd)) return false;
  if (!isApiResultMetadata(current.source)) return false;
  if (!isRecord(current.cache)) return false;
  if (!isCacheStatus(current.cache.status)) return false;
  if (!isPositiveFiniteNumber(current.cache.ttlSeconds)) return false;

  const result = value.result;
  if (!isRecord(result)) return false;
  return (
    isPositiveFiniteNumber(result.impliedQuantity) &&
    isFiniteNumber(result.currentValueUsd) &&
    isFiniteNumber(result.gainLossUsd) &&
    isFiniteNumber(result.gainLossPercent)
  );
}

export function isSimulationPriceErrorResponse(
  value: unknown
): value is SimulationPriceErrorResponse {
  if (!isRecord(value) || value.status !== 'error') return false;
  return isValidationErrorCode(value.code) && isString(value.message);
}

export function isSimulationPriceUnavailableResponse(
  value: unknown
): value is SimulationPriceUnavailableResponse {
  if (!isRecord(value) || value.status !== 'unavailable') return false;
  if (!isUnavailableCode(value.code) || !isString(value.message)) return false;

  if (value.details === undefined) return true;
  if (!isRecord(value.details)) return false;

  return (
    (value.details.asset === undefined || isString(value.details.asset)) &&
    (value.details.requestedDate === undefined || isString(value.details.requestedDate))
  );
}

export function isSimulationPriceResponse(value: unknown): value is SimulationPriceResponse {
  return (
    isSimulationPriceSuccessResponse(value) ||
    isSimulationPriceErrorResponse(value) ||
    isSimulationPriceUnavailableResponse(value)
  );
}

function isSimulationHistoryPoint(value: unknown) {
  if (!isRecord(value)) return false;
  return isString(value.date) && isPositiveFiniteNumber(value.priceUsd);
}

export function isSimulationHistorySuccessResponse(
  value: unknown
): value is SimulationHistorySuccessResponse {
  if (!isRecord(value) || value.status !== 'success') return false;

  const asset = value.asset;
  if (!isRecord(asset)) return false;
  if (!isSimulationAssetSymbol(asset.symbol)) return false;
  if (!isString(asset.name)) return false;
  if (!isString(asset.coinGeckoId)) return false;

  const range = value.range;
  if (!isRecord(range)) return false;
  if (!isFiniteNumber(range.year)) return false;
  if (!isString(range.startDate) || !isString(range.endDate)) return false;

  if (!Array.isArray(value.points) || value.points.length === 0) return false;
  if (!value.points.every(isSimulationHistoryPoint)) return false;

  return isApiResultMetadata(value.source);
}

export function isSimulationHistoryResponse(value: unknown): value is SimulationHistoryResponse {
  return (
    isSimulationHistorySuccessResponse(value) ||
    isSimulationPriceErrorResponse(value) ||
    isSimulationPriceUnavailableResponse(value)
  );
}
