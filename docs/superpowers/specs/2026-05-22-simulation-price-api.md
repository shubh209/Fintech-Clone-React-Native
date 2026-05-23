# Simulation Price API

## Status

Backend contract implemented for Worker runtime. Frontend client and screen are still pending.

## Goal

Define the Worker contract that combines curated historical D1 prices with CoinGecko current USD prices to produce a complete Simulation result.

The mobile app must call this Worker endpoint instead of calling D1, CoinGecko, or raw provider APIs directly.

## Endpoint

```text
GET /api/simulation/prices?asset=BTC&date=2021-01-01&amountUsd=100
```

## Request Parameters

| Parameter | Required | Format | Rules |
| --- | --- | --- | --- |
| `asset` | yes | symbol | Must be one of v1 product-supported symbols: `BTC`, `ETH`, `SOL`. |
| `date` | yes | `YYYY-MM-DD` | Must be from `2021-01-01` through the latest common imported historical date for BTC, ETH, and SOL. The current dataset supports `2026-03-22`. |
| `amountUsd` | yes | decimal string | Must parse to a positive USD amount greater than `0`. |

The API intentionally accepts product-facing symbols, not provider-specific IDs. The Worker owns provider mapping.

Runtime historical date max is currently `2026-03-22`, matching the latest common imported historical date for BTC, ETH, and SOL in the verified D1 import.

## Asset Identifiers

| Asset | Product symbol | CoinGecko ID | Historical D1 key |
| --- | --- | --- | --- |
| Bitcoin | BTC | `bitcoin` | `BTC` |
| Ethereum | ETH | `ethereum` | `ETH` |
| Solana | SOL | `solana` | `SOL` |

The D1 historical price store may contain more assets than Simulation v1 exposes. This endpoint must reject unsupported product symbols until a later product spec expands the allowlist.

## Successful Response

```json
{
  "status": "success",
  "asset": {
    "symbol": "BTC",
    "name": "Bitcoin",
    "coinGeckoId": "bitcoin"
  },
  "input": {
    "requestedDate": "2021-01-01",
    "amountUsd": 100
  },
  "historical": {
    "requestedDate": "2021-01-01",
    "resolvedDate": "2021-01-01",
    "dateResolution": "exact",
    "priceUsd": 29374.15,
    "source": {
      "source": "fallback",
      "provider": "historical_csv",
      "updatedAt": "2026-05-22T00:00:00.000Z",
      "reason": "curated historical dataset",
      "isFallback": true
    }
  },
  "current": {
    "priceUsd": 108000.25,
    "source": {
      "source": "live",
      "provider": "coingecko",
      "updatedAt": "2026-05-22T17:30:00.000Z",
      "isFallback": false
    },
    "cache": {
      "status": "fresh",
      "ttlSeconds": 60
    }
  },
  "result": {
    "impliedQuantity": 0.003404,
    "currentValueUsd": 367.63,
    "gainLossUsd": 267.63,
    "gainLossPercent": 267.63
  }
}
```

## Historical Date Resolution

Historical price lookup follows ADR 0018 and the historical ingestion spec:

- exact D1 row returns `dateResolution: "exact"`.
- missing requested date may resolve to the next available date.
- next available date must be no more than 3 calendar days after the requested date.
- next available date must be no later than the latest common imported historical date for BTC, ETH, and SOL.
- response must include both `requestedDate` and `resolvedDate`.

When the resolved date differs from the requested date, return:

```json
{
  "requestedDate": "2021-01-01",
  "resolvedDate": "2021-01-03",
  "dateResolution": "next_available"
}
```

The UI must not hide `next_available` resolution.

## Current Price Provider

Use CoinGecko Simple Price for current USD prices.

Worker request:

```text
/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd&include_last_updated_at=true
```

Rules:

- CoinGecko calls happen only from the Worker.
- The Worker fetches all v1 product-supported assets in one upstream request.
- The Worker maps CoinGecko IDs back to product symbols.
- The Worker uses `usd` only.
- The Worker must validate that every returned current price is a positive finite number.
- `last_updated_at` must be converted to an ISO timestamp for Data Trust metadata when present.

## Current Price Caching

Current prices are cached in the Worker for 60 seconds.

Cache behavior:

- If the cache is fresh, use it without calling CoinGecko.
- If the cache is expired or empty, call CoinGecko and replace the cache on success.
- If CoinGecko succeeds, return `cache.status: "refreshed"` or `"fresh"` depending on whether the current request refreshed it.
- If CoinGecko fails but the cache is still inside the 60-second TTL, return the cached value with `cache.status: "fresh"` and source provider `coingecko`.
- If CoinGecko fails and the cache is expired or empty, return `current_price_unavailable`.

