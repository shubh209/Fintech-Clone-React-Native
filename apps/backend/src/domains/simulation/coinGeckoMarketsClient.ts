import { timeAsync } from '../../telemetry/metrics';

const coinGeckoBaseUrl = 'https://api.coingecko.com/api/v3';

export interface CoinGeckoMarket {
  coinGeckoId: string;
  rank: number | null;
  imageUrl: string | null;
  currentPriceUsd: number;
  priceChangePercentage24h: number | null;
  updatedAt: string | null;
}

function isPositiveFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

function nullableFiniteNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function nullableString(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

export async function fetchCoinGeckoMarkets({
  coinGeckoIds,
  apiKey,
  fetchImpl = fetch,
}: {
  coinGeckoIds: string[];
  apiKey?: string;
  fetchImpl?: typeof fetch;
}): Promise<Record<string, CoinGeckoMarket>> {
  const query = new URLSearchParams({
    vs_currency: 'usd',
    ids: coinGeckoIds.join(','),
    order: 'market_cap_desc',
    per_page: String(Math.max(coinGeckoIds.length, 1)),
    page: '1',
    sparkline: 'false',
    price_change_percentage: '24h',
  });

  const response = await timeAsync(
    'crypto.api.simulation_assets.market_coingecko',
    () =>
      fetchImpl(`${coinGeckoBaseUrl}/coins/markets?${query.toString()}`, {
        headers: apiKey ? { 'x-cg-demo-api-key': apiKey } : undefined,
      }),
    { assets: coinGeckoIds, provider: 'coingecko' }
  );

  if (!response.ok) {
    throw new Error(`CoinGecko markets request failed: ${response.status}`);
  }

  const rows = (await response.json()) as Array<Record<string, unknown>>;

  return Object.fromEntries(
    rows.map((row) => {
      if (typeof row.id !== 'string' || !isPositiveFiniteNumber(row.current_price)) {
        throw new Error('invalid CoinGecko market row');
      }

      return [
        row.id,
        {
          coinGeckoId: row.id,
          rank: nullableFiniteNumber(row.market_cap_rank),
          imageUrl: nullableString(row.image),
          currentPriceUsd: row.current_price,
          priceChangePercentage24h: nullableFiniteNumber(row.price_change_percentage_24h),
          updatedAt: nullableString(row.last_updated),
        },
      ];
    })
  );
}
