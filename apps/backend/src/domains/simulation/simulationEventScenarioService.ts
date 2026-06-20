import {
  createFallbackResult,
  createLiveResult,
  SimulationEventDelay,
  SimulationEventListResponse,
  SimulationEventListSuccessResponse,
  SimulationEventScenarioEvent,
  SimulationEventScenarioResponse,
  SimulationEventScenarioSuccessResponse,
  SimulationPriceErrorResponse,
  SimulationPriceUnavailableResponse,
} from '../../../../../packages/shared/src';
import { ApiEnv } from '../../types';
import { recordMetric } from '../../telemetry/metrics';
import { fetchCoinGeckoCurrentPrices } from './coinGeckoCurrentPriceClient';
import { getCachedCurrentPrices } from './currentPriceCache';
import {
  findHistoricalPrice,
  findHistoricalPriceSeries,
  HistoricalPriceRecord,
  HistoricalPriceSeries,
} from './historicalPriceRepository';
import {
  getSimulationAsset,
  isSimulationAssetSymbol,
  simulationHistoricalDateRange,
  SimulationAssetSymbol,
} from './simulationAssets';
import { getSimulationEventById, listSimulationEvents } from './simulationEventRepository';
import { calculateSimulationEventRiskMetrics } from './simulationEventRiskMetrics';

const supportedEventDelays: SimulationEventDelay[] = ['same_day', 'one_week', 'one_month'];

interface EventListServiceResult {
  status: number;
  body: SimulationEventListResponse;
}

interface EventScenarioServiceResult {
  status: number;
  body: SimulationEventScenarioResponse;
}

interface ValidationServiceResult {
  status: number;
  body: SimulationPriceErrorResponse;
}

interface UnavailableServiceResult {
  status: number;
  body: SimulationPriceUnavailableResponse;
}

function validationError(
  status: number,
  code: SimulationPriceErrorResponse['code'],
  message: string
): ValidationServiceResult {
  return { status, body: { status: 'error', code, message } };
}

function unavailable(
  code: SimulationPriceUnavailableResponse['code'],
  message: string,
  details?: SimulationPriceUnavailableResponse['details']
): UnavailableServiceResult {
  return { status: 503, body: { status: 'unavailable', code, message, details } };
}

function isPositiveFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

function isSupportedDelay(value: unknown): value is SimulationEventDelay {
  return value === 'same_day' || value === 'one_week' || value === 'one_month';
}

function addDelay(eventDate: string, delay: SimulationEventDelay) {
  const value = new Date(`${eventDate}T00:00:00.000Z`);
  if (delay === 'one_week') value.setUTCDate(value.getUTCDate() + 7);
  if (delay === 'one_month') value.setUTCMonth(value.getUTCMonth() + 1);
  return value.toISOString().slice(0, 10);
}

function calculateResult({
  amountUsd,
  historicalPriceUsd,
  currentPriceUsd,
}: {
  amountUsd: number;
  historicalPriceUsd: number;
  currentPriceUsd: number;
}) {
  const impliedQuantity = amountUsd / historicalPriceUsd;
  const currentValueUsd = impliedQuantity * currentPriceUsd;
  const gainLossUsd = currentValueUsd - amountUsd;
  const gainLossPercent = (gainLossUsd / amountUsd) * 100;

  return {
    impliedQuantity,
    currentValueUsd,
    gainLossUsd,
    gainLossPercent,
  };
}

function createHistoricalSource(historical: HistoricalPriceRecord | HistoricalPriceSeries) {
  return {
    ...createFallbackResult({ reason: 'curated historical dataset' }),
    provider: 'historical_csv',
    updatedAt: historical.importedAt,
  };
}

function createHistoricalDataQuality(historical: HistoricalPriceRecord) {
  if (historical.dateResolution === 'exact') return undefined;

  return {
    status: 'resolved_to_next_available' as const,
    message: `Requested date ${historical.requestedDate} did not have a valid imported source row, so the simulator used ${historical.resolvedDate}.`,
  };
}