Do not complete a Simulation with stale current prices beyond the 60-second TTL.

## Calculation Rules

The Worker computes the Simulation result:

```text
impliedQuantity = amountUsd / historical.priceUsd
currentValueUsd = impliedQuantity * current.priceUsd
gainLossUsd = currentValueUsd - amountUsd
gainLossPercent = (gainLossUsd / amountUsd) * 100
```

Rules:

- Use the historical `Close` price from D1 as `historical.priceUsd`.
- Use the CoinGecko USD current price as `current.priceUsd`.
- Reject zero, negative, missing, or non-finite prices.
- Return numeric JSON values, not formatted currency strings.
- Frontend owns display formatting.

## Validation Errors

Validation failures return `status: "error"` with an error code and no computed result.

| HTTP status | Code | Meaning |
| --- | --- | --- |
| `400` | `missing_asset` | `asset` query parameter is missing. |
| `400` | `unsupported_asset` | Asset is not one of BTC, ETH, or SOL. |
| `400` | `missing_date` | `date` query parameter is missing. |
| `400` | `invalid_date` | Date is not `YYYY-MM-DD` or cannot be parsed. |
| `400` | `date_out_of_range` | Date is before `2021-01-01` or after the latest common imported historical date. |
| `400` | `missing_amount` | `amountUsd` query parameter is missing. |
| `400` | `invalid_amount` | Amount is not a positive finite number. |

Example:

```json
{
  "status": "error",
  "code": "unsupported_asset",
  "message": "Simulation v1 supports BTC, ETH, and SOL."
}
```

## Unavailable States

Unavailable states are not successful completed simulations.

| HTTP status | Code | Meaning |
| --- | --- | --- |
| `503` | `historical_price_unavailable` | No exact or bounded next-available historical D1 row exists. |
| `503` | `current_price_unavailable` | CoinGecko failed and no fresh 60-second cache is available. |
| `503` | `simulation_price_unavailable` | A required price was invalid after provider/storage lookup. |

Unavailable response example:

```json
{
  "status": "unavailable",
  "code": "current_price_unavailable",
  "message": "Current USD price is unavailable. Try again soon.",
  "details": {
    "asset": "BTC",
    "requestedDate": "2021-01-01"
  }
}
```

## Metrics

Backend metrics:

- `crypto.api.simulation_prices.historical_d1`
  - Measures D1 historical lookup.
  - Metadata: `asset`, `requestedDate`, `resolvedDate`, `dateResolution`, `status`.
- `crypto.api.simulation_prices.current_coingecko`
  - Measures CoinGecko upstream current-price refresh.
  - Metadata: `assets`, `cacheStatus`, `provider`.
- `crypto.api.simulation_prices.current_cache`
  - Records current-price cache use.
  - Metadata: `assets`, `cacheStatus`, `ageMs`.
- `crypto.api.simulation_prices.compute`
  - Measures Worker-side calculation.
  - Metadata: `asset`, `dateResolution`.

Frontend metrics:

- `crypto.client.simulation_prices.fetch`
  - Measures the mobile request to this Worker endpoint.
  - Metadata: `asset`, `requestedDate`, `status`.
- `crypto.simulation.completed`
  - Records completed result render.
  - Metadata: `asset`, `dateResolution`, `currentCacheStatus`.
- `crypto.simulation.failed`
  - Records validation or unavailable outcomes.
  - Metadata: `asset`, `code`.

## Definition Of Done

This API spec is complete when a future implementer knows:

- endpoint path and required query parameters.
- product asset identifiers and provider mappings.
- exact success response shape.
- historical date-resolution behavior.
- CoinGecko current-price behavior.
- 60-second cache rules.
- validation error codes.
- unavailable state codes.
- Worker-owned calculation rules.
- backend and frontend metrics that must be emitted.

## Implementation Notes

As of 2026-05-22:

- Worker route exists at `GET /api/simulation/prices`.
- Historical lookup uses `HISTORICAL_PRICES_DB` D1 binding.
- Current USD lookup uses CoinGecko Simple Price with `COINGECKO_API_KEY`.
- Current price cache TTL is 60 seconds.
- Shared response contracts and runtime validators exist under `packages/shared/src/simulationTypes.ts` and `packages/shared/src/simulationValidators.ts`.
- Backend tests cover validation, exact/next-available historical lookup, current price validation/cache behavior, and successful simulation math.
- Frontend API client, signed-in Simulation tab, local save behavior, and frontend metrics are the next implementation slice.
