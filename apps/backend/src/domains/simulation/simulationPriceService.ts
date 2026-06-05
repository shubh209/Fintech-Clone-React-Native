import {
  createFallbackResult,
  createLiveResult,
  SimulationPriceErrorResponse,
  SimulationPriceResponse,
  SimulationPriceSuccessResponse,
  SimulationPriceUnavailableResponse,
} from '../../../../../packages/shared/src';
import { ApiEnv } from '../../types';
import { recordMetric } from '../../telemetry/metrics';
import { fetchCoinGeckoCurrentPrices } from './coinGeckoCurrentPriceClient';
import { getCachedCurrentPrices } from './currentPriceCache';
import { findHistoricalPrice, HistoricalPriceRecord } from './historicalPriceRepository';
import {
  getSimulationAsset,
  isSimulationAssetSymbol,
  simulationHistoricalDateRange,
  SimulationAssetSymbol,
} from './simulationAssets';

interface ServiceResult {
  status: number;
  body: SimulationPriceResponse;
}

function validationError(
  status: number,
  code: SimulationPriceErrorResponse['code'],
  message: string
): ServiceResult {
  return { status, body: { status: 'error', code, message } };
}

function unavailable(
  code: SimulationPriceUnavailableResponse['code'],
  message: string,
  details?: SimulationPriceUnavailableResponse['details']
): ServiceResult {
  return { status: 503, body: { status: 'unavailable', code, message, details } };
}

function isValidDateText(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  return !Number.isNaN(Date.parse(`${value}T00:00:00.000Z`));
}

function validateRequest({
  asset,
  date,
  amountUsd,
  now,
}: {
  asset?: string;
  date?: string;
  amountUsd?: string;
  now: Date;
}): ServiceResult | { asset: SimulationAssetSymbol; date: string; amountUsd: number } {
  if (!asset) return validationError(400, 'missing_asset', 'Asset is required.');

  const normalizedAsset = asset.toUpperCase();
  if (!isSimulationAssetSymbol(normalizedAsset)) {
    return validationError(400, 'unsupported_asset', 'Simulation v1 supports BTC, ETH, and SOL.');
  }

  if (!date) return validationError(400, 'missing_date', 'Historical buy date is required.');
  if (!isValidDateText(date)) {
    return validationError(400, 'invalid_date', 'Date must use YYYY-MM-DD format.');
  }

  if (date < simulationHistoricalDateRange.min || date > simulationHistoricalDateRange.max) {
    return validationError(
      400,
      'date_out_of_range',
      `Date must be from ${simulationHistoricalDateRange.min} through ${simulationHistoricalDateRange.max}.`
    );
  }

  if (amountUsd === undefined || amountUsd.trim() === '') {
    return validationError(400, 'missing_amount', 'USD amount is required.');
  }

  const parsedAmount = Number(amountUsd);
  if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
    return validationError(400, 'invalid_amount', 'USD amount must be a positive number.');
  }

  return { asset: normalizedAsset, date, amountUsd: parsedAmount };
}

function isPositiveFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
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

function createHistoricalSource(historical: HistoricalPriceRecord) {
  return {
    ...createFallbackResult({ reason: 'curated historical dataset' }),
    provider: 'historical_csv',
    updatedAt: historical.importedAt,
  };
}

export async function getSimulationPrice({
  env,
  asset,
  date,
  amountUsd,
  now = new Date(),
}: {
  env: ApiEnv;
  asset?: string;
  date?: string;
  amountUsd?: string;
  now?: Date;
}): Promise<ServiceResult> {
  const validated = validateRequest({ asset, date, amountUsd, now });
  if ('body' in validated) return validated;

  if (!env.HISTORICAL_PRICES_DB) {
    return unavailable('historical_price_unavailable', 'Historical price database is unavailable.', {
      asset: validated.asset,
      requestedDate: validated.date,
    });
  }

  const historical = await findHistoricalPrice({
    db: env.HISTORICAL_PRICES_DB,
    assetSymbol: validated.asset,
    requestedDate: validated.date,
    historicalMaxDate: simulationHistoricalDateRange.max,
  });

  recordMetric({
    name: 'crypto.api.simulation_prices.historical_d1',
    durationMs: 0,
    status: historical ? 'success' : 'error',
    metadata: {
      asset: validated.asset,
      requestedDate: validated.date,
      resolvedDate: historical?.resolvedDate ?? null,
      dateResolution: historical?.dateResolution ?? null,
    },
  });

  if (!historical) {
    return unavailable('historical_price_unavailable', 'Historical USD price is unavailable.', {
      asset: validated.asset,
      requestedDate: validated.date,
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
      asset: validated.asset,
      requestedDate: validated.date,
    });
  }

  const currentPrice = current.prices[validated.asset];
  if (
    !currentPrice ||
    !isPositiveFiniteNumber(currentPrice.priceUsd) ||
    !isPositiveFiniteNumber(historical.priceUsd)
  ) {
    return unavailable('simulation_price_unavailable', 'A required simulation price is invalid.', {
      asset: validated.asset,
      requestedDate: validated.date,
    });
  }

  const startedAt = Date.now();
  const result = calculateResult({
    amountUsd: validated.amountUsd,
    historicalPriceUsd: historical.priceUsd,
    currentPriceUsd: currentPrice.priceUsd,
  });

  recordMetric({
    name: 'crypto.api.simulation_prices.compute',
    durationMs: Date.now() - startedAt,
    status: 'success',
    metadata: {
      asset: validated.asset,
      dateResolution: historical.dateResolution,
      cacheStatus: current.cacheStatus,
    },
  });

  const assetConfig = getSimulationAsset(validated.asset);
  const body: SimulationPriceSuccessResponse = {
    status: 'success',
    asset: {
      symbol: assetConfig.symbol,
      name: assetConfig.name,
      coinGeckoId: assetConfig.coinGeckoId,
    },
    input: {
      requestedDate: validated.date,
      amountUsd: validated.amountUsd,
    },
    historical: {
      requestedDate: historical.requestedDate,
      resolvedDate: historical.resolvedDate,
      dateResolution: historical.dateResolution,
      priceUsd: historical.priceUsd,
      source: createHistoricalSource(historical),
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
  };

  return { status: 200, body };
}
