import {
  isCryptoInfoMap,
  isCryptoListing,
  normalizeQuoteTicker,
  TickerApiPoint,
} from '../../../../../packages/shared/src';
import { ApiEnv } from '../../types';
import { recordMetric } from '../../telemetry/metrics';
import { fetchCryptoInfo, fetchLatestListings, fetchLatestQuote } from './coinMarketCapClient';
import { cryptoFallbackKeys, getCloudFallback } from './cloudFallbackStore';

type CryptoInfoMap = Record<string, unknown>;

function recordFallback(name: string, metadata: Record<string, unknown>) {
  recordMetric({
    name,
    durationMs: 0,
    status: 'success',
    metadata: { ...metadata, source: 'cloud-kv' },
  });
}

export async function getListings({
  env,
  limit,
}: {
  env: ApiEnv;
  limit: string;
}) {
  if (env.CRYPTO_API_KEY) {
    try {
      const response = await fetchLatestListings({ apiKey: env.CRYPTO_API_KEY, limit });

      if (Array.isArray(response.data) && response.data.every(isCryptoListing)) {
        return response.data;
      }
    } catch {
      // Fall through to cloud fallback data.
    }
  }

  recordFallback('crypto.api.listings.fallback', { limit: Number(limit) });
  return getCloudFallback<unknown[]>(env, cryptoFallbackKeys.listings, []);
}

export async function getInfo({
  env,
  ids,
}: {
  env: ApiEnv;
  ids: string;
}) {
  if (env.CRYPTO_API_KEY && ids) {
    try {
      const response = await fetchCryptoInfo({ apiKey: env.CRYPTO_API_KEY, ids });

      if (isCryptoInfoMap(response.data)) {
        return response.data;
      }
    } catch {
      // Fall through to cloud fallback data.
    }
  }

  recordFallback('crypto.api.info.fallback', { ids });
  return getCloudFallback<CryptoInfoMap>(env, cryptoFallbackKeys.info, {});
}

export async function getTickers({
  env,
  id,
}: {
  env: ApiEnv;
  id: string;
}) {
  if (env.CRYPTO_API_KEY && id) {
    try {
      const response = await fetchLatestQuote({ apiKey: env.CRYPTO_API_KEY, id });
      const ticker = normalizeQuoteTicker(response.data?.[id]);

      if (ticker) {
        return [ticker];
      }
    } catch {
      // Fall through to cloud fallback data.
    }
  }

  recordFallback('crypto.api.tickers.fallback', { id });
  return getCloudFallback<TickerApiPoint[]>(env, cryptoFallbackKeys.tickers, []);
}
