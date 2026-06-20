import { timeAsync } from '../../../telemetry/metrics';

const coinGeckoBaseUrl = 'https://api.coingecko.com/api/v3';

export interface CoinGeckoSimplePriceAsset {
  symbol: string;
  coinGeckoId: string;
}

export interface SimulationCurrentPrice {
  assetSymbol: string;
  coinGeckoId: string;
  priceUsd: number;
  updatedAt: string | null;
}

interface CoinGeckoPricePayload {
  usd?: unknown;
  last_updated_at?: unknown;
}

function isPositiveFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

function toIsoTimestamp(value: unknown) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  return new Date(value * 1000).toISOString();
}

export async function fetchCoinGeckoSimplePrices({
  apiKey,
  assets,
  fetchImpl = fetch,
}: {
  apiKey?: string;
  assets: CoinGeckoSimplePriceAsset[];
  fetchImpl?: typeof fetch;
}): Promise<Record<string, SimulationCurrentPrice>> {
  const coinGeckoIds = assets.map((asset) => asset.coinGeckoId);
  const query = new URLSearchParams({
    ids: coinGeckoIds.join(','),
    vs_currencies: 'usd',
    include_last_updated_at: 'true',
  });

  const response = await timeAsync(
    'crypto.api.simulation_prices.current_coingecko',
    () =>
      fetchImpl(`${coinGeckoBaseUrl}/simple/price?${query.toString()}`, {
        headers: apiKey ? { 'x-cg-demo-api-key': apiKey } : undefined,
      }),
    { assets: coinGeckoIds, cacheStatus: 'refreshing', provider: 'coingecko' }
  );

  if (!response.ok) {
    throw new Error(`CoinGecko current price request failed: ${response.status}`);
  }

  const data = (await response.json()) as Record<string, CoinGeckoPricePayload>;

  return Object.fromEntries(
    assets.map((asset) => {
      const payload = data[asset.coinGeckoId];
      if (!payload || !isPositiveFiniteNumber(payload.usd)) {
        throw new Error(`CoinGecko returned invalid USD price for ${asset.coinGeckoId}`);
      }

      return [
        asset.symbol,
        {
          assetSymbol: asset.symbol,
          coinGeckoId: asset.coinGeckoId,
          priceUsd: payload.usd,
          updatedAt: toIsoTimestamp(payload.last_updated_at),
        },
      ];
    })
  );
}
