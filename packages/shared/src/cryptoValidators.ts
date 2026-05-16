import { TickerApiPoint } from './cryptoTypes';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

export function isCryptoListing(value: unknown) {
  if (!isRecord(value)) return false;
  if (!isFiniteNumber(value.id)) return false;
  if (typeof value.name !== 'string') return false;
  if (typeof value.symbol !== 'string') return false;

  const quote = value.quote;
  if (!isRecord(quote)) return false;

  const eur = quote.EUR;
  if (!isRecord(eur)) return false;

  return isFiniteNumber(eur.price);
}

export function isCryptoInfoMap(value: unknown) {
  if (!isRecord(value)) return false;

  return Object.values(value).every((entry) => {
    if (!isRecord(entry)) return false;
    return (
      isFiniteNumber(entry.id) &&
      typeof entry.name === 'string' &&
      typeof entry.symbol === 'string' &&
      typeof entry.logo === 'string'
    );
  });
}

export function normalizeQuoteTicker(value: unknown): TickerApiPoint | null {
  if (!isRecord(value)) return null;

  const quote = value.quote;
  if (!isRecord(quote)) return null;

  const eur = quote.EUR;
  if (!isRecord(eur)) return null;
  if (!isFiniteNumber(eur.price)) return null;

  return {
    timestamp:
      typeof eur.last_updated === 'string'
        ? eur.last_updated
        : typeof value.last_updated === 'string'
          ? value.last_updated
          : new Date().toISOString(),
    price: eur.price,
    volume_24h: isFiniteNumber(eur.volume_24h) ? eur.volume_24h : 0,
    market_cap: isFiniteNumber(eur.market_cap) ? eur.market_cap : 0,
  };
}