function toScenarioEvent(event: Awaited<ReturnType<typeof getSimulationEventById>>): SimulationEventScenarioEvent {
  if (!event) throw new Error('Event is required.');
  return {
    id: event.id,
    assetSymbol: event.assetSymbol,
    headline: event.headline,
    summary: event.summary,
    eventDate: event.eventDate,
    category: event.category,
    marketSentiment: event.marketSentiment,
    sources: event.sources,
  };
}

function createTakeaway({
  gainLossPercent,
  maxDrawdownPercent,
  longestUnderwaterDays,
}: {
  gainLossPercent: number;
  maxDrawdownPercent: number;
  longestUnderwaterDays: number;
}) {
  const outcome = gainLossPercent >= 0 ? 'ended profitable' : 'ended down';
  return `This scenario ${outcome}, but you would have sat through a ${Math.abs(
    Math.round(maxDrawdownPercent)
  )}% drawdown and ${longestUnderwaterDays} days below the starting value before the final outcome.`;
}

function validateAsset(asset?: string):
  | ValidationServiceResult
  | { asset: SimulationAssetSymbol } {
  if (!asset) return validationError(400, 'missing_asset', 'Asset is required.');

  const normalizedAsset = asset.toUpperCase();
  if (!isSimulationAssetSymbol(normalizedAsset)) {
    return validationError(400, 'unsupported_asset', 'Simulation v1 supports BTC, ETH, and SOL.');
  }

  return { asset: normalizedAsset };
}

function validateScenarioRequest({
  eventId,
  delay,
  amountUsd,
}: {
  eventId?: string;
  delay?: string;
  amountUsd?: string;
}):
  | ValidationServiceResult
  | { eventId: string; delay: SimulationEventDelay; amountUsd: number } {
  if (!eventId) return validationError(400, 'missing_event', 'Simulation event is required.');
  if (!delay) return validationError(400, 'missing_delay', 'Reaction delay is required.');
  if (!isSupportedDelay(delay)) {
    return validationError(400, 'invalid_delay', 'Delay must be same_day, one_week, or one_month.');
  }

  if (amountUsd === undefined || amountUsd.trim() === '') {
    return validationError(400, 'missing_amount', 'USD amount is required.');
  }

  const parsedAmount = Number(amountUsd);
  if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
    return validationError(400, 'invalid_amount', 'USD amount must be a positive number.');
  }

  return { eventId, delay, amountUsd: parsedAmount };
}

export async function getSimulationEvents({
  env,
  asset,
}: {
  env: ApiEnv;
  asset?: string;
}): Promise<EventListServiceResult> {
  const validated = validateAsset(asset);
  if ('body' in validated) return validated;

  if (!env.HISTORICAL_PRICES_DB) {
    return unavailable('historical_price_unavailable', 'Historical price database is unavailable.', {
      asset: validated.asset,
    });
  }

  const events = await listSimulationEvents({
    db: env.HISTORICAL_PRICES_DB,
    assetSymbol: validated.asset,
  });

  recordMetric({
    name: 'crypto.api.simulation_events.list',
    durationMs: 0,
    status: 'success',
    metadata: {
      asset: validated.asset,
      events: events.length,
    },
  });

  const assetConfig = getSimulationAsset(validated.asset);
  const body: SimulationEventListSuccessResponse = {
    status: 'success',
    asset: {
      symbol: assetConfig.symbol,
      name: assetConfig.name,
      coinGeckoId: assetConfig.coinGeckoId,
    },
    supportedDelays: supportedEventDelays,
    events,
  };

  return { status: 200, body };
}

