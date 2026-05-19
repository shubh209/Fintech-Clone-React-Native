import { ApiEnv } from '../../types';

export const cryptoFallbackKeys = {
  listings: 'crypto:listings',
  info: 'crypto:info',
  tickers: 'crypto:tickers',
} as const;

export async function getCloudFallback<T>(
  env: ApiEnv,
  key: (typeof cryptoFallbackKeys)[keyof typeof cryptoFallbackKeys],
  emptyValue: T
): Promise<T> {
  const value = await env.CRYPTO_FALLBACKS?.get<T>(key, 'json');
  return value ?? emptyValue;
}
