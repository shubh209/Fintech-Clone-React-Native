import {
  PurchasingPowerCategory,
  PurchasingPowerCityId,
  PurchasingPowerErrorResponse,
  PurchasingPowerResponse,
  PurchasingPowerSuccessResponse,
} from './purchasingPowerTypes';

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

function isStringOrNull(value: unknown): value is string | null {
  return value === null || isString(value);
}

function isPurchasingPowerCityId(value: unknown): value is PurchasingPowerCityId {
  return (
    value === 'phoenix' ||
    value === 'san_francisco' ||
    value === 'new_york' ||
    value === 'austin' ||
    value === 'seattle'
  );
}

function isPurchasingPowerCategory(value: unknown): value is PurchasingPowerCategory {
  return value === 'monthly_essentials' || value === 'big_purchase';
}

function isPurchasingPowerErrorCode(
  value: unknown
): value is PurchasingPowerErrorResponse['code'] {
  return (
    value === 'missing_city' ||
    value === 'unsupported_city' ||
    value === 'missing_amount' ||
    value === 'invalid_amount'
  );
}

function isApiResultMetadata(value: unknown) {
  if (!isRecord(value)) return false;
  if (value.source !== 'live' && value.source !== 'fallback') return false;
  if (!isString(value.provider)) return false;
  if (!isStringOrNull(value.updatedAt)) return false;
  if (typeof value.isFallback !== 'boolean') return false;
  if (value.reason !== undefined && !isString(value.reason)) return false;
  return true;
}

function isPurchasingPowerComparison(value: unknown) {
  if (!isRecord(value)) return false;

  return (
    isString(value.itemId) &&
    isString(value.label) &&
    isPurchasingPowerCategory(value.category) &&
    isPositiveFiniteNumber(value.costUsd) &&
    isFiniteNumber(value.quantity) &&
    isString(value.summary)
  );
}

export function isPurchasingPowerSuccessResponse(
  value: unknown
): value is PurchasingPowerSuccessResponse {
  if (!isRecord(value) || value.status !== 'success') return false;

  const city = value.city;
  if (!isRecord(city)) return false;
  if (!isPurchasingPowerCityId(city.id)) return false;
  if (!isString(city.name) || !isString(city.state)) return false;

  const input = value.input;
  if (!isRecord(input) || !isPositiveFiniteNumber(input.amountUsd)) return false;

  const comparisons = value.comparisons;
  if (!isRecord(comparisons)) return false;
  if (
    !Array.isArray(comparisons.monthlyEssentials) ||
    !comparisons.monthlyEssentials.every(isPurchasingPowerComparison)
  ) {
    return false;
  }
  if (
    !Array.isArray(comparisons.bigPurchases) ||
    !comparisons.bigPurchases.every(isPurchasingPowerComparison)
  ) {
    return false;
  }

  const source = value.source;
  return isRecord(source) && isApiResultMetadata(source) && isString(source.datasetVersion);
}

export function isPurchasingPowerErrorResponse(
  value: unknown
): value is PurchasingPowerErrorResponse {
  if (!isRecord(value) || value.status !== 'error') return false;

  return isPurchasingPowerErrorCode(value.code) && isString(value.message);
}

export function isPurchasingPowerResponse(value: unknown): value is PurchasingPowerResponse {
  return isPurchasingPowerSuccessResponse(value) || isPurchasingPowerErrorResponse(value);
}
