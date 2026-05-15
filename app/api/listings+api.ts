import { recordMetric, timeAsync } from "@/utils/metrics";
import { isCryptoListing } from "@/utils/cryptoValidators";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const limit = url.searchParams.get("limit") || 5;
  const apiKey = process.env.CRYPTO_API_KEY;

  if (apiKey) {
    try {
      const response = await timeAsync(
        'crypto.api.listings.upstream',
        async () => {
          const response = await fetch(
            `https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest?start=1&limit=${limit}&convert=EUR`,
            {
              headers: {
                "X-CMC_PRO_API_KEY": apiKey,
              },
            }
          );

          if (!response.ok) {
            throw new Error(`CoinMarketCap listings request failed: ${response.status}`);
          }

          return response;
        },
        { limit: Number(limit), provider: 'coinmarketcap' }
      );

      const res = await response.json();

      if (Array.isArray(res.data) && res.data.every(isCryptoListing)) {
        return Response.json(res.data);
      }
    } catch {
      // Fall through to local data so the UI still works offline or without keys.
    }
  }

  recordMetric({
    name: 'crypto.api.listings.fallback',
    durationMs: 0,
    status: 'success',
    metadata: { limit: Number(limit), source: 'local' },
  });

  return Response.json(data);
}

const data = 
  [
    {
        "id": 1,
        "name": "Bitcoin",
        "symbol": "BTC",
        "slug": "bitcoin",
        "num_market_pairs": 12399,
        "date_added": "2010-07-13T00:00:00.000Z",
        "tags": [
            "mineable",
            "pow",
            "sha-256",
            "store-of-value",
            "state-channel",
            "coinbase-ventures-portfolio",
            "three-arrows-capital-portfolio",
            "polychain-capital-portfolio",
            "binance-labs-portfolio",
            "blockchain-capital-portfolio",
            "boostvc-portfolio",
            "cms-holdings-portfolio",
            "dcg-portfolio",
            "dragonfly-capital-portfolio",
            "electric-capital-portfolio",
            "fabric-ventures-portfolio",
            "framework-ventures-portfolio",
            "galaxy-digital-portfolio",
            "huobi-capital-portfolio",
            "alameda-research-portfolio",
            "a16z-portfolio",
            "1confirmation-portfolio",
            "winklevoss-capital-portfolio",
            "usv-portfolio",
            "placeholder-ventures-portfolio",
            "pantera-capital-portfolio",
            "multicoin-capital-portfolio",
            "paradigm-portfolio",
            "bitcoin-ecosystem",
            "layer-1",
            "ftx-bankruptcy-estate",
            "2017-2018-alt-season",
            "us-strategic-crypto-reserve",
            "binance-ecosystem",
            "binance-listing"
        ],
        "max_supply": 21000000,
        "circulating_supply": 19926984,
        "total_supply": 19926984,
        "infinite_supply": false,
        "platform": null,
        "cmc_rank": 1,
        "self_reported_circulating_supply": null,
        "self_reported_market_cap": null,
        "tvl_ratio": null,
        "last_updated": "2025-09-27T17:45:00.000Z",
        "quote": {
            "EUR": {
                "price": 93478.43561364933,
                "volume_24h": 27225338342.50448,
                "volume_change_24h": -52.4427,
                "percent_change_1h": -0.04532815,
                "percent_change_24h": -0.56355821,
                "percent_change_7d": -5.64666141,
                "percent_change_30d": -2.85420373,
                "percent_change_60d": -7.08759387,
                "percent_change_90d": 1.85627799,
                "market_cap": 1862743290818.2205,
                "market_cap_dominance": 57.8097,
                "fully_diluted_market_cap": 1963047147886.636,
                "tvl": null,
                "last_updated": "2025-09-27T17:46:04.000Z"
            }
        }
    },
    {
        "id": 1027,
        "name": "Ethereum",
        "symbol": "ETH",
        "slug": "ethereum",
        "num_market_pairs": 10845,
        "date_added": "2015-08-07T00:00:00.000Z",
        "tags": [
            "pos",
            "smart-contracts",
            "ethereum-ecosystem",
            "coinbase-ventures-portfolio",
            "three-arrows-capital-portfolio",
            "polychain-capital-portfolio",
            "binance-labs-portfolio",
            "blockchain-capital-portfolio",
            "boostvc-portfolio",
            "cms-holdings-portfolio",
            "dcg-portfolio",
            "dragonfly-capital-portfolio",
            "electric-capital-portfolio",
            "fabric-ventures-portfolio",
            "framework-ventures-portfolio",
            "hashkey-capital-portfolio",
            "kenetic-capital-portfolio",
            "huobi-capital-portfolio",
            "alameda-research-portfolio",
            "a16z-portfolio",
            "1confirmation-portfolio",
            "winklevoss-capital-portfolio",
            "usv-portfolio",
            "placeholder-ventures-portfolio",
            "pantera-capital-portfolio",
            "multicoin-capital-portfolio",
            "paradigm-portfolio",
            "ethereum-pow-ecosystem",
            "layer-1",
            "ftx-bankruptcy-estate",
            "sora-ecosystem",
            "rsk-rbtc-ecosystem",
            "world-liberty-financial-portfolio",
            "us-strategic-crypto-reserve",
            "binance-ecosystem",
            "binance-listing",
            "sophon-ecosystem"
        ],
        "max_supply": null,
        "circulating_supply": 120703338.82809992,
        "total_supply": 120703338.82809992,
        "infinite_supply": true,
        "platform": null,
        "cmc_rank": 2,
        "self_reported_circulating_supply": null,
        "self_reported_market_cap": null,
        "tvl_ratio": null,
        "last_updated": "2025-09-27T17:46:00.000Z",
        "quote": {
            "EUR": {
                "price": 3416.035677381838,
                "volume_24h": 21878279663.026726,
                "volume_change_24h": -53.2807,
                "percent_change_1h": -0.37961476,
                "percent_change_24h": -0.84573234,
                "percent_change_7d": -10.88609656,
                "percent_change_30d": -11.04637494,
                "percent_change_60d": 6.21382855,
                "percent_change_90d": 64.14099465,
                "market_cap": 412326911815.8978,
                "market_cap_dominance": 12.7964,
                "fully_diluted_market_cap": 412326911815.8943,
                "tvl": null,
                "last_updated": "2025-09-27T17:46:04.000Z"
            }
        }
    },
    {
        "id": 825,
        "name": "Tether USDt",
        "symbol": "USDT",
        "slug": "tether",
        "num_market_pairs": 149793,
        "date_added": "2015-02-25T00:00:00.000Z",
        "tags": [
            "stablecoin",
            "asset-backed-stablecoin",
            "usd-stablecoin",
            "ethereum-pow-ecosystem",
            "fiat-stablecoin",
            "tron20-ecosystem",
            "rsk-rbtc-ecosystem",
            "venom-ecosystem",
            "world-liberty-financial-portfolio",
            "binance-ecosystem",
            "binance-listing",
            "peaq-ecosystem",
            "apertum-ecosystem",
            "etherlink-ecosystem",
            "duckchain-ecosystem",
            "onus-ecosystem",
            "sophon-ecosystem",
            "zedxion-smart-chain-ecosystem",
            "xlayer-ecosystem"
        ],
        "max_supply": null,
        "circulating_supply": 174190521470.415,
        "total_supply": 178071777665.14517,
        "platform": {
            "id": 1027,
            "name": "Ethereum",
            "symbol": "ETH",
            "slug": "ethereum",
            "token_address": "0xdac17f958d2ee523a2206206994597c13d831ec7"
        },
        "infinite_supply": true,
        "cmc_rank": 3,
        "self_reported_circulating_supply": null,
        "self_reported_market_cap": null,
        "tvl_ratio": null,
        "last_updated": "2025-09-27T17:45:00.000Z",
        "quote": {
            "EUR": {
                "price": 0.8548954013776898,
                "volume_24h": 81983919870.40602,
                "volume_change_24h": -45.0448,
                "percent_change_1h": -0.02039135,
                "percent_change_24h": -0.01967219,
                "percent_change_7d": -0.00954387,
                "percent_change_30d": 0.03845626,
                "percent_change_60d": 0.05821725,
                "percent_change_90d": 0.02768401,
                "market_cap": 148914675768.63956,
                "market_cap_dominance": 4.6215,
                "fully_diluted_market_cap": 152232743841.08472,
                "tvl": null,
                "last_updated": "2025-09-27T17:46:04.000Z"
            }
        }
    },
    {
        "id": 52,
        "name": "XRP",
        "symbol": "XRP",
        "slug": "xrp",
        "num_market_pairs": 1714,
        "date_added": "2013-08-04T00:00:00.000Z",
        "tags": [
            "medium-of-exchange",
            "enterprise-solutions",
            "xrp-ecosystem",
            "arrington-xrp-capital-portfolio",
            "galaxy-digital-portfolio",
            "a16z-portfolio",
            "pantera-capital-portfolio",
            "ftx-bankruptcy-estate",
            "2017-2018-alt-season",
            "klaytn-ecosystem",
            "made-in-america",
            "us-strategic-crypto-reserve",
            "binance-ecosystem",
            "binance-listing"
        ],
        "max_supply": 100000000000,
        "circulating_supply": 59826504399,
        "total_supply": 99985796373,
        "infinite_supply": false,
        "platform": null,
        "cmc_rank": 4,
        "self_reported_circulating_supply": null,
        "self_reported_market_cap": null,
        "tvl_ratio": null,
        "last_updated": "2025-09-27T17:45:00.000Z",
        "quote": {
            "EUR": {
                "price": 2.3729586936167557,
                "volume_24h": 3055696662.4425707,
                "volume_change_24h": -60.3727,
                "percent_change_1h": -0.24524946,
                "percent_change_24h": -0.55462787,
                "percent_change_7d": -7.01901389,
                "percent_change_30d": -6.81179056,
                "percent_change_60d": -11.52827318,
                "percent_change_90d": 27.03534962,
                "market_cap": 141965823722.30817,
                "market_cap_dominance": 4.4059,
                "fully_diluted_market_cap": 237295869361.6796,
                "tvl": null,
                "last_updated": "2025-09-27T17:46:04.000Z"
            }
        }
    },
    {
        "id": 1839,
        "name": "BNB",
        "symbol": "BNB",
        "slug": "bnb",
        "num_market_pairs": 2769,
        "date_added": "2017-07-25T00:00:00.000Z",
        "tags": [
            "marketplace",
            "centralized-exchange",
            "payments",
            "smart-contracts",
            "alameda-research-portfolio",
            "multicoin-capital-portfolio",
            "bnb-chain-ecosystem",
            "layer-1",
            "alleged-sec-securities",
            "celsius-bankruptcy-estate",
            "binance-ecosystem",
            "binance-listing"
        ],
        "max_supply": null,
        "circulating_supply": 139185701.87,
        "total_supply": 139185701.87,
        "infinite_supply": false,
        "platform": null,
        "cmc_rank": 5,
        "self_reported_circulating_supply": null,
        "self_reported_market_cap": null,
        "tvl_ratio": null,
        "last_updated": "2025-09-27T17:45:00.000Z",
        "quote": {
            "EUR": {
                "price": 828.3004359519481,
                "volume_24h": 2489707893.1151876,
                "volume_change_24h": -31.877,
                "percent_change_1h": -0.58406943,
                "percent_change_24h": 0.93593615,
                "percent_change_7d": -5.62074569,
                "percent_change_30d": 10.62431038,
                "percent_change_60d": 19.54551266,
                "percent_change_90d": 49.47734018,
                "market_cap": 115287577537.19888,
                "market_cap_dominance": 3.5779,
                "fully_diluted_market_cap": 115287577537.19563,
                "tvl": null,
                "last_updated": "2025-09-27T17:46:04.000Z"
            }
        }
    }
]
