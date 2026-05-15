export type ApiResultSource = 'live' | 'fallback';

export interface ApiResultMetadata {
  source: ApiResultSource;
  provider: string;
  updatedAt: string | null;
  reason?: string;
  isFallback: boolean;
}

export function createLiveResult({
  provider,
  updatedAt,
}: {
  provider: string;
  updatedAt: string;
}): ApiResultMetadata {
  return {
    source: 'live',
    provider,
    updatedAt,
    isFallback: false,
  };
}

export function createFallbackResult({
  reason,
}: {
  reason: string;
}): ApiResultMetadata {
  return {
    source: 'fallback',
    provider: 'local',
    updatedAt: null,
    reason,
    isFallback: true,
  };
}

export function isApiResultStale(
  updatedAt: string | null | undefined,
  {
    nowMs = Date.now(),
    staleAfterMs,
  }: {
    nowMs?: number;
    staleAfterMs: number;
  }
) {
  if (!updatedAt) return true;

  const updatedAtMs = Date.parse(updatedAt);
  if (!Number.isFinite(updatedAtMs)) return true;

  return nowMs - updatedAtMs > staleAfterMs;
}
