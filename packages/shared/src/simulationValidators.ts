import {
  SimulationAssetSymbol,
  SimulationCurrentCacheStatus,
  SimulationDateResolution,
  SimulationEventCategory,
  SimulationEventDelay,
  SimulationEventListResponse,
  SimulationEventListSuccessResponse,
  SimulationEventMarketSentiment,
  SimulationEventRiskMetrics,
  SimulationEventScenarioEvent,
  SimulationEventScenarioResponse,
  SimulationEventScenarioSuccessResponse,
  SimulationEventSource,
  SimulationEventSummary,
  SimulationHistoricalDataQualityStatus,
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

function isHistoricalDataQualityStatus(
  value: unknown
): value is SimulationHistoricalDataQualityStatus {
  return value === 'exact' || value === 'resolved_to_next_available';
}

function isSimulationEventDelay(value: unknown): value is SimulationEventDelay {
  return value === 'same_day' || value === 'one_week' || value === 'one_month';
}

function isSimulationEventCategory(value: unknown): value is SimulationEventCategory {
  return (
    value === 'adoption' ||
    value === 'regulation' ||
    value === 'crash' ||
    value === 'exchange_failure' ||
    value === 'protocol_upgrade' ||
    value === 'ecosystem'
  );
}

function isSimulationEventMarketSentiment(
  value: unknown
): value is SimulationEventMarketSentiment {
  return value === 'positive' || value === 'negative' || value === 'mixed';
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
    value === 'invalid_amount' ||
    value === 'missing_event' ||
    value === 'missing_delay' ||
    value === 'invalid_delay'
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

function isHistoricalDataQualityMetadata(value: unknown) {
  if (!isRecord(value)) return false;
  return isHistoricalDataQualityStatus(value.status) && isString(value.message);
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
  if (
    historical.dataQuality !== undefined &&
    !isHistoricalDataQualityMetadata(historical.dataQuality)
  ) {
    return false;
  }

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

function isSimulationEventSource(value: unknown): value is SimulationEventSource {
  if (!isRecord(value)) return false;
  return (
    isString(value.title) &&
    isString(value.publisher) &&
    isString(value.url) &&
    (value.publishedAt === null || isString(value.publishedAt))
  );
}

function isSimulationEventSummary(value: unknown): value is SimulationEventSummary {
  if (!isRecord(value)) return false;
  if (!isString(value.id)) return false;
  if (!isSimulationAssetSymbol(value.assetSymbol)) return false;
  if (!isString(value.headline)) return false;
  if (!isString(value.summary)) return false;
  if (!isString(value.eventDate)) return false;
  if (!isSimulationEventCategory(value.category)) return false;
  if (!isSimulationEventMarketSentiment(value.marketSentiment)) return false;
  if (value.sortOrder !== undefined && !isFiniteNumber(value.sortOrder)) return false;
  if (!Array.isArray(value.sources) || value.sources.length < 2) return false;
  return value.sources.every(isSimulationEventSource);
}

function isSimulationEventScenarioEvent(value: unknown): value is SimulationEventScenarioEvent {
  if (!isRecord(value)) return false;
  if ('sortOrder' in value) return false;
  return isSimulationEventSummary(value);
}

function isSimulationEventRiskMetrics(value: unknown): value is SimulationEventRiskMetrics {
  if (!isRecord(value)) return false;
  return (
    isFiniteNumber(value.maxDrawdownPercent) &&
    isFiniteNumber(value.longestUnderwaterDays) &&
    isFiniteNumber(value.bestThirtyDayReturnPercent) &&
    isFiniteNumber(value.worstThirtyDayReturnPercent) &&
    isString(value.startDate) &&
    isString(value.endDate)
  );
}

export function isSimulationEventListSuccessResponse(
  value: unknown
): value is SimulationEventListSuccessResponse {
  if (!isRecord(value) || value.status !== 'success') return false;

  const asset = value.asset;
  if (!isRecord(asset)) return false;
  if (!isSimulationAssetSymbol(asset.symbol)) return false;
  if (!isString(asset.name)) return false;
  if (!isString(asset.coinGeckoId)) return false;

  if (!Array.isArray(value.supportedDelays)) return false;
  if (!value.supportedDelays.every(isSimulationEventDelay)) return false;

  if (!Array.isArray(value.events)) return false;
  return value.events.every(isSimulationEventSummary);
}

export function isSimulationEventListResponse(
  value: unknown
): value is SimulationEventListResponse {
  return (
    isSimulationEventListSuccessResponse(value) ||
    isSimulationPriceErrorResponse(value) ||
    isSimulationPriceUnavailableResponse(value)
  );
}

export function isSimulationEventScenarioSuccessResponse(
  value: unknown
): value is SimulationEventScenarioSuccessResponse {
  if (!isRecord(value)) return false;
  const scenario = value;
  if (!isSimulationPriceSuccessResponse(value)) return false;
  if (!isSimulationEventScenarioEvent(scenario.event)) return false;

  const input = scenario.input;
  if (!isRecord(input)) return false;
  if (!isSimulationEventDelay(input.delay)) return false;
  if (!isString(input.intendedBuyDate)) return false;

  if (!isSimulationEventRiskMetrics(scenario.risk)) return false;
  return isString(scenario.takeaway);
}

export function isSimulationEventScenarioResponse(
  value: unknown
): value is SimulationEventScenarioResponse {
  return (
    isSimulationEventScenarioSuccessResponse(value) ||
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
