import { timeAsync } from '../telemetry/metrics';

const coinMarketCapBaseUrl = 'https://pro-api.coinmarketcap.com';

async function fetchCoinMarketCap(path: string, apiKey: string, metadata: Record<string, unknown>) {
  return timeAsync(
    `crypto.api.${String(metadata.endpoint)}.upstream`,
    async () => {
      const response = await fetch(`${coinMarketCapBaseUrl}${path}`, {
        headers: {
          'X-CMC_PRO_API_KEY': apiKey,
        },
      });

      if (!response.ok) {
        throw new Error(`CoinMarketCap request failed: ${response.status}`);
      }

      return response.json();
    },
    { ...metadata, provider: 'coinmarketcap' }
  );
}

export function fetchLatestListings({
  apiKey,
  limit,
}: {
  apiKey: string;
  limit: string;
}) {
  return fetchCoinMarketCap(
    `/v1/cryptocurrency/listings/latest?start=1&limit=${limit}&convert=EUR`,
    apiKey,
    { endpoint: 'listings', limit: Number(limit) }
  );
}

export function fetchCryptoInfo({
  apiKey,
  ids,
}: {
  apiKey: string;
  ids: string;
}) {
  return fetchCoinMarketCap(
    `/v2/cryptocurrency/info?id=${ids}`,
    apiKey,
    { endpoint: 'info', ids }
  );
}

export function fetchLatestQuote({
  apiKey,
  id,
}: {
  apiKey: string;
  id: string;
}) {
  return fetchCoinMarketCap(
    `/v2/cryptocurrency/quotes/latest?id=${id}&convert=EUR`,
    apiKey,
    { endpoint: 'tickers', id }
  );
}
