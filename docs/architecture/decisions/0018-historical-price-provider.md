# ADR 0018: Historical Price Provider

## Status

Accepted

## Context

Simulation v1 needs USD historical prices for BTC, ETH, and SOL from 2021-01-01 through the latest common imported historical date for those assets. The existing Worker uses CoinMarketCap for current crypto market data, but the issue ledger identifies historical crypto data source selection as a high-severity blocker.

Free historical API access does not fit this MVP well. CoinGecko is attractive for simple historical-date lookup, but public/free historical access is limited for the product's date range. CoinMarketCap fits the existing provider code and stable numeric IDs, but historical quotes are not a free-tier feature. Both APIs remain useful future options, but neither should be the v1 source of truth for historical prices.

## Decision

Use a curated historical cryptocurrency CSV dataset as the v1 Historical Price Source. Normalize the dataset offline and store all valid dataset assets in Cloudflare D1 for low-latency Worker lookup.

The historical price store may contain more assets than the v1 product exposes. Simulation v1 remains product-limited to BTC, ETH, and SOL until a later product spec expands the supported-asset allowlist.

Runtime historical lookup will use D1, not the raw CSV. The Worker will query by supported asset and requested date. If the exact date is missing, the Worker may use the next available historical date after the requested date, capped at the latest common imported historical date for BTC, ETH, and SOL. Responses must include both `requestedDate` and `resolvedDate` so the UI can show when a next-available date was used.

The current/live price side of Simulation uses CoinGecko Simple Price through the Worker with a short runtime cache. Historical and current prices are separate data concerns: historical prices come from curated CSV rows in D1, while current prices come from CoinGecko at request time.

## Data Strategy

- Store raw downloaded CSV outside the runtime lookup path.
- Use the Python importer at `scripts/historical_prices/import_historical_prices.py` to normalize the dataset.
- Import normalized daily rows for every valid dataset asset into Cloudflare D1.
- Treat BTC, ETH, and SOL as required product-surface coverage gates.
- Keep the runtime table optimized for point lookup by asset/date.
- Optionally archive the raw CSV in Cloudflare R2 later for reproducibility.
- Keep Cloudflare KV for existing coarse fallback JSON such as listings, info, and latest ticker fallback data.

Recommended table shape:

```sql
CREATE TABLE historical_crypto_prices (
  asset_symbol TEXT NOT NULL,
  asset_name TEXT NOT NULL,
  date TEXT NOT NULL,
  open_usd REAL NOT NULL,
  high_usd REAL NOT NULL,
  low_usd REAL NOT NULL,
  close_usd REAL NOT NULL,
  volume_usd REAL NOT NULL,
  daily_return REAL,
  high_low_spread REAL,
  sma_7 REAL,
  sma_30 REAL,
  source_name TEXT NOT NULL,
  source_path TEXT NOT NULL,
  source_version TEXT NOT NULL,
  downloaded_at TEXT NOT NULL,
  imported_at TEXT NOT NULL,
  PRIMARY KEY (asset_symbol, date)
);
```

Next-available lookup should be explicit and bounded:

```sql
SELECT asset_symbol, date, close_usd, source_name, source_version
FROM historical_crypto_prices
WHERE asset_symbol = ?
  AND date >= ?
  AND date <= ?
ORDER BY date ASC
LIMIT 1;
```

The upper bound is the latest common imported historical date for BTC, ETH, and SOL.

## Fallback Behavior

When historical price data is requested:

- If an exact D1 row exists, return it with `dateResolution: "exact"`.
- If no exact row exists but a later row exists before or on the configured historical max date, return the later row with `dateResolution: "next_available"`.
- If no bounded row exists, return a typed unavailable response.
- Do not interpolate prices.
- Do not infer prices from current quotes.
- Do not silently use a different date.
- Do not expose unsupported assets outside BTC, ETH, and SOL.

The Simulation result must make Data Trust visible or inspectable, including historical source information and whether the resolved date differs from the requested date.

## Considered Options

### CoinGecko Primary Historical API

Rejected for v1. CoinGecko has straightforward historical endpoints and a free/Demo plan, but free historical access does not cover the full MVP range from 2021-01-01 through the imported dataset range. It remains a good candidate for a future paid or hybrid provider strategy.

### CoinMarketCap Primary Historical API

Rejected for v1. CoinMarketCap already powers current market data in the Worker and uses stable asset IDs, but historical quotes require paid access. It remains useful for current quotes and may become the historical provider if the project later pays for historical coverage.

### Runtime CSV Parsing

Rejected. Parsing the downloaded CSV during Worker requests would add latency, memory pressure, and validation complexity. Runtime should query normalized rows, not raw files.

### Kafka Or Databricks

Rejected for v1. The product needs deterministic daily point lookup for three assets, not high-volume event streaming or large analytics pipelines. These tools may be relevant later for broader analytics, but they would make the first prototype harder to operate without improving the user story.

## Consequences

- The first prototype is not blocked by paid historical API access.
- Historical Simulation behavior is deterministic and testable.
- The data layer can support future asset expansion without changing the v1 product surface.
- D1 becomes part of the Worker runtime architecture for Simulation.
- Dataset freshness and provenance must be documented during import.
- The app must label historical data as curated reference data, not live market data.
- Future provider replacement should preserve the Worker response contract so the mobile app does not depend on a specific data vendor.

## Implementation Notes

As of 2026-05-22:

- D1 database: `fintech-historical-prices`
- D1 database id: `cce18a99-efa1-463a-9958-1926e1ed6ad2`
- Worker binding: `HISTORICAL_PRICES_DB`
- Importer: `scripts/historical_prices/import_historical_prices.py`
- Import test: `scripts/historical_prices/test_import_historical_prices.py`
- Imported historical rows: `120740`
- Imported assets: `88`
- Rejected malformed non-product assets: `12`
- Imported date range: `2021-01-01` through `2026-03-22`
- Required product assets verified in D1: BTC, ETH, SOL
