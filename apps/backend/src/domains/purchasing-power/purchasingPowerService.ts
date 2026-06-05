import {
  createFallbackResult,
  PurchasingPowerCityId,
  PurchasingPowerComparison,
  PurchasingPowerErrorResponse,
  PurchasingPowerItem,
  PurchasingPowerResponse,
  PurchasingPowerSuccessResponse,
} from '../../../../../packages/shared/src';
import {
  purchasingPowerCities,
  purchasingPowerDatasetUpdatedAt,
  purchasingPowerDatasetVersion,
  purchasingPowerItemsByCity,
} from './purchasingPowerData';
import { recordMetric } from '../../telemetry/metrics';

interface ServiceResult {
  status: number;
  body: PurchasingPowerResponse;
}

function validationError(
  code: PurchasingPowerErrorResponse['code'],
  message: string
): ServiceResult {
  return { status: 400, body: { status: 'error', code, message } };
}

function isPurchasingPowerCityId(value: string): value is PurchasingPowerCityId {
  return (
    value === 'phoenix' ||
    value === 'san_francisco' ||
    value === 'new_york' ||
    value === 'austin' ||
    value === 'seattle'
  );
}

function roundToTwo(value: number) {
  return Math.round(value * 100) / 100;
}

function amountBucket(amountUsd: number) {
  if (amountUsd < 1000) return '0_999';
  if (amountUsd < 5000) return '1000_4999';
  if (amountUsd < 10000) return '5000_9999';
  return '10000_plus';
}

function toComparison({
  item,
  cityName,
  amountUsd,
}: {
  item: PurchasingPowerItem;
  cityName: string;
  amountUsd: number;
}): PurchasingPowerComparison {
  const quantity = roundToTwo(amountUsd / item.costUsd);

  return {
    itemId: item.id,
    label: item.label,
    category: item.category,
    costUsd: item.costUsd,
    quantity,
    summary: `${quantity.toFixed(2)}x ${item.label.toLowerCase()} in ${cityName}`,
  };
}

export function getPurchasingPowerComparisons({
  city,
  amountUsd,
}: {
  city?: string;
  amountUsd?: string;
}): ServiceResult {
  if (!city) return validationError('missing_city', 'City is required.');
  if (!isPurchasingPowerCityId(city)) {
    return validationError('unsupported_city', 'City is not supported.');
  }

  if (amountUsd === undefined || amountUsd.trim() === '') {
    return validationError('missing_amount', 'USD amount is required.');
  }

  const parsedAmount = Number(amountUsd);
  if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
    return validationError('invalid_amount', 'USD amount must be a positive number.');
  }

  const cityConfig = purchasingPowerCities.find((item) => item.id === city);
  const items = purchasingPowerItemsByCity[city];
  const comparisons = items.map((item) =>
    toComparison({ item, cityName: cityConfig?.name ?? city, amountUsd: parsedAmount })
  );

  const body: PurchasingPowerSuccessResponse = {
    status: 'success',
    city: cityConfig ?? { id: city, name: city, state: '' },
    input: {
      amountUsd: parsedAmount,
    },
    comparisons: {
      monthlyEssentials: comparisons.filter((item) => item.category === 'monthly_essentials'),
      bigPurchases: comparisons.filter((item) => item.category === 'big_purchase'),
    },
    source: {
      ...createFallbackResult({ reason: 'curated portfolio simulation dataset' }),
      provider: 'curated_cost_of_living_dataset',
      updatedAt: purchasingPowerDatasetUpdatedAt,
      datasetVersion: purchasingPowerDatasetVersion,
    },
  };

  recordMetric({
    name: 'crypto.api.purchasing_power.compute',
    durationMs: 0,
    status: 'success',
    metadata: {
      city,
      amountBucket: amountBucket(parsedAmount),
      monthlyEssentialsCount: body.comparisons.monthlyEssentials.length,
      bigPurchasesCount: body.comparisons.bigPurchases.length,
    },
  });

  return { status: 200, body };
}
