# Historical Price Ingestion

## Status

Implemented for the 2026-05-22 dataset import.

## Goal

Make the historical price ingestion pipeline unambiguous so Simulation v1 can look up curated BTC, ETH, and SOL historical USD prices through Cloudflare D1.

This spec implements the data side of ADR 0018. Runtime requests must query normalized D1 rows, not parse raw CSV files.

## Source Dataset Shape

The source dataset lives under:

```text
crypto_data/
├── crypto_directory.csv
└── crypto_top100/
    ├── bitcoin_BTC.csv
    ├── ethereum_ETH.csv
    ├── solana_SOL.csv
    └── ... other top-100 asset files
```

`crypto_directory.csv` is the asset index. `crypto_top100/` contains one CSV per crypto asset.

V1 imports every valid asset listed in `crypto_directory.csv` with a matching file in
`crypto_top100/`. The product-facing Simulation MVP still exposes only BTC, ETH, and SOL, but the
runtime historical price store should be ready for later asset expansion.

BTC, ETH, and SOL are required coverage gates for the v1 product surface:

| Asset | Symbol | Required file |
| --- | --- | --- |
| Bitcoin | BTC | `crypto_top100/bitcoin_BTC.csv` |
| Ethereum | ETH | `crypto_top100/ethereum_ETH.csv` |
| Solana | SOL | `crypto_top100/solana_SOL.csv` |

Other valid dataset assets are imported but are not selectable in Simulation v1 unless a later
product spec expands the supported-asset allowlist.

## Required Source Columns

Each imported asset CSV must contain these columns:

| Column | Type | Required behavior |
| --- | --- | --- |
| `Date` | date | Trading date. The source may include UTC timestamp text such as `YYYY-MM-DD 00:00:00+00:00`; the importer normalizes it to `YYYY-MM-DD`. |
| `Open` | float | Asset price at market open, 00:00 UTC. |
| `High` | float | Highest price during the trading day. |
| `Low` | float | Lowest price during the trading day. |
| `Close` | float | Asset price at market close, 23:59 UTC. Used for Simulation math. |
| `Volume` | integer | Total traded value during the day in USD. |
| `Daily_Return` | float | Percentage change in close price compared to the previous day. |
| `High_Low_Spread` | float | `High - Low`, used as an intraday volatility measure. |
| `SMA_7` | float | 7-day simple moving average. |
| `SMA_30` | float | 30-day simple moving average. |

V1 stores all required columns. Simulation v1 uses `Close` as the historical price for purchase math; the other columns are retained for dataset fidelity, future analysis, validation, and offline Python charting/reporting.

## Date Range

The import targets the full available date range already present in each static CSV through the latest configured historical date, stored as UTC calendar dates. The current dataset supports `2026-03-22`.

Rows before the prior `2021-01-01` floor are now imported when they pass data-quality checks. The importer preserves raw CSV files, applies an auditable data-quality manifest, uses deterministic same-row OHLC repairs only, quarantines unrecoverable rows, and marks assets ready only when they have at least 365 valid daily rows and no more than 10% quarantined rows.

## Asset Identity Validation

Asset identity must be cross-checked in two places:

- `crypto_directory.csv` must list each imported asset.
- Each imported asset file must exist and follow `{slug}_{SYMBOL}.csv`.
- BTC, ETH, and SOL must be present because they are required by the v1 product surface.

The importer must fail if:

- a file required by a listed asset is missing.
- BTC, ETH, or SOL is missing from `crypto_directory.csv`.
- an imported file symbol does not match its directory entry.
- an imported file contains a symbol/name mismatch if symbol/name columns are present.

## Normalized D1 Schema

Runtime lookup uses a D1 table optimized for asset/date point lookup and next-available date lookup.

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

Recommended supporting index:

```sql
CREATE INDEX idx_historical_crypto_prices_lookup
ON historical_crypto_prices (asset_symbol, date);
```

## Provenance Table

Each import run must write one provenance record.

```sql
CREATE TABLE historical_price_imports (
  import_id TEXT PRIMARY KEY,
  source_name TEXT NOT NULL,
  source_url TEXT NOT NULL,
  source_version TEXT NOT NULL,
  source_root_path TEXT NOT NULL,
  downloaded_at TEXT NOT NULL,
  imported_at TEXT NOT NULL,
  imported_assets TEXT NOT NULL,
  product_supported_assets TEXT NOT NULL,
  imported_row_count INTEGER NOT NULL,
  rejected_row_count INTEGER NOT NULL,
  coverage_report_json TEXT NOT NULL
);
```

`coverage_report_json` must include per-asset:

- first imported date.
- last imported date.
- imported row count.
- missing date count.
- largest gap in calendar days.
- whether next-available resolution can be needed.

## Validation Rules

The importer must fail before writing runtime rows if an error affects BTC, ETH, SOL, import
provenance, or the runtime table as a whole:

- any required source column is missing.
- any required asset identity check fails.
- any product-surface asset `Date` cannot be normalized to `YYYY-MM-DD`.
- any product-surface asset numeric field cannot be parsed.
- `Open`, `High`, `Low`, or `Close` is less than or equal to `0`.
- `High` is lower than `Low`.
- `Close` is outside the inclusive `Low` to `High` range.
- `Volume` is negative.
- duplicate rows exist for the same asset/date.
- a required product asset has no valid imported rows.
- a required asset does not have coverage through the configured import end date.
- any missing-date gap inside the import range is more than 3 calendar days.

