import {
  createFallbackResult,
  SimulationHistoryResponse,
  SimulationHistorySuccessResponse,
  SimulationPriceErrorResponse,
  SimulationPriceUnavailableResponse,
} from '../../../../../packages/shared/src';
import { ApiEnv } from '../../types';
import { recordMetric } from '../../telemetry/metrics';
import { findHistoricalPriceSeries, HistoricalPriceSeries } from './historicalPriceRepository';
import { findSupportedSimulationAssetBySymbol } from './assets/simulationSupportedAssetService';
import {
  simulationHistoricalDateRange,
} from './simulationAssets';

interface ServiceResult {
  status: number;
  body: SimulationHistoryResponse;
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

function validateRequest({
  asset,
  year,
}: {
  asset?: string;
  year?: string;
}): ServiceResult | { asset: string; year: number; startDate: string; endDate: string } {
  if (!asset) return validationError(400, 'missing_asset', 'Asset is required.');

  const normalizedAsset = asset.toUpperCase();

  const parsedYear = Number(year);
  if (!Number.isInteger(parsedYear)) {
    return validationError(400, 'invalid_date', 'Year must use YYYY format.');
  }

  const startDate = `${parsedYear}-01-01`;
  const endDate = `${parsedYear}-12-31`;

  if (
    endDate < simulationHistoricalDateRange.min ||
    startDate > simulationHistoricalDateRange.max
  ) {
    return validationError(
      400,
      'date_out_of_range',
      `Year must overlap ${simulationHistoricalDateRange.min} through ${simulationHistoricalDateRange.max}.`
    );
  }

  return {
    asset: normalizedAsset,
    year: parsedYear,
    startDate: startDate < simulationHistoricalDateRange.min ? simulationHistoricalDateRange.min : startDate,
    endDate: endDate > simulationHistoricalDateRange.max ? simulationHistoricalDateRange.max : endDate,
  };
}

function createHistoricalSource(series: HistoricalPriceSeries) {
  return {
    ...createFallbackResult({ reason: 'curated historical dataset' }),
    provider: 'historical_csv',
    updatedAt: series.importedAt,
  };
}

export async function getSimulationHistory({
  env,
  asset,
  year,
}: {
  env: ApiEnv;
  asset?: string;
  year?: string;
}): Promise<ServiceResult> {
  const validated = validateRequest({ asset, year });
  if ('body' in validated) return validated;

  if (!env.HISTORICAL_PRICES_DB) {
    return unavailable('historical_price_unavailable', 'Historical price database is unavailable.', {
      asset: validated.asset,
      requestedDate: validated.startDate,
    });
  }

  const supportedAsset = await findSupportedSimulationAssetBySymbol({
    db: env.HISTORICAL_PRICES_DB,
    symbol: validated.asset,
  });
  if (!supportedAsset) {
    return validationError(400, 'unsupported_asset', 'Simulation supports the top 20 ready assets.');
  }

  const series = await findHistoricalPriceSeries({
    db: env.HISTORICAL_PRICES_DB,
    assetSymbol: supportedAsset.historicalSymbol,
    startDate: validated.startDate,
    endDate: validated.endDate,
  });

  recordMetric({
    name: 'crypto.api.simulation_prices.historical_d1',
    durationMs: 0,
    status: series ? 'success' : 'error',
    metadata: {
      asset: validated.asset,
      startDate: validated.startDate,
      endDate: validated.endDate,
      points: series?.points.length ?? 0,
    },
  });

  if (!series) {
    return unavailable('historical_price_unavailable', 'Historical USD chart data is unavailable.', {
      asset: validated.asset,
      requestedDate: validated.startDate,
    });
  }

  const body: SimulationHistorySuccessResponse = {
    status: 'success',
    asset: {
      symbol: supportedAsset.symbol,
      name: supportedAsset.name,
      coinGeckoId: supportedAsset.coinGeckoId,
    },
    range: {
      year: validated.year,
      startDate: validated.startDate,
      endDate: validated.endDate,
    },
    points: series.points,
    source: createHistoricalSource(series),
  };

  return { status: 200, body };
}