export async function getSimulationEventScenario({
  env,
  eventId,
  delay,
  amountUsd,
  now = new Date(),
}: {
  env: ApiEnv;
  eventId?: string;
  delay?: string;
  amountUsd?: string;
  now?: Date;
}): Promise<EventScenarioServiceResult> {
  const validated = validateScenarioRequest({ eventId, delay, amountUsd });
  if ('body' in validated) return validated;

  if (!env.HISTORICAL_PRICES_DB) {
    return unavailable('historical_price_unavailable', 'Historical price database is unavailable.');
  }

  const event = await getSimulationEventById({
    db: env.HISTORICAL_PRICES_DB,
    eventId: validated.eventId,
  });

  if (!event) {
    return unavailable('simulation_price_unavailable', 'Simulation event is unavailable.');
  }

  const intendedBuyDate = addDelay(event.eventDate, validated.delay);
  if (intendedBuyDate > simulationHistoricalDateRange.max) {
    return validationError(
      400,
      'date_out_of_range',
      `Event scenario date must be no later than ${simulationHistoricalDateRange.max}.`
    );
  }

  const historical = await findHistoricalPrice({
    db: env.HISTORICAL_PRICES_DB,
    assetSymbol: event.assetSymbol,
    requestedDate: intendedBuyDate,
    historicalMaxDate: simulationHistoricalDateRange.max,
  });

  if (!historical) {
    return unavailable('historical_price_unavailable', 'Historical USD price is unavailable.', {
      asset: event.assetSymbol,
      requestedDate: intendedBuyDate,
    });
  }

  const series = await findHistoricalPriceSeries({
    db: env.HISTORICAL_PRICES_DB,
    assetSymbol: event.assetSymbol,
    startDate: historical.resolvedDate,
    endDate: simulationHistoricalDateRange.max,
  });

  if (!series) {
    return unavailable('historical_price_unavailable', 'Historical risk series is unavailable.', {
      asset: event.assetSymbol,
      requestedDate: historical.resolvedDate,
    });
  }

  let current;
  try {
    current = await getCachedCurrentPrices({
      refresh: () =>
        fetchCoinGeckoCurrentPrices({
          apiKey: env.COINGECKO_API_KEY,
        }),
      nowMs: now.getTime(),
    });
  } catch {
    return unavailable('current_price_unavailable', 'Current USD price is unavailable. Try again soon.', {
      asset: event.assetSymbol,
      requestedDate: historical.resolvedDate,
    });
  }

  const currentPrice = current.prices[event.assetSymbol];
  if (
    !currentPrice ||
    !isPositiveFiniteNumber(currentPrice.priceUsd) ||
    !isPositiveFiniteNumber(historical.priceUsd)
  ) {
    return unavailable('simulation_price_unavailable', 'A required simulation price is invalid.', {
      asset: event.assetSymbol,
      requestedDate: historical.resolvedDate,
    });
  }

  const startedAt = Date.now();
  const result = calculateResult({
    amountUsd: validated.amountUsd,
    historicalPriceUsd: historical.priceUsd,
    currentPriceUsd: currentPrice.priceUsd,
  });
  const risk = calculateSimulationEventRiskMetrics(series.points, historical.priceUsd);

  recordMetric({
    name: 'crypto.api.simulation_event_scenarios.compute',
    durationMs: Date.now() - startedAt,
    status: 'success',
    metadata: {
      asset: event.assetSymbol,
      eventId: event.id,
      delay: validated.delay,
      dateResolution: historical.dateResolution,
      points: series.points.length,
    },
  });

  const assetConfig = getSimulationAsset(event.assetSymbol);
  const body: SimulationEventScenarioSuccessResponse = {
    status: 'success',
    event: toScenarioEvent(event),
    asset: {
      symbol: assetConfig.symbol,
      name: assetConfig.name,
      coinGeckoId: assetConfig.coinGeckoId,
    },
    input: {
      requestedDate: historical.requestedDate,
      amountUsd: validated.amountUsd,
      delay: validated.delay,
      intendedBuyDate,
    },
    historical: {
      requestedDate: historical.requestedDate,
      resolvedDate: historical.resolvedDate,
      dateResolution: historical.dateResolution,
      priceUsd: historical.priceUsd,
      source: createHistoricalSource(historical),
      dataQuality: createHistoricalDataQuality(historical),
    },
    current: {
      priceUsd: currentPrice.priceUsd,
      source: createLiveResult({
        provider: 'coingecko',
        updatedAt: currentPrice.updatedAt ?? now.toISOString(),
      }),
      cache: {
        status: current.cacheStatus,
        ttlSeconds: 60,
      },
    },
    result,
    risk,
    takeaway: createTakeaway({
      gainLossPercent: result.gainLossPercent,
      maxDrawdownPercent: risk.maxDrawdownPercent,
      longestUnderwaterDays: risk.longestUnderwaterDays,
    }),
  };

  return { status: 200, body };
}