For non-product assets, row-level or file-level validation failures may skip that asset instead of
failing the whole import. Skipped assets must be included in provenance with the rejection reason.

The importer may allow:

- isolated missing dates when the next available date is within 3 calendar days.
- null or blank derived analytics fields only when the source cannot compute them for early rolling-window rows.

Allowed missing derived analytics must be stored as `NULL`, not `0`.

## Coverage Gaps

Runtime behavior follows ADR 0018:

- exact asset/date row returns `dateResolution: "exact"`.
- missing asset/date may resolve to the next available date.
- next available date must be no more than 3 calendar days after the requested date.
- next available date must be no later than the configured import end date.
- unavailable is returned when no bounded next date exists.

The response must include:

- `requestedDate`
- `resolvedDate`
- `dateResolution`

The UI must not hide a date adjustment.

## Import Command Shape

Implementation should provide a repeatable Python command with this shape:

```bash
/Users/shubhkapadia/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3 \
  scripts/historical_prices/import_historical_prices.py \
  --source-root ./data/crypto_data \
  --source-name "Top 100 Cryptocurrency Historical Prices" \
  --source-url "<dataset-url>" \
  --source-version "<dataset-version-or-download-date>" \
  --downloaded-at "<ISO-8601 timestamp>" \
  --output-sql ./tmp/historical_prices/historical_crypto_prices.sql \
  --output-report ./tmp/historical_prices/coverage_report.json
```

The command must:

- validate source structure.
- normalize every valid dataset asset.
- enforce BTC, ETH, and SOL as required product-surface assets.
- generate D1-compatible SQL.
- write provenance into the SQL and report.
- print the coverage report.
- exit non-zero on validation failure.

For production D1 import, the generated SQL should be applied with Wrangler, using the repo's backend package scripts or direct Wrangler command once D1 binding exists.

Current production import command:

```bash
./node_modules/.bin/wrangler d1 execute fintech-historical-prices \
  --remote \
  --file tmp/historical_prices/historical_crypto_prices.sql
```

Current production D1 binding:

```text
HISTORICAL_PRICES_DB -> fintech-historical-prices
database_id: cce18a99-efa1-463a-9958-1926e1ed6ad2
```

The generated SQL intentionally does not wrap all statements in `BEGIN TRANSACTION` / `COMMIT`; Wrangler D1 remote import handles the execution boundary and rejects explicit transaction wrappers in this file path.

## Verification Queries

After import, verify row counts:

```sql
SELECT asset_symbol, COUNT(*) AS row_count, MIN(date) AS first_date, MAX(date) AS last_date
FROM historical_crypto_prices
GROUP BY asset_symbol
ORDER BY asset_symbol;
```

Verify imported asset set:

```sql
SELECT DISTINCT asset_symbol
FROM historical_crypto_prices
ORDER BY asset_symbol;
```

Expected: all valid dataset symbols are present. BTC, ETH, and SOL must be present.

Verify point lookup:

```sql
SELECT asset_symbol, date, close_usd
FROM historical_crypto_prices
WHERE asset_symbol = 'BTC'
  AND date >= '2014-09-17'
  AND date <= '<historical-max-date>'
ORDER BY date ASC
LIMIT 1;
```

Verify provenance:

```sql
SELECT source_name, source_version, imported_row_count, rejected_row_count, imported_at
FROM historical_price_imports
ORDER BY imported_at DESC
LIMIT 1;
```

## Verified Import Result

The 2026-06-09 full-available-history import was applied to remote D1 and verified with Wrangler.

| Check | Result |
| --- | --- |
| Historical rows | `176348` |
| Imported historical assets | `98` |
| Ready asset catalog entries | `84` |
| Unavailable asset catalog entries | `16` |
| Repaired source rows | `6` |
| Quarantined source rows | `789` |
| Rejected assets | `0` |
| First imported date | `2014-09-17` |
| Last imported date | `2026-03-22` |
| Required product assets | BTC, ETH, SOL present |

Verified product rows for `2026-03-22`:

| Asset | Close USD |
| --- | ---: |
| BTC | `68908.2109375` |
| ETH | `2086.3818359375` |
| SOL | `87.25032043457031` |

## Incomplete Coverage Behavior

If the dataset has missing or invalid rows inside the configured import range:

- apply deterministic same-row OHLC repairs only when the manifest documents the exact row, reason, method, and replacement values.
- quarantine unrecoverable rows instead of interpolating or fabricating market prices.
- mark an asset ready only when it has at least 365 valid imported rows and no more than 10% quarantined rows.
- expose repaired and quarantined counts in generated metadata and `/api/simulation/assets`.

For non-product assets, malformed files or coverage gaps should be reported per asset. Assets that
do not meet the readiness threshold remain in the unavailable catalog with a recruiter/user-readable
reason rather than being silently dropped.

Allowed gaps do not change Simulation semantics. The Worker must still return the requested date and resolved date whenever next-available resolution is used.

## Definition Of Done

This ingestion plan is complete when a future implementer knows:

- which dataset folder shape is required.
- which assets are imported.
- which imported assets are product-selectable in v1.
- which source columns are required.
- which D1 tables are needed.
- which validations fail the import.
- which gaps are tolerated.
- how provenance is stored.
- how to run and verify the import.
