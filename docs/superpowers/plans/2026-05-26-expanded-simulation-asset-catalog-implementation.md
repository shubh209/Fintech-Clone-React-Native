# Expanded Simulation Asset Catalog Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand Simulation from 3 hard-coded assets to a backend-owned catalog for the 100 CSV-listed assets, with simulation-ready search, unavailable explanations, and `assetId`-based APIs.

**Architecture:** Add a D1 `simulation_assets` metadata table generated from the historical importer, then expose it through a Worker `/api/simulation/assets` endpoint enriched by cached CoinGecko Demo `/coins/markets` data. The frontend consumes that endpoint through shared validators and replaces the BTC/ETH/SOL selector with a full-screen searchable picker while preserving the existing single-asset simulation flow.

**Tech Stack:** Expo Router, React Native, React Query, Cloudflare Workers, Hono, D1, TypeScript, Python importer, Jest, local metrics helpers, CoinGecko Demo API.

---

## Scope Check

This plan covers one implementation slice: expanded asset catalog and asset picker integration. It intentionally excludes purchasing-power comparison, multi-asset comparison, portfolio baskets, and full market screener filters.

The 12 currently invalid CSV assets are not repaired here. They are represented in `simulation_assets` as unavailable assets with friendly and technical reasons.

## File Structure

Backend/shared files:

- Create `packages/shared/src/simulationAssetCatalogTypes.ts`: public asset catalog response and row types.
- Create `packages/shared/src/simulationAssetCatalogValidators.ts`: runtime validation for `/api/simulation/assets`.
- Modify `packages/shared/src/index.ts`: export catalog types and validators.
- Create `apps/backend/migrations/0002_simulation_assets.sql`: D1 metadata table.
- Create `scripts/historical_prices/asset_categories.json`: manual category and optional display overrides for the 100 CSV assets.
- Modify `scripts/historical_prices/import_historical_prices.py`: emit `simulation_assets` SQL rows and report all 100 asset statuses.
- Modify `scripts/historical_prices/test_import_historical_prices.py`: cover asset metadata generation.
- Create `apps/backend/src/domains/simulation/simulationAssetRepository.ts`: D1 reads for catalog items and asset ID lookup.
- Create `apps/backend/src/domains/simulation/coinGeckoMarketsClient.ts`: CoinGecko `/coins/markets` client.
- Create `apps/backend/src/domains/simulation/simulationMarketCache.ts`: fresh/stale cache for market rows.
- Create `apps/backend/src/domains/simulation/simulationAssetsService.ts`: combines D1 metadata and market enrichment.
- Modify `apps/backend/src/domains/simulation/simulationRoutes.ts`: add `/assets`, pass `assetId` params.
- Modify `apps/backend/src/domains/simulation/simulationPriceService.ts`: canonical `assetId`, temporary symbol compatibility, stale price acceptance.
- Modify `apps/backend/src/domains/simulation/simulationHistoryService.ts`: canonical `assetId`, temporary symbol compatibility.
- Modify `apps/backend/src/domains/simulation/historicalPriceRepository.ts`: keep symbol lookup, no public contract changes.
- Modify `apps/backend/src/types.ts`: no new binding needed, but tests may need D1 statement shape updates.
- Create backend tests under `apps/backend/__tests__/simulation/` and `apps/backend/__tests__/api/`.

Frontend files:

- Create `apps/frontend/src/features/simulation/api/getSimulationAssets.ts`: catalog client.
- Create `apps/frontend/src/features/simulation/assets/filterSimulationAssets.ts`: search/filter/sort helpers.
- Create `apps/frontend/src/features/simulation/components/simulationAssetPicker.tsx`: full-screen picker component.
- Modify `apps/frontend/src/features/simulation/api/getSimulationPrice.ts`: send `assetId`.
- Modify `apps/frontend/src/features/simulation/api/getSimulationHistory.ts`: send `assetId`.
- Modify `apps/frontend/src/features/simulation/storage/savedSimulationsStore.ts`: hybrid asset metadata snapshot.
- Modify `apps/frontend/src/features/simulation/screens/simulationScreen.tsx`: replace segmented selector with catalog picker.
- Add focused frontend tests beside the touched files.

Docs:

- Modify `docs/project-reference/architecture.md`.
- Modify `docs/project-reference/issues.md`.
- Modify `docs/project-reference/metrics.md`.
- Modify `docs/project-reference/troubleshooting.md`.

## Task 1: Add Shared Asset Catalog Contracts

**Files:**
- Create: `packages/shared/src/simulationAssetCatalogTypes.ts`
- Create: `packages/shared/src/simulationAssetCatalogValidators.ts`
- Modify: `packages/shared/src/index.ts`
- Test: `apps/frontend/src/shared/api/simulationAssetCatalogValidators.test.ts`

- [ ] **Step 1: Write failing validator tests**

Create `apps/frontend/src/shared/api/simulationAssetCatalogValidators.test.ts`:

```ts
import {
  isSimulationAssetCatalogResponse,
  isSimulationAssetCatalogItem,
} from '@/shared/api/simulationAssetCatalogValidators';

const readyAsset = {
  assetId: 'bitcoin',
  symbol: 'BTC',
  name: 'Bitcoin',
  category: 'Layer 1',
  status: 'ready',
  historical: {
    firstDate: '2021-01-01',
    lastDate: '2026-03-22',
    rowCount: 1906,
    missingDateCount: 1,
    largestGapDays: 2,
  },
  market: {
    coinGeckoId: 'bitcoin',
    rank: 1,
    imageUrl: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png',
    currentPriceUsd: 77000,
    priceChangePercentage24h: -1.5,
    updatedAt: '2026-05-26T00:00:00.000Z',
    status: 'fresh',
  },
  availability: {
    canSimulate: true,
    reason: null,
    detail: null,
  },
};

describe('simulation asset catalog validators', () => {
  it('accepts a ready catalog item', () => {
    expect(isSimulationAssetCatalogItem(readyAsset)).toBe(true);
  });

  it('accepts split ready and unavailable asset lists', () => {
    expect(
      isSimulationAssetCatalogResponse({
        status: 'success',
        assets: {
          ready: [readyAsset],
          unavailable: [
            {
              ...readyAsset,
              assetId: 'sui',
              symbol: 'SUI',
              name: 'sui',
              status: 'historical_invalid',
              market: {
                ...readyAsset.market,
                coinGeckoId: null,
                rank: null,
                imageUrl: null,
                currentPriceUsd: null,
                priceChangePercentage24h: null,
                updatedAt: null,
                status: 'unavailable',
              },
              availability: {
                canSimulate: false,
                reason: 'Historical data needs validation.',
                detail: 'SUI has non-positive OHLC values',
              },
            },
          ],
        },
        source: {
          historicalProvider: 'historical_csv',
          marketProvider: 'coingecko',
          importedAt: '2026-05-22T21:42:05.428Z',
          marketDataUpdatedAt: '2026-05-26T00:00:00.000Z',
          marketCacheStatus: 'fresh',
        },
      })
    ).toBe(true);
  });

  it('rejects invalid status and negative current price', () => {
    expect(
      isSimulationAssetCatalogItem({
        ...readyAsset,
        status: 'enabled',
      })
    ).toBe(false);

    expect(
      isSimulationAssetCatalogItem({
        ...readyAsset,
        market: { ...readyAsset.market, currentPriceUsd: -1 },
      })
    ).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests to verify failure**

Run:

```bash
./node_modules/.bin/jest --runTestsByPath apps/frontend/src/shared/api/simulationAssetCatalogValidators.test.ts --runInBand --watchman=false
```

Expected: fails because catalog validators do not exist.

- [ ] **Step 3: Add shared catalog types**

Create `packages/shared/src/simulationAssetCatalogTypes.ts`:

```ts
export type SimulationAssetCatalogStatus =
  | 'ready'
  | 'needs_market_mapping'
  | 'historical_invalid';

export type SimulationAssetMarketStatus = 'fresh' | 'stale' | 'unavailable';
export type SimulationAssetMarketCacheStatus = 'fresh' | 'stale' | 'unavailable';

export interface SimulationAssetCatalogItem {
  assetId: string;
  symbol: string;
  name: string;
  category: string;
  status: SimulationAssetCatalogStatus;
  historical: {
    firstDate: string | null;
    lastDate: string | null;
    rowCount: number;
    missingDateCount: number;
    largestGapDays: number;
  };
  market: {
    coinGeckoId: string | null;
    rank: number | null;
    imageUrl: string | null;
    currentPriceUsd: number | null;
    priceChangePercentage24h: number | null;
    updatedAt: string | null;
    status: SimulationAssetMarketStatus;
  };
  availability: {
    canSimulate: boolean;
    reason: string | null;
    detail: string | null;
  };
}

export interface SimulationAssetCatalogSuccessResponse {
  status: 'success';
  assets: {
    ready: SimulationAssetCatalogItem[];
    unavailable: SimulationAssetCatalogItem[];
  };
  source: {
    historicalProvider: 'historical_csv';
    marketProvider: 'coingecko';
    importedAt: string;
    marketDataUpdatedAt: string | null;
    marketCacheStatus: SimulationAssetMarketCacheStatus;
  };
}

export interface SimulationAssetCatalogErrorResponse {
  status: 'error';
  code: 'simulation_assets_unavailable';
  message: string;
}

export type SimulationAssetCatalogResponse =
  | SimulationAssetCatalogSuccessResponse
  | SimulationAssetCatalogErrorResponse;
```

- [ ] **Step 4: Add shared validators**

Create `packages/shared/src/simulationAssetCatalogValidators.ts`:

```ts
import {
  SimulationAssetCatalogItem,
  SimulationAssetCatalogResponse,
  SimulationAssetCatalogStatus,
  SimulationAssetMarketCacheStatus,
  SimulationAssetMarketStatus,
} from './simulationAssetCatalogTypes';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function isNullableString(value: unknown): value is string | null {
  return value === null || isString(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isNonNegativeInteger(value: unknown): value is number {
  return Number.isInteger(value) && value >= 0;
}

function isNullablePositiveNumber(value: unknown): value is number | null {
  return value === null || (isFiniteNumber(value) && value > 0);
}

function isNullableFiniteNumber(value: unknown): value is number | null {
  return value === null || isFiniteNumber(value);
}

function isCatalogStatus(value: unknown): value is SimulationAssetCatalogStatus {
  return value === 'ready' || value === 'needs_market_mapping' || value === 'historical_invalid';
}

function isMarketStatus(value: unknown): value is SimulationAssetMarketStatus {
  return value === 'fresh' || value === 'stale' || value === 'unavailable';
}

function isMarketCacheStatus(value: unknown): value is SimulationAssetMarketCacheStatus {
  return value === 'fresh' || value === 'stale' || value === 'unavailable';
}

export function isSimulationAssetCatalogItem(value: unknown): value is SimulationAssetCatalogItem {
  if (!isRecord(value)) return false;
  if (!isString(value.assetId) || !isString(value.symbol) || !isString(value.name)) return false;
  if (!isString(value.category) || !isCatalogStatus(value.status)) return false;

  const historical = value.historical;
  if (!isRecord(historical)) return false;
  if (!isNullableString(historical.firstDate) || !isNullableString(historical.lastDate)) return false;
  if (!isNonNegativeInteger(historical.rowCount)) return false;
  if (!isNonNegativeInteger(historical.missingDateCount)) return false;
  if (!isNonNegativeInteger(historical.largestGapDays)) return false;

  const market = value.market;
  if (!isRecord(market)) return false;
  if (!isNullableString(market.coinGeckoId) || !isNullableString(market.imageUrl)) return false;
  if (!isNullableFiniteNumber(market.rank)) return false;
  if (!isNullablePositiveNumber(market.currentPriceUsd)) return false;
  if (!isNullableFiniteNumber(market.priceChangePercentage24h)) return false;
  if (!isNullableString(market.updatedAt) || !isMarketStatus(market.status)) return false;

  const availability = value.availability;
  if (!isRecord(availability)) return false;
  return (
    typeof availability.canSimulate === 'boolean' &&
    isNullableString(availability.reason) &&
    isNullableString(availability.detail)
  );
}

export function isSimulationAssetCatalogResponse(
  value: unknown
): value is SimulationAssetCatalogResponse {
  if (!isRecord(value)) return false;

  if (value.status === 'error') {
    return value.code === 'simulation_assets_unavailable' && isString(value.message);
  }

  if (value.status !== 'success') return false;

  const assets = value.assets;
  if (!isRecord(assets) || !Array.isArray(assets.ready) || !Array.isArray(assets.unavailable)) {
    return false;
  }

  const source = value.source;
  if (!isRecord(source)) return false;

  return (
    assets.ready.every(isSimulationAssetCatalogItem) &&
    assets.unavailable.every(isSimulationAssetCatalogItem) &&
    source.historicalProvider === 'historical_csv' &&
    source.marketProvider === 'coingecko' &&
    isString(source.importedAt) &&
    isNullableString(source.marketDataUpdatedAt) &&
    isMarketCacheStatus(source.marketCacheStatus)
  );
}
```

- [ ] **Step 5: Export types and validators**

Modify `packages/shared/src/index.ts`:

```ts
export * from './apiResult';
export * from './cryptoValidators';
export * from './simulationTypes';
export * from './simulationValidators';
export * from './simulationAssetCatalogTypes';
export * from './simulationAssetCatalogValidators';
```

Create `apps/frontend/src/shared/api/simulationAssetCatalogValidators.ts`:

```ts
export {
  isSimulationAssetCatalogItem,
  isSimulationAssetCatalogResponse,
} from '@shared/simulationAssetCatalogValidators';
```

- [ ] **Step 6: Run validator tests**

Run:

```bash
./node_modules/.bin/jest --runTestsByPath apps/frontend/src/shared/api/simulationAssetCatalogValidators.test.ts --runInBand --watchman=false
```

Expected: pass.

- [ ] **Step 7: Commit**

```bash
git add packages/shared/src/simulationAssetCatalogTypes.ts packages/shared/src/simulationAssetCatalogValidators.ts packages/shared/src/index.ts apps/frontend/src/shared/api/simulationAssetCatalogValidators.ts apps/frontend/src/shared/api/simulationAssetCatalogValidators.test.ts
git commit -m "feat: add simulation asset catalog contracts"
```

## Task 2: Generate Simulation Asset Metadata

**Files:**
- Create: `apps/backend/migrations/0002_simulation_assets.sql`
- Create: `scripts/historical_prices/asset_categories.json`
- Modify: `scripts/historical_prices/import_historical_prices.py`
- Modify: `scripts/historical_prices/test_import_historical_prices.py`

- [ ] **Step 1: Add D1 metadata migration**

Create `apps/backend/migrations/0002_simulation_assets.sql`:

```sql
CREATE TABLE IF NOT EXISTS simulation_assets (
  asset_id TEXT PRIMARY KEY,
  symbol TEXT NOT NULL,
  name TEXT NOT NULL,
  csv_file_name TEXT NOT NULL,
  category TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('ready', 'needs_market_mapping', 'historical_invalid')),
  historical_symbol TEXT NOT NULL,
  first_imported_date TEXT,
  last_imported_date TEXT,
  imported_row_count INTEGER NOT NULL DEFAULT 0,
  missing_date_count INTEGER NOT NULL DEFAULT 0,
  largest_gap_days INTEGER NOT NULL DEFAULT 0,
  unavailable_reason TEXT,
  unavailable_detail TEXT,
  coin_gecko_id TEXT,
  imported_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_simulation_assets_status_rank
ON simulation_assets (status, symbol);

CREATE INDEX IF NOT EXISTS idx_simulation_assets_historical_symbol
ON simulation_assets (historical_symbol);
```

- [ ] **Step 2: Add manual category mapping**

Create `scripts/historical_prices/asset_categories.json`.

Use this initial complete shape and fill every symbol from `crypto_directory.csv`; categories can be conservative:

```json
{
  "BTC": "Layer 1",
  "ETH": "Layer 1",
  "USDT": "Stablecoin",
  "XRP": "Crypto",
  "BNB": "Exchange Token",
  "USDC": "Stablecoin",
  "SOL": "Layer 1",
  "TRX": "Layer 1",
  "DOGE": "Meme",
  "USDS": "Stablecoin",
  "WBT": "Exchange Token",
  "ADA": "Layer 1",
  "HYPE": "DeFi",
  "BCH": "Crypto",
  "LEO": "Exchange Token",
  "XMR": "Privacy",
  "LINK": "Oracle",
  "USDE": "Stablecoin",
  "CC": "Crypto",
  "XLM": "Crypto",
  "USD1": "Stablecoin",
  "DAI": "Stablecoin",
  "LTC": "Crypto",
  "PYUSD": "Stablecoin",
  "AVAX": "Layer 1",
  "RAIN": "Other",
  "HBAR": "Layer 1",
  "ZEC": "Privacy",
  "SUI": "Layer 1",
  "SHIB": "Meme",
  "CRO": "Exchange Token",
  "TON": "Layer 1",
  "M": "Other",
  "WLFI": "DeFi",
  "XAUT": "Tokenized Asset",
  "DOT": "Layer 1",
  "MNT": "Layer 2",
  "PAXG": "Tokenized Asset",
  "UNI": "DeFi",
  "BUIDL": "Tokenized Asset",
  "PI": "Crypto",
  "OKB": "Exchange Token",
  "USDG": "Stablecoin",
  "USDF": "Stablecoin",
  "SKY": "DeFi",
  "NEAR": "Layer 1",
  "AAVE": "DeFi",
  "ASTER": "DeFi",
  "HTX": "Exchange Token",
  "RLUSD": "Stablecoin",
  "BGB": "Exchange Token",
  "PEPE": "Meme",
  "ICP": "Layer 1",
  "BFUSD": "Stablecoin",
  "USDY": "Tokenized Asset",
  "ETC": "Layer 1",
  "ONDO": "Tokenized Asset",
  "GT": "Exchange Token",
  "QNT": "Crypto",
  "KCS": "Exchange Token",
  "POL": "Layer 2",
  "KAS": "Layer 1",
  "MORPHO": "DeFi",
  "WLD": "Crypto",
  "ATOM": "Layer 1",
  "NEXO": "DeFi",
  "RENDER": "Crypto",
  "ENA": "DeFi",
  "USDTB": "Stablecoin",
  "APT": "Layer 1",
  "ALGO": "Layer 1",
  "HASH": "Other",
  "TRUMP": "Meme",
  "USDD": "Stablecoin",
  "NIGHT": "Other",
  "OUSG": "Tokenized Asset",
  "FLR": "Layer 1",
  "SIREN": "Other",
  "FIL": "Crypto",
  "XDC": "Layer 1",
  "BDX": "Privacy",
  "VET": "Layer 1",
  "GHO": "Stablecoin",
  "ARB": "Layer 2",
  "USD0": "Stablecoin",
  "JUP": "DeFi",
  "STABLE": "Stablecoin",
  "JST": "DeFi",
  "BONK": "Meme",
  "RIVER": "Other",
  "TUSD": "Stablecoin",
  "ZRO": "Crypto",
  "FET": "Crypto",
  "A7A5": "Stablecoin",
  "FTN": "Crypto",
  "ETHFI": "DeFi",
  "CAKE": "DeFi",
  "VIRTUAL": "Crypto",
  "STX": "Layer 2",
  "PENGU": "Meme"
}
```

- [ ] **Step 3: Write failing importer metadata tests**

Add tests to `scripts/historical_prices/test_import_historical_prices.py`:

```python
def test_build_import_reports_all_directory_assets_in_metadata(tmp_path):
    source_root = make_source_root(tmp_path)
    write_directory(source_root, [
        ("bitcoin", "bitcoin_BTC.csv"),
        ("broken", "broken_BAD.csv"),
    ])
    write_valid_csv(source_root / "crypto_top100" / "bitcoin_BTC.csv", "2021-01-01", "2021-01-03")
    write_invalid_csv_missing_open(source_root / "crypto_top100" / "broken_BAD.csv")

    result = build_import(
        source_root=source_root,
        source_name="Test source",
        source_url="https://example.com",
        source_version="test",
        downloaded_at="2026-05-22T00:00:00.000Z",
        output_sql=tmp_path / "out.sql",
        output_report=tmp_path / "report.json",
        imported_at="2026-05-22T00:00:00.000Z",
        end_date=date(2021, 1, 3),
        category_map={"BTC": "Layer 1", "BAD": "Other"},
        required_product_symbols={"BTC"},
    )

    report = json.loads((tmp_path / "report.json").read_text())
    assets = {asset["asset_id"]: asset for asset in report["simulation_assets"]}
    assert assets["bitcoin"]["status"] == "ready"
    assert assets["broken"]["status"] == "historical_invalid"
    assert assets["broken"]["unavailable_reason"] == "Historical data needs validation."
    assert "Open is required" in assets["broken"]["unavailable_detail"]
    assert result.imported_row_count == 3
```

If helper names differ in the existing test file, add explicit helper functions in that test file rather than reusing unclear fixtures.

- [ ] **Step 4: Run importer tests to verify failure**

Run:

```bash
/Users/shubhkapadia/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3 -m unittest scripts/historical_prices/test_import_historical_prices.py
```

Expected: fail because `category_map`, `required_product_symbols`, and `simulation_assets` report output do not exist.

- [ ] **Step 5: Implement metadata generation**

Modify `scripts/historical_prices/import_historical_prices.py`:

```python
@dataclass(frozen=True)
class SimulationAssetMetadata:
    asset_id: str
    symbol: str
    name: str
    csv_file_name: str
    category: str
    status: str
    historical_symbol: str
    first_imported_date: str | None
    last_imported_date: str | None
    imported_row_count: int
    missing_date_count: int
    largest_gap_days: int
    unavailable_reason: str | None
    unavailable_detail: str | None
    coin_gecko_id: str | None
    imported_at: str
    updated_at: str


def _asset_id_from_file_name(file_name: str) -> str:
    stem = Path(file_name).stem
    if "_" not in stem:
        return stem
    return stem.rsplit("_", 1)[0]
```

Add a function that builds one metadata row per directory entry:

```python
def _build_simulation_asset_metadata(
    entries: list[DirectoryEntry],
    coverage: list[CoverageReport],
    skipped_assets: list[SkippedAsset],
    category_map: dict[str, str],
    imported_at: str,
) -> list[SimulationAssetMetadata]:
    coverage_by_symbol = {item.asset_symbol: item for item in coverage}
    skipped_by_symbol = {item.asset_symbol: item for item in skipped_assets}
    metadata: list[SimulationAssetMetadata] = []

    for entry in entries:
        asset_id = _asset_id_from_file_name(entry.file_name)
        asset_coverage = coverage_by_symbol.get(entry.symbol)
        skipped = skipped_by_symbol.get(entry.symbol)
        status = "ready" if asset_coverage else "historical_invalid"
        metadata.append(
            SimulationAssetMetadata(
                asset_id=asset_id,
                symbol=entry.symbol,
                name=entry.asset_name,
                csv_file_name=entry.file_name,
                category=category_map.get(entry.symbol, "Other"),
                status=status,
                historical_symbol=entry.symbol,
                first_imported_date=asset_coverage.first_imported_date if asset_coverage else None,
                last_imported_date=asset_coverage.last_imported_date if asset_coverage else None,
                imported_row_count=asset_coverage.imported_row_count if asset_coverage else 0,
                missing_date_count=asset_coverage.missing_date_count if asset_coverage else 0,
                largest_gap_days=asset_coverage.largest_gap_days if asset_coverage else 0,
                unavailable_reason=None if asset_coverage else "Historical data needs validation.",
                unavailable_detail=skipped.reason if skipped else None,
                coin_gecko_id=asset_id if asset_coverage else None,
                imported_at=imported_at,
                updated_at=imported_at,
            )
        )

    return metadata
```

Add a `category_map` argument to `build_import`, load `asset_categories.json` in `main`, and include `simulation_assets` in the JSON report.

Extend `_write_sql` to write:

```python
handle.write("DELETE FROM simulation_assets;\n")
for asset in report["simulation_assets"]:
    columns = [
        "asset_id",
        "symbol",
        "name",
        "csv_file_name",
        "category",
        "status",
        "historical_symbol",
        "first_imported_date",
        "last_imported_date",
        "imported_row_count",
        "missing_date_count",
        "largest_gap_days",
        "unavailable_reason",
        "unavailable_detail",
        "coin_gecko_id",
        "imported_at",
        "updated_at",
    ]
    values = ", ".join(_sql_quote(asset[column]) for column in columns)
    handle.write(f"INSERT INTO simulation_assets ({', '.join(columns)}) VALUES ({values});\n")
```

- [ ] **Step 6: Run importer tests**

Run:

```bash
/Users/shubhkapadia/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3 -m unittest scripts/historical_prices/test_import_historical_prices.py
```

Expected: pass.

- [ ] **Step 7: Regenerate import SQL and report**

Run:

```bash
/Users/shubhkapadia/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3 \
  scripts/historical_prices/import_historical_prices.py \
  --source-root ./data/crypto_data \
  --source-name "Top 100 Cryptocurrency Historical Prices" \
  --source-url "local_csv_dataset" \
  --source-version "2026-05-22" \
  --downloaded-at "2026-05-22T00:00:00.000Z" \
  --end-date 2026-03-22 \
  --output-sql ./tmp/historical_prices/historical_crypto_prices.sql \
  --output-report ./tmp/historical_prices/coverage_report.json
```

Expected: report includes `simulation_assets` with 100 entries, 88 `ready`, 12 `historical_invalid`.

- [ ] **Step 8: Commit**

```bash
git add apps/backend/migrations/0002_simulation_assets.sql scripts/historical_prices/asset_categories.json scripts/historical_prices/import_historical_prices.py scripts/historical_prices/test_import_historical_prices.py tmp/historical_prices/coverage_report.json tmp/historical_prices/historical_crypto_prices.sql
git commit -m "feat: generate simulation asset metadata"
```

## Task 3: Add Backend Catalog Repository

**Files:**
- Create: `apps/backend/src/domains/simulation/simulationAssetRepository.ts`
- Test: `apps/backend/__tests__/simulation/simulationAssetRepository.test.ts`

- [ ] **Step 1: Write failing repository tests**

Create `apps/backend/__tests__/simulation/simulationAssetRepository.test.ts`:

```ts
import {
  findSimulationAssetByAssetId,
  listSimulationAssets,
} from '../../src/domains/simulation/simulationAssetRepository';

function createStatement(results: unknown[]) {
  return {
    bind: jest.fn().mockReturnThis(),
    first: jest.fn(async () => results[0] ?? null),
    all: jest.fn(async () => ({ results })),
    run: jest.fn(),
  };
}

describe('simulationAssetRepository', () => {
  it('lists ready and unavailable asset metadata rows', async () => {
    const statement = createStatement([
      {
        asset_id: 'bitcoin',
        symbol: 'BTC',
        name: 'bitcoin',
        csv_file_name: 'bitcoin_BTC.csv',
        category: 'Layer 1',
        status: 'ready',
        historical_symbol: 'BTC',
        first_imported_date: '2021-01-01',
        last_imported_date: '2026-03-22',
        imported_row_count: 1906,
        missing_date_count: 1,
        largest_gap_days: 2,
        unavailable_reason: null,
        unavailable_detail: null,
        coin_gecko_id: 'bitcoin',
        imported_at: '2026-05-22T00:00:00.000Z',
        updated_at: '2026-05-22T00:00:00.000Z',
      },
    ]);
    const db = { prepare: jest.fn(() => statement) };

    const rows = await listSimulationAssets({ db });

    expect(db.prepare).toHaveBeenCalledWith(expect.stringContaining('FROM simulation_assets'));
    expect(rows[0].assetId).toBe('bitcoin');
    expect(rows[0].historicalSymbol).toBe('BTC');
  });

  it('finds an asset by assetId', async () => {
    const statement = createStatement([
      {
        asset_id: 'ethereum',
        symbol: 'ETH',
        name: 'ethereum',
        csv_file_name: 'ethereum_ETH.csv',
        category: 'Layer 1',
        status: 'ready',
        historical_symbol: 'ETH',
        first_imported_date: '2021-01-01',
        last_imported_date: '2026-03-22',
        imported_row_count: 1906,
        missing_date_count: 1,
        largest_gap_days: 2,
        unavailable_reason: null,
        unavailable_detail: null,
        coin_gecko_id: 'ethereum',
        imported_at: '2026-05-22T00:00:00.000Z',
        updated_at: '2026-05-22T00:00:00.000Z',
      },
    ]);

    const asset = await findSimulationAssetByAssetId({
      db: { prepare: jest.fn(() => statement) },
      assetId: 'ethereum',
    });

    expect(asset?.symbol).toBe('ETH');
    expect(statement.bind).toHaveBeenCalledWith('ethereum');
  });
});
```

- [ ] **Step 2: Run tests to verify failure**

```bash
./node_modules/.bin/jest --runTestsByPath apps/backend/__tests__/simulation/simulationAssetRepository.test.ts --runInBand --watchman=false
```

Expected: fail because repository does not exist.

- [ ] **Step 3: Implement repository**

Create `apps/backend/src/domains/simulation/simulationAssetRepository.ts`:

```ts
import { SqlDatabase } from '../../types';
import { SimulationAssetCatalogStatus } from '../../../../../packages/shared/src';

export interface SimulationAssetMetadataRecord {
  assetId: string;
  symbol: string;
  name: string;
  csvFileName: string;
  category: string;
  status: SimulationAssetCatalogStatus;
  historicalSymbol: string;
  firstImportedDate: string | null;
  lastImportedDate: string | null;
  importedRowCount: number;
  missingDateCount: number;
  largestGapDays: number;
  unavailableReason: string | null;
  unavailableDetail: string | null;
  coinGeckoId: string | null;
  importedAt: string;
  updatedAt: string;
}

interface SimulationAssetRow {
  asset_id: string;
  symbol: string;
  name: string;
  csv_file_name: string;
  category: string;
  status: SimulationAssetCatalogStatus;
  historical_symbol: string;
  first_imported_date: string | null;
  last_imported_date: string | null;
  imported_row_count: number;
  missing_date_count: number;
  largest_gap_days: number;
  unavailable_reason: string | null;
  unavailable_detail: string | null;
  coin_gecko_id: string | null;
  imported_at: string;
  updated_at: string;
}

const selectSimulationAssetColumns = `
  asset_id,
  symbol,
  name,
  csv_file_name,
  category,
  status,
  historical_symbol,
  first_imported_date,
  last_imported_date,
  imported_row_count,
  missing_date_count,
  largest_gap_days,
  unavailable_reason,
  unavailable_detail,
  coin_gecko_id,
  imported_at,
  updated_at
`;

function mapRow(row: SimulationAssetRow): SimulationAssetMetadataRecord {
  return {
    assetId: row.asset_id,
    symbol: row.symbol,
    name: row.name,
    csvFileName: row.csv_file_name,
    category: row.category,
    status: row.status,
    historicalSymbol: row.historical_symbol,
    firstImportedDate: row.first_imported_date,
    lastImportedDate: row.last_imported_date,
    importedRowCount: row.imported_row_count,
    missingDateCount: row.missing_date_count,
    largestGapDays: row.largest_gap_days,
    unavailableReason: row.unavailable_reason,
    unavailableDetail: row.unavailable_detail,
    coinGeckoId: row.coin_gecko_id,
    importedAt: row.imported_at,
    updatedAt: row.updated_at,
  };
}

export async function listSimulationAssets({ db }: { db: SqlDatabase }) {
  const rows = await db
    .prepare(
      `SELECT ${selectSimulationAssetColumns}
       FROM simulation_assets
       ORDER BY status ASC, symbol ASC`
    )
    .all<SimulationAssetRow>();

  return rows.results.map(mapRow);
}

export async function findSimulationAssetByAssetId({
  db,
  assetId,
}: {
  db: SqlDatabase;
  assetId: string;
}) {
  const row = await db
    .prepare(
      `SELECT ${selectSimulationAssetColumns}
       FROM simulation_assets
       WHERE asset_id = ?
       LIMIT 1`
    )
    .bind(assetId)
    .first<SimulationAssetRow>();

  return row ? mapRow(row) : null;
}

export async function findSimulationAssetBySymbol({
  db,
  symbol,
}: {
  db: SqlDatabase;
  symbol: string;
}) {
  const row = await db
    .prepare(
      `SELECT ${selectSimulationAssetColumns}
       FROM simulation_assets
       WHERE symbol = ?
       LIMIT 1`
    )
    .bind(symbol)
    .first<SimulationAssetRow>();

  return row ? mapRow(row) : null;
}
```

- [ ] **Step 4: Run repository tests**

```bash
./node_modules/.bin/jest --runTestsByPath apps/backend/__tests__/simulation/simulationAssetRepository.test.ts --runInBand --watchman=false
```

Expected: pass.

- [ ] **Step 5: Commit**

```bash
git add apps/backend/src/domains/simulation/simulationAssetRepository.ts apps/backend/__tests__/simulation/simulationAssetRepository.test.ts
git commit -m "feat: add simulation asset repository"
```

## Task 4: Add CoinGecko Markets Client And Cache

**Files:**
- Create: `apps/backend/src/domains/simulation/coinGeckoMarketsClient.ts`
- Create: `apps/backend/src/domains/simulation/simulationMarketCache.ts`
- Test: `apps/backend/__tests__/simulation/coinGeckoMarketsClient.test.ts`
- Test: `apps/backend/__tests__/simulation/simulationMarketCache.test.ts`

- [ ] **Step 1: Write failing CoinGecko markets tests**

Create `apps/backend/__tests__/simulation/coinGeckoMarketsClient.test.ts`:

```ts
import { fetchCoinGeckoMarkets } from '../../src/domains/simulation/coinGeckoMarketsClient';

describe('fetchCoinGeckoMarkets', () => {
  it('calls Demo coins markets endpoint with x-cg-demo-api-key', async () => {
    const fetchImpl = jest.fn(async () => ({
      ok: true,
      json: async () => [
        {
          id: 'bitcoin',
          symbol: 'btc',
          name: 'Bitcoin',
          image: 'https://example.com/btc.png',
          market_cap_rank: 1,
          current_price: 77000,
          price_change_percentage_24h: -1.2,
          last_updated: '2026-05-26T00:00:00.000Z',
        },
      ],
    })) as unknown as typeof fetch;

    const markets = await fetchCoinGeckoMarkets({
      coinGeckoIds: ['bitcoin'],
      apiKey: 'CG-demo',
      fetchImpl,
    });

    expect(fetchImpl).toHaveBeenCalledWith(
      expect.stringContaining('https://api.coingecko.com/api/v3/coins/markets?'),
      { headers: { 'x-cg-demo-api-key': 'CG-demo' } }
    );
    expect(markets.bitcoin.currentPriceUsd).toBe(77000);
  });

  it('rejects invalid market rows', async () => {
    const fetchImpl = jest.fn(async () => ({
      ok: true,
      json: async () => [{ id: 'bitcoin', current_price: -1 }],
    })) as unknown as typeof fetch;

    await expect(
      fetchCoinGeckoMarkets({ coinGeckoIds: ['bitcoin'], fetchImpl })
    ).rejects.toThrow('invalid CoinGecko market row');
  });
});
```

- [ ] **Step 2: Write failing cache tests**

Create `apps/backend/__tests__/simulation/simulationMarketCache.test.ts`:

```ts
import {
  clearSimulationMarketCache,
  getCachedSimulationMarkets,
} from '../../src/domains/simulation/simulationMarketCache';

const market = {
  coinGeckoId: 'bitcoin',
  rank: 1,
  imageUrl: 'https://example.com/btc.png',
  currentPriceUsd: 77000,
  priceChangePercentage24h: 1,
  updatedAt: '2026-05-26T00:00:00.000Z',
};

describe('simulationMarketCache', () => {
  beforeEach(() => clearSimulationMarketCache());

  it('returns fresh cache within 60 seconds', async () => {
    const refresh = jest.fn(async () => ({ bitcoin: market }));

    await getCachedSimulationMarkets({ refresh, nowMs: 1000 });
    const second = await getCachedSimulationMarkets({ refresh, nowMs: 2000 });

    expect(refresh).toHaveBeenCalledTimes(1);
    expect(second.cacheStatus).toBe('fresh');
  });

  it('returns stale cache on refresh failure within 24 hours', async () => {
    await getCachedSimulationMarkets({
      refresh: jest.fn(async () => ({ bitcoin: market })),
      nowMs: 1000,
    });

    const stale = await getCachedSimulationMarkets({
      refresh: jest.fn(async () => {
        throw new Error('network');
      }),
      nowMs: 2 * 60 * 1000,
    });

    expect(stale.cacheStatus).toBe('stale');
    expect(stale.markets.bitcoin.currentPriceUsd).toBe(77000);
  });

  it('throws when stale cache is older than 24 hours and refresh fails', async () => {
    await getCachedSimulationMarkets({
      refresh: jest.fn(async () => ({ bitcoin: market })),
      nowMs: 1000,
    });

    await expect(
      getCachedSimulationMarkets({
        refresh: jest.fn(async () => {
          throw new Error('network');
        }),
        nowMs: 25 * 60 * 60 * 1000,
      })
    ).rejects.toThrow('Simulation market data unavailable');
  });
});
```

- [ ] **Step 3: Run tests to verify failure**

```bash
./node_modules/.bin/jest --runTestsByPath apps/backend/__tests__/simulation/coinGeckoMarketsClient.test.ts apps/backend/__tests__/simulation/simulationMarketCache.test.ts --runInBand --watchman=false
```

Expected: fail because files do not exist.

- [ ] **Step 4: Implement CoinGecko markets client**

Create `apps/backend/src/domains/simulation/coinGeckoMarketsClient.ts`:

```ts
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
```

- [ ] **Step 5: Implement market cache**

Create `apps/backend/src/domains/simulation/simulationMarketCache.ts`:

```ts
import { recordMetric } from '../../telemetry/metrics';
import { CoinGeckoMarket } from './coinGeckoMarketsClient';

export const simulationMarketFreshTtlMs = 60_000;
export const simulationMarketStaleTtlMs = 24 * 60 * 60 * 1000;

let cacheEntry: { markets: Record<string, CoinGeckoMarket>; cachedAtMs: number } | null = null;

export function clearSimulationMarketCache() {
  cacheEntry = null;
}

export async function getCachedSimulationMarkets({
  refresh,
  nowMs = Date.now(),
}: {
  refresh: () => Promise<Record<string, CoinGeckoMarket>>;
  nowMs?: number;
}): Promise<{
  markets: Record<string, CoinGeckoMarket>;
  cacheStatus: 'fresh' | 'refreshed' | 'stale';
  cachedAtMs: number;
}> {
  if (cacheEntry) {
    const ageMs = nowMs - cacheEntry.cachedAtMs;
    if (ageMs >= 0 && ageMs <= simulationMarketFreshTtlMs) {
      recordMetric({
        name: 'crypto.api.simulation_assets.market_cache',
        durationMs: 0,
        status: 'success',
        metadata: { cacheStatus: 'fresh', ageMs },
      });
      return { ...cacheEntry, cacheStatus: 'fresh' };
    }
  }

  try {
    const markets = await refresh();
    cacheEntry = { markets, cachedAtMs: nowMs };
    recordMetric({
      name: 'crypto.api.simulation_assets.market_cache',
      durationMs: 0,
      status: 'success',
      metadata: { cacheStatus: 'refreshed', ageMs: 0 },
    });
    return { ...cacheEntry, cacheStatus: 'refreshed' };
  } catch (error) {
    if (cacheEntry) {
      const ageMs = nowMs - cacheEntry.cachedAtMs;
      if (ageMs >= 0 && ageMs <= simulationMarketStaleTtlMs) {
        recordMetric({
          name: 'crypto.api.simulation_assets.market_cache',
          durationMs: 0,
          status: 'success',
          metadata: { cacheStatus: 'stale', ageMs },
        });
        return { ...cacheEntry, cacheStatus: 'stale' };
      }
    }

    recordMetric({
      name: 'crypto.api.simulation_assets.market_cache',
      durationMs: 0,
      status: 'error',
      metadata: { cacheStatus: 'unavailable' },
    });
    throw new Error('Simulation market data unavailable');
  }
}
```

- [ ] **Step 6: Run market tests**

```bash
./node_modules/.bin/jest --runTestsByPath apps/backend/__tests__/simulation/coinGeckoMarketsClient.test.ts apps/backend/__tests__/simulation/simulationMarketCache.test.ts --runInBand --watchman=false
```

Expected: pass.

- [ ] **Step 7: Commit**

```bash
git add apps/backend/src/domains/simulation/coinGeckoMarketsClient.ts apps/backend/src/domains/simulation/simulationMarketCache.ts apps/backend/__tests__/simulation/coinGeckoMarketsClient.test.ts apps/backend/__tests__/simulation/simulationMarketCache.test.ts
git commit -m "feat: add simulation market enrichment cache"
```

## Task 5: Add `/api/simulation/assets`

**Files:**
- Create: `apps/backend/src/domains/simulation/simulationAssetsService.ts`
- Modify: `apps/backend/src/domains/simulation/simulationRoutes.ts`
- Test: `apps/backend/__tests__/api/simulation-assets-api.test.ts`

- [ ] **Step 1: Write failing API tests**

Create `apps/backend/__tests__/api/simulation-assets-api.test.ts`:

```ts
import app from '../../src';
import { clearSimulationMarketCache } from '../../src/domains/simulation/simulationMarketCache';

function createDb(rows: unknown[]) {
  return {
    prepare: jest.fn(() => ({
      bind: jest.fn().mockReturnThis(),
      first: jest.fn(async () => rows[0] ?? null),
      all: jest.fn(async () => ({ results: rows })),
      run: jest.fn(),
    })),
  };
}

describe('GET /api/simulation/assets', () => {
  beforeEach(() => {
    clearSimulationMarketCache();
  });

  it('returns split ready and unavailable assets', async () => {
    const originalFetch = global.fetch;
    global.fetch = jest.fn(async () => ({
      ok: true,
      json: async () => [
        {
          id: 'bitcoin',
          symbol: 'btc',
          name: 'Bitcoin',
          image: 'https://example.com/btc.png',
          market_cap_rank: 1,
          current_price: 77000,
          price_change_percentage_24h: 1.2,
          last_updated: '2026-05-26T00:00:00.000Z',
        },
      ],
    })) as unknown as typeof fetch;

    const response = await app.request('/api/simulation/assets', {}, {
      HISTORICAL_PRICES_DB: createDb([
        {
          asset_id: 'bitcoin',
          symbol: 'BTC',
          name: 'bitcoin',
          csv_file_name: 'bitcoin_BTC.csv',
          category: 'Layer 1',
          status: 'ready',
          historical_symbol: 'BTC',
          first_imported_date: '2021-01-01',
          last_imported_date: '2026-03-22',
          imported_row_count: 1906,
          missing_date_count: 1,
          largest_gap_days: 2,
          unavailable_reason: null,
          unavailable_detail: null,
          coin_gecko_id: 'bitcoin',
          imported_at: '2026-05-22T00:00:00.000Z',
          updated_at: '2026-05-22T00:00:00.000Z',
        },
        {
          asset_id: 'sui',
          symbol: 'SUI',
          name: 'sui',
          csv_file_name: 'sui_SUI.csv',
          category: 'Layer 1',
          status: 'historical_invalid',
          historical_symbol: 'SUI',
          first_imported_date: null,
          last_imported_date: null,
          imported_row_count: 0,
          missing_date_count: 0,
          largest_gap_days: 0,
          unavailable_reason: 'Historical data needs validation.',
          unavailable_detail: 'SUI has non-positive OHLC values',
          coin_gecko_id: null,
          imported_at: '2026-05-22T00:00:00.000Z',
          updated_at: '2026-05-22T00:00:00.000Z',
        },
      ]),
    });

    global.fetch = originalFetch;

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.assets.ready[0].assetId).toBe('bitcoin');
    expect(body.assets.ready[0].market.currentPriceUsd).toBe(77000);
    expect(body.assets.unavailable[0].assetId).toBe('sui');
    expect(body.assets.unavailable[0].availability.detail).toContain('non-positive');
  });
});
```

- [ ] **Step 2: Run test to verify failure**

```bash
./node_modules/.bin/jest --runTestsByPath apps/backend/__tests__/api/simulation-assets-api.test.ts --runInBand --watchman=false
```

Expected: fail because `/api/simulation/assets` is missing.

- [ ] **Step 3: Implement service**

Create `apps/backend/src/domains/simulation/simulationAssetsService.ts`:

```ts
import {
  SimulationAssetCatalogItem,
  SimulationAssetCatalogResponse,
} from '../../../../../packages/shared/src';
import { ApiEnv } from '../../types';
import { fetchCoinGeckoMarkets } from './coinGeckoMarketsClient';
import { getCachedSimulationMarkets } from './simulationMarketCache';
import {
  listSimulationAssets,
  SimulationAssetMetadataRecord,
} from './simulationAssetRepository';

interface ServiceResult {
  status: number;
  body: SimulationAssetCatalogResponse;
}

function emptyMarket(coinGeckoId: string | null): SimulationAssetCatalogItem['market'] {
  return {
    coinGeckoId,
    rank: null,
    imageUrl: null,
    currentPriceUsd: null,
    priceChangePercentage24h: null,
    updatedAt: null,
    status: 'unavailable',
  };
}

function toCatalogItem({
  asset,
  market,
  marketStatus,
}: {
  asset: SimulationAssetMetadataRecord;
  market?: ReturnType<typeof emptyMarket>;
  marketStatus: 'fresh' | 'stale' | 'unavailable';
}): SimulationAssetCatalogItem {
  const hasHistorical = asset.status === 'ready';
  const hasMarketPrice = Boolean(market?.currentPriceUsd);

  return {
    assetId: asset.assetId,
    symbol: asset.symbol,
    name: asset.name,
    category: asset.category,
    status: asset.status,
    historical: {
      firstDate: asset.firstImportedDate,
      lastDate: asset.lastImportedDate,
      rowCount: asset.importedRowCount,
      missingDateCount: asset.missingDateCount,
      largestGapDays: asset.largestGapDays,
    },
    market: market ?? emptyMarket(asset.coinGeckoId),
    availability: {
      canSimulate: hasHistorical && hasMarketPrice && marketStatus === 'fresh',
      reason: hasHistorical ? null : asset.unavailableReason,
      detail: hasHistorical ? null : asset.unavailableDetail,
    },
  };
}

export async function getSimulationAssets({
  env,
  now = new Date(),
}: {
  env: ApiEnv;
  now?: Date;
}): Promise<ServiceResult> {
  if (!env.HISTORICAL_PRICES_DB) {
    return {
      status: 503,
      body: {
        status: 'error',
        code: 'simulation_assets_unavailable',
        message: 'Simulation asset catalog is unavailable.',
      },
    };
  }

  const assets = await listSimulationAssets({ db: env.HISTORICAL_PRICES_DB });
  const readyCoinGeckoIds = assets
    .filter((asset) => asset.status === 'ready' && asset.coinGeckoId)
    .map((asset) => asset.coinGeckoId as string);

  let markets: Awaited<ReturnType<typeof getCachedSimulationMarkets>> | null = null;
  try {
    markets = await getCachedSimulationMarkets({
      refresh: () =>
        fetchCoinGeckoMarkets({
          coinGeckoIds: readyCoinGeckoIds,
          apiKey: env.COINGECKO_API_KEY,
        }),
      nowMs: now.getTime(),
    });
  } catch {
    markets = null;
  }

  const marketCacheStatus = markets?.cacheStatus === 'refreshed' ? 'fresh' : markets?.cacheStatus ?? 'unavailable';

  const items = assets.map((asset) => {
    const market = asset.coinGeckoId ? markets?.markets[asset.coinGeckoId] : null;
    return toCatalogItem({
      asset,
      market: market
        ? {
            coinGeckoId: market.coinGeckoId,
            rank: market.rank,
            imageUrl: market.imageUrl,
            currentPriceUsd: market.currentPriceUsd,
            priceChangePercentage24h: market.priceChangePercentage24h,
            updatedAt: market.updatedAt,
            status: marketCacheStatus,
          }
        : emptyMarket(asset.coinGeckoId),
      marketStatus: marketCacheStatus,
    });
  });

  return {
    status: 200,
    body: {
      status: 'success',
      assets: {
        ready: items.filter((item) => item.status === 'ready'),
        unavailable: items.filter((item) => item.status !== 'ready'),
      },
      source: {
        historicalProvider: 'historical_csv',
        marketProvider: 'coingecko',
        importedAt: assets[0]?.importedAt ?? now.toISOString(),
        marketDataUpdatedAt: markets ? new Date(markets.cachedAtMs).toISOString() : null,
        marketCacheStatus,
      },
    },
  };
}
```

- [ ] **Step 4: Add route**

Modify `apps/backend/src/domains/simulation/simulationRoutes.ts`:

```ts
import { getSimulationAssets } from './simulationAssetsService';
```

Add before `/prices`:

```ts
simulationRoutes.get('/assets', async (context) => {
  const result = await getSimulationAssets({ env: context.env });
  return context.json(result.body, result.status as 200);
});
```

- [ ] **Step 5: Run API test**

```bash
./node_modules/.bin/jest --runTestsByPath apps/backend/__tests__/api/simulation-assets-api.test.ts --runInBand --watchman=false
```

Expected: pass.

- [ ] **Step 6: Commit**

```bash
git add apps/backend/src/domains/simulation/simulationAssetsService.ts apps/backend/src/domains/simulation/simulationRoutes.ts apps/backend/__tests__/api/simulation-assets-api.test.ts
git commit -m "feat: expose simulation assets catalog"
```

## Task 6: Accept Canonical `assetId` In Price And History APIs

**Files:**
- Modify: `apps/backend/src/domains/simulation/simulationPriceService.ts`
- Modify: `apps/backend/src/domains/simulation/simulationHistoryService.ts`
- Modify: `apps/backend/src/domains/simulation/simulationRoutes.ts`
- Test: `apps/backend/__tests__/api/simulation-prices-api.test.ts`
- Test: `apps/backend/__tests__/api/simulation-history-api.test.ts`

- [ ] **Step 1: Add failing price API tests**

In `apps/backend/__tests__/api/simulation-prices-api.test.ts`, add:

```ts
it('accepts canonical assetId for price simulation', async () => {
  const response = await app.request(
    '/api/simulation/prices?assetId=bitcoin&date=2021-01-01&amountUsd=100',
    {},
    createEnvWithSimulationAssets()
  );

  expect(response.status).toBe(200);
  const body = await response.json();
  expect(body.asset.coinGeckoId).toBe('bitcoin');
});

it('keeps BTC symbol compatibility during migration', async () => {
  const response = await app.request(
    '/api/simulation/prices?asset=BTC&date=2021-01-01&amountUsd=100',
    {},
    createEnvWithSimulationAssets()
  );

  expect(response.status).toBe(200);
});
```

If `createEnvWithSimulationAssets` does not exist, add a local helper in the test file that returns D1 rows for both `simulation_assets` and `historical_crypto_prices`.

- [ ] **Step 2: Add failing history API tests**

Create or extend `apps/backend/__tests__/api/simulation-history-api.test.ts`:

```ts
it('accepts canonical assetId for history', async () => {
  const response = await app.request(
    '/api/simulation/history?assetId=bitcoin&year=2021',
    {},
    createEnvWithSimulationAssets()
  );

  expect(response.status).toBe(200);
  const body = await response.json();
  expect(body.asset.coinGeckoId).toBe('bitcoin');
  expect(body.points.length).toBeGreaterThan(0);
});

it('keeps BTC symbol compatibility during migration', async () => {
  const response = await app.request(
    '/api/simulation/history?asset=BTC&year=2021',
    {},
    createEnvWithSimulationAssets()
  );

  expect(response.status).toBe(200);
});
```

- [ ] **Step 3: Run tests to verify failure**

```bash
./node_modules/.bin/jest --runTestsByPath apps/backend/__tests__/api/simulation-prices-api.test.ts apps/backend/__tests__/api/simulation-history-api.test.ts --runInBand --watchman=false
```

Expected: assetId cases fail.

- [ ] **Step 4: Update route param passing**

Modify `apps/backend/src/domains/simulation/simulationRoutes.ts`:

```ts
simulationRoutes.get('/prices', async (context) => {
  const result = await getSimulationPrice({
    env: context.env,
    assetId: context.req.query('assetId'),
    asset: context.req.query('asset'),
    date: context.req.query('date'),
    amountUsd: context.req.query('amountUsd'),
  });

  return context.json(result.body, result.status as 200);
});

simulationRoutes.get('/history', async (context) => {
  const result = await getSimulationHistory({
    env: context.env,
    assetId: context.req.query('assetId'),
    asset: context.req.query('asset'),
    year: context.req.query('year'),
  });

  return context.json(result.body, result.status as 200);
});
```

- [ ] **Step 5: Update price service asset resolution**

In `simulationPriceService.ts`, replace hard-coded symbol validation with D1 asset metadata lookup:

```ts
import {
  findSimulationAssetByAssetId,
  findSimulationAssetBySymbol,
  SimulationAssetMetadataRecord,
} from './simulationAssetRepository';
```

Add:

```ts
async function resolveSimulationAsset({
  env,
  assetId,
  asset,
}: {
  env: ApiEnv;
  assetId?: string;
  asset?: string;
}): Promise<ServiceResult | SimulationAssetMetadataRecord> {
  if (!assetId && !asset) {
    return validationError(400, 'missing_asset', 'Asset is required.');
  }

  if (!env.HISTORICAL_PRICES_DB) {
    return unavailable('historical_price_unavailable', 'Historical price database is unavailable.');
  }

  const resolved = assetId
    ? await findSimulationAssetByAssetId({ db: env.HISTORICAL_PRICES_DB, assetId })
    : await findSimulationAssetBySymbol({
        db: env.HISTORICAL_PRICES_DB,
        symbol: String(asset).toUpperCase(),
      });

  if (!resolved || resolved.status !== 'ready') {
    return validationError(400, 'unsupported_asset', 'This asset is not simulation-ready.');
  }

  return resolved;
}
```

Use `resolved.historicalSymbol` for `findHistoricalPrice`, `resolved.firstImportedDate` and `resolved.lastImportedDate` for date range validation, and return `assetId`, `symbol`, `name`, `coinGeckoId` in the response. Keep `SimulationAssetSymbol` only where temporary tests still require symbol compatibility; remove it from request validation.

- [ ] **Step 6: Update history service asset resolution**

Apply the same resolution pattern in `simulationHistoryService.ts`, using `resolved.historicalSymbol` for `findHistoricalPriceSeries` and asset-specific date range for year overlap.

- [ ] **Step 7: Run API tests**

```bash
./node_modules/.bin/jest --runTestsByPath apps/backend/__tests__/api/simulation-prices-api.test.ts apps/backend/__tests__/api/simulation-history-api.test.ts --runInBand --watchman=false
```

Expected: pass.

- [ ] **Step 8: Commit**

```bash
git add apps/backend/src/domains/simulation/simulationRoutes.ts apps/backend/src/domains/simulation/simulationPriceService.ts apps/backend/src/domains/simulation/simulationHistoryService.ts apps/backend/__tests__/api/simulation-prices-api.test.ts apps/backend/__tests__/api/simulation-history-api.test.ts
git commit -m "feat: support asset ids in simulation APIs"
```

## Task 7: Add Frontend Asset Catalog Client

**Files:**
- Create: `apps/frontend/src/features/simulation/api/getSimulationAssets.ts`
- Test: `apps/frontend/src/features/simulation/api/getSimulationAssets.test.ts`
- Modify: `apps/frontend/src/features/simulation/api/getSimulationPrice.ts`
- Modify: `apps/frontend/src/features/simulation/api/getSimulationHistory.ts`
- Test: `apps/frontend/src/features/simulation/api/getSimulationPrice.test.ts`
- Test: `apps/frontend/src/features/simulation/api/getSimulationHistory.test.ts`

- [ ] **Step 1: Write failing asset client tests**

Create `apps/frontend/src/features/simulation/api/getSimulationAssets.test.ts`:

```ts
import { getSimulationAssets } from './getSimulationAssets';

describe('getSimulationAssets', () => {
  it('fetches and validates the simulation asset catalog', async () => {
    global.fetch = jest.fn(async () => ({
      json: async () => ({
        status: 'success',
        assets: { ready: [], unavailable: [] },
        source: {
          historicalProvider: 'historical_csv',
          marketProvider: 'coingecko',
          importedAt: '2026-05-22T00:00:00.000Z',
          marketDataUpdatedAt: null,
          marketCacheStatus: 'unavailable',
        },
      }),
    })) as unknown as typeof fetch;

    const result = await getSimulationAssets();

    expect(fetch).toHaveBeenCalledWith(
      'https://fintech-reliability-api.shubhkapadia2031.workers.dev/api/simulation/assets'
    );
    expect(result.status).toBe('success');
  });

  it('rejects malformed catalog responses', async () => {
    global.fetch = jest.fn(async () => ({
      json: async () => ({ status: 'success', assets: null }),
    })) as unknown as typeof fetch;

    await expect(getSimulationAssets()).rejects.toThrow('Invalid simulation assets response');
  });
});
```

- [ ] **Step 2: Run client test to verify failure**

```bash
./node_modules/.bin/jest --runTestsByPath apps/frontend/src/features/simulation/api/getSimulationAssets.test.ts --runInBand --watchman=false
```

Expected: fail because client does not exist.

- [ ] **Step 3: Implement asset catalog client**

Create `apps/frontend/src/features/simulation/api/getSimulationAssets.ts`:

```ts
import { getCryptoApiUrl } from '@/features/crypto-market/api/getCryptoApiUrl';
import { isSimulationAssetCatalogResponse } from '@/shared/api/simulationAssetCatalogValidators';
import { timeAsync } from '@/shared/metrics/metrics';
import { SimulationAssetCatalogResponse } from '@shared/simulationAssetCatalogTypes';

export async function getSimulationAssets(): Promise<SimulationAssetCatalogResponse> {
  return timeAsync(
    'crypto.client.simulation_assets.fetch',
    async () => {
      const response = await fetch(getCryptoApiUrl('/api/simulation/assets'));
      const payload = await response.json();

      if (!isSimulationAssetCatalogResponse(payload)) {
        throw new Error('Invalid simulation assets response from cloud API');
      }

      return payload;
    },
    {}
  );
}
```

- [ ] **Step 4: Update price/history clients to use assetId**

Modify `getSimulationPrice.ts`:

```ts
export interface GetSimulationPriceParams {
  assetId: string;
  date: string;
  amountUsd: number;
}

export async function getSimulationPrice({
  assetId,
  date,
  amountUsd,
}: GetSimulationPriceParams): Promise<SimulationPriceResponse> {
  const query = new URLSearchParams({
    assetId,
    date,
    amountUsd: String(amountUsd),
  });
  // existing fetch body remains the same
}
```

Modify `getSimulationHistory.ts`:

```ts
export interface GetSimulationHistoryParams {
  assetId: string;
  year: number;
}

export async function getSimulationHistory({
  assetId,
  year,
}: GetSimulationHistoryParams): Promise<SimulationHistoryResponse> {
  const query = new URLSearchParams({
    assetId,
    year: String(year),
  });
  // existing fetch body remains the same
}
```

- [ ] **Step 5: Update API tests**

Update expected endpoint strings to:

```text
/api/simulation/prices?assetId=bitcoin&date=2021-01-01&amountUsd=100
/api/simulation/history?assetId=bitcoin&year=2021
```

- [ ] **Step 6: Run frontend API tests**

```bash
./node_modules/.bin/jest --runTestsByPath apps/frontend/src/features/simulation/api/getSimulationAssets.test.ts apps/frontend/src/features/simulation/api/getSimulationPrice.test.ts apps/frontend/src/features/simulation/api/getSimulationHistory.test.ts --runInBand --watchman=false
```

Expected: pass.

- [ ] **Step 7: Commit**

```bash
git add apps/frontend/src/features/simulation/api/getSimulationAssets.ts apps/frontend/src/features/simulation/api/getSimulationAssets.test.ts apps/frontend/src/features/simulation/api/getSimulationPrice.ts apps/frontend/src/features/simulation/api/getSimulationPrice.test.ts apps/frontend/src/features/simulation/api/getSimulationHistory.ts apps/frontend/src/features/simulation/api/getSimulationHistory.test.ts
git commit -m "feat: add simulation assets client"
```

## Task 8: Add Picker Search And Sort Helpers

**Files:**
- Create: `apps/frontend/src/features/simulation/assets/filterSimulationAssets.ts`
- Test: `apps/frontend/src/features/simulation/assets/filterSimulationAssets.test.ts`

- [ ] **Step 1: Write failing helper tests**

Create `apps/frontend/src/features/simulation/assets/filterSimulationAssets.test.ts`:

```ts
import {
  filterSimulationAssets,
  sortSimulationAssets,
} from './filterSimulationAssets';
import { SimulationAssetCatalogItem } from '@shared/simulationAssetCatalogTypes';

function asset(overrides: Partial<SimulationAssetCatalogItem>): SimulationAssetCatalogItem {
  return {
    assetId: 'bitcoin',
    symbol: 'BTC',
    name: 'Bitcoin',
    category: 'Layer 1',
    status: 'ready',
    historical: {
      firstDate: '2021-01-01',
      lastDate: '2026-03-22',
      rowCount: 1906,
      missingDateCount: 0,
      largestGapDays: 1,
    },
    market: {
      coinGeckoId: 'bitcoin',
      rank: 1,
      imageUrl: null,
      currentPriceUsd: 77000,
      priceChangePercentage24h: 1,
      updatedAt: '2026-05-26T00:00:00.000Z',
      status: 'fresh',
    },
    availability: { canSimulate: true, reason: null, detail: null },
    ...overrides,
  };
}

describe('filterSimulationAssets', () => {
  it('searches by name, symbol, and category', () => {
    const assets = [
      asset({ assetId: 'bitcoin', symbol: 'BTC', name: 'Bitcoin', category: 'Layer 1' }),
      asset({ assetId: 'usdc', symbol: 'USDC', name: 'USD Coin', category: 'Stablecoin' }),
    ];

    expect(filterSimulationAssets({ assets, query: 'btc', categories: [] })).toHaveLength(1);
    expect(filterSimulationAssets({ assets, query: 'stable', categories: [] })[0].symbol).toBe('USDC');
  });

  it('filters by category', () => {
    const assets = [
      asset({ symbol: 'BTC', category: 'Layer 1' }),
      asset({ symbol: 'USDC', category: 'Stablecoin' }),
    ];

    expect(filterSimulationAssets({ assets, query: '', categories: ['Stablecoin'] })[0].symbol).toBe('USDC');
  });

  it('sorts recent and saved first, then market rank', () => {
    const assets = [
      asset({ assetId: 'ethereum', symbol: 'ETH', market: { ...asset({}).market, rank: 2 } }),
      asset({ assetId: 'bitcoin', symbol: 'BTC', market: { ...asset({}).market, rank: 1 } }),
      asset({ assetId: 'solana', symbol: 'SOL', market: { ...asset({}).market, rank: 6 } }),
    ];

    const sorted = sortSimulationAssets({
      assets,
      recentAssetIds: ['solana'],
      savedAssetIds: [],
    });

    expect(sorted.map((item) => item.assetId)).toEqual(['solana', 'bitcoin', 'ethereum']);
  });
});
```

- [ ] **Step 2: Run helper tests to verify failure**

```bash
./node_modules/.bin/jest --runTestsByPath apps/frontend/src/features/simulation/assets/filterSimulationAssets.test.ts --runInBand --watchman=false
```

Expected: fail because helper does not exist.

- [ ] **Step 3: Implement helpers**

Create `apps/frontend/src/features/simulation/assets/filterSimulationAssets.ts`:

```ts
import { SimulationAssetCatalogItem } from '@shared/simulationAssetCatalogTypes';

export function filterSimulationAssets({
  assets,
  query,
  categories,
}: {
  assets: SimulationAssetCatalogItem[];
  query: string;
  categories: string[];
}) {
  const normalizedQuery = query.trim().toLowerCase();
  const categorySet = new Set(categories);

  return assets.filter((asset) => {
    const matchesCategory = categorySet.size === 0 || categorySet.has(asset.category);
    if (!matchesCategory) return false;
    if (!normalizedQuery) return true;

    return (
      asset.name.toLowerCase().includes(normalizedQuery) ||
      asset.symbol.toLowerCase().includes(normalizedQuery) ||
      asset.category.toLowerCase().includes(normalizedQuery)
    );
  });
}

export function sortSimulationAssets({
  assets,
  recentAssetIds,
  savedAssetIds,
}: {
  assets: SimulationAssetCatalogItem[];
  recentAssetIds: string[];
  savedAssetIds: string[];
}) {
  const recent = new Set(recentAssetIds);
  const saved = new Set(savedAssetIds);

  return [...assets].sort((left, right) => {
    const leftPriority = recent.has(left.assetId) || saved.has(left.assetId) ? 0 : 1;
    const rightPriority = recent.has(right.assetId) || saved.has(right.assetId) ? 0 : 1;
    if (leftPriority !== rightPriority) return leftPriority - rightPriority;

    const leftRank = left.market.rank ?? Number.MAX_SAFE_INTEGER;
    const rightRank = right.market.rank ?? Number.MAX_SAFE_INTEGER;
    if (leftRank !== rightRank) return leftRank - rightRank;

    return left.name.localeCompare(right.name);
  });
}
```

- [ ] **Step 4: Run helper tests**

```bash
./node_modules/.bin/jest --runTestsByPath apps/frontend/src/features/simulation/assets/filterSimulationAssets.test.ts --runInBand --watchman=false
```

Expected: pass.

- [ ] **Step 5: Commit**

```bash
git add apps/frontend/src/features/simulation/assets/filterSimulationAssets.ts apps/frontend/src/features/simulation/assets/filterSimulationAssets.test.ts
git commit -m "feat: add simulation asset filtering"
```

## Task 9: Update Saved Simulations For Asset Metadata Snapshots

**Files:**
- Modify: `apps/frontend/src/features/simulation/storage/savedSimulationsStore.ts`
- Test: `apps/frontend/src/features/simulation/storage/savedSimulationsStore.test.ts`

- [ ] **Step 1: Add failing storage test**

In `savedSimulationsStore.test.ts`, add:

```ts
it('saves stable asset metadata snapshot', async () => {
  const store = createSavedSimulationsStore({
    storage,
    createId: () => 'sim_1',
    now: () => new Date('2026-05-26T00:00:00.000Z'),
  });

  await store.saveSimulation({
    input: {
      assetId: 'bitcoin',
      asset: 'BTC',
      requestedDate: '2021-01-01',
      amountUsd: 100,
    },
    assetSnapshot: {
      assetId: 'bitcoin',
      symbol: 'BTC',
      name: 'Bitcoin',
      category: 'Layer 1',
      imageUrl: 'https://example.com/btc.png',
    },
    result: simulationSuccessResponse,
  });

  const [saved] = await store.listSavedSimulations();
  expect(saved.assetSnapshot.assetId).toBe('bitcoin');
  expect(saved.assetSnapshot.category).toBe('Layer 1');
});
```

- [ ] **Step 2: Run storage test to verify failure**

```bash
./node_modules/.bin/jest --runTestsByPath apps/frontend/src/features/simulation/storage/savedSimulationsStore.test.ts --runInBand --watchman=false
```

Expected: fail because `assetId` and `assetSnapshot` are unsupported.

- [ ] **Step 3: Update saved simulation types**

Modify `savedSimulationsStore.ts`:

```ts
export interface SavedSimulationAssetSnapshot {
  assetId: string;
  symbol: string;
  name: string;
  category: string;
  imageUrl: string | null;
}

export interface SavedSimulationInput {
  assetId: string;
  asset: string;
  requestedDate: string;
  amountUsd: number;
}

export interface SavedSimulation {
  id: string;
  createdAt: string;
  hypotheticalLabel: 'Hypothetical simulation';
  input: SavedSimulationInput;
  assetSnapshot: SavedSimulationAssetSnapshot;
  resultSnapshot: SimulationPriceSuccessResponse;
  dataTrust: {
    historicalProvider: string;
    historicalDateResolution: SimulationDateResolution;
    currentProvider: string;
    currentCacheStatus: SimulationCurrentCacheStatus;
  };
}

export interface SaveSimulationParams {
  input: SavedSimulationInput;
  assetSnapshot: SavedSimulationAssetSnapshot;
  result: SimulationPriceSuccessResponse;
}
```

Inside `saveSimulation`, include:

```ts
assetSnapshot,
```

- [ ] **Step 4: Run storage tests**

```bash
./node_modules/.bin/jest --runTestsByPath apps/frontend/src/features/simulation/storage/savedSimulationsStore.test.ts --runInBand --watchman=false
```

Expected: pass.

- [ ] **Step 5: Commit**

```bash
git add apps/frontend/src/features/simulation/storage/savedSimulationsStore.ts apps/frontend/src/features/simulation/storage/savedSimulationsStore.test.ts
git commit -m "feat: snapshot simulation asset metadata"
```

## Task 10: Build Asset Picker Component

**Files:**
- Create: `apps/frontend/src/features/simulation/components/simulationAssetPicker.tsx`
- Test: `apps/frontend/src/features/simulation/components/simulationAssetPicker.test.tsx`

- [ ] **Step 1: Write focused picker tests**

Create `apps/frontend/src/features/simulation/components/simulationAssetPicker.test.tsx`:

```ts
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { SimulationAssetPicker } from './simulationAssetPicker';

const readyAsset = {
  assetId: 'bitcoin',
  symbol: 'BTC',
  name: 'Bitcoin',
  category: 'Layer 1',
  status: 'ready',
  historical: { firstDate: '2021-01-01', lastDate: '2026-03-22', rowCount: 1906, missingDateCount: 0, largestGapDays: 1 },
  market: { coinGeckoId: 'bitcoin', rank: 1, imageUrl: null, currentPriceUsd: 77000, priceChangePercentage24h: 1.2, updatedAt: '2026-05-26T00:00:00.000Z', status: 'fresh' },
  availability: { canSimulate: true, reason: null, detail: null },
} as const;

const unavailableAsset = {
  ...readyAsset,
  assetId: 'sui',
  symbol: 'SUI',
  name: 'sui',
  status: 'historical_invalid',
  market: { ...readyAsset.market, coinGeckoId: null, rank: null, currentPriceUsd: null, priceChangePercentage24h: null, status: 'unavailable' },
  availability: { canSimulate: false, reason: 'Historical data needs validation.', detail: 'SUI has non-positive OHLC values' },
} as const;

describe('SimulationAssetPicker', () => {
  it('renders ready assets and selects one', () => {
    const onSelect = jest.fn();
    const screen = render(
      <SimulationAssetPicker
        visible
        readyAssets={[readyAsset]}
        unavailableAssets={[unavailableAsset]}
        selectedAssetId="bitcoin"
        savedAssetIds={[]}
        recentAssetIds={[]}
        onSelect={onSelect}
        onClose={jest.fn()}
      />
    );

    fireEvent.press(screen.getByText('Bitcoin'));
    expect(onSelect).toHaveBeenCalledWith(readyAsset, expect.objectContaining({ source: 'ranked' }));
  });

  it('reveals unavailable assets through search with technical detail', () => {
    const screen = render(
      <SimulationAssetPicker
        visible
        readyAssets={[readyAsset]}
        unavailableAssets={[unavailableAsset]}
        selectedAssetId="bitcoin"
        savedAssetIds={[]}
        recentAssetIds={[]}
        onSelect={jest.fn()}
        onClose={jest.fn()}
      />
    );

    fireEvent.changeText(screen.getByPlaceholderText('Search coins'), 'SUI');
    expect(screen.getByText('Historical data needs validation.')).toBeTruthy();
    expect(screen.getByText('SUI has non-positive OHLC values')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run picker tests to verify failure**

```bash
./node_modules/.bin/jest --runTestsByPath apps/frontend/src/features/simulation/components/simulationAssetPicker.test.tsx --runInBand --watchman=false
```

Expected: fail because component does not exist.

- [ ] **Step 3: Implement picker component**

Create `simulationAssetPicker.tsx` with:

```tsx
import React, { useMemo, useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SimulationAssetCatalogItem } from '@shared/simulationAssetCatalogTypes';
import Colors from '@/shared/theme/colors';
import { filterSimulationAssets, sortSimulationAssets } from '../assets/filterSimulationAssets';

export interface AssetSelectionMetadata {
  source: 'recent' | 'ranked' | 'search' | 'saved';
  queryLength: number;
}

export function SimulationAssetPicker({
  visible,
  readyAssets,
  unavailableAssets,
  selectedAssetId,
  savedAssetIds,
  recentAssetIds,
  onSelect,
  onClose,
}: {
  visible: boolean;
  readyAssets: SimulationAssetCatalogItem[];
  unavailableAssets: SimulationAssetCatalogItem[];
  selectedAssetId: string;
  savedAssetIds: string[];
  recentAssetIds: string[];
  onSelect: (asset: SimulationAssetCatalogItem, metadata: AssetSelectionMetadata) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const searchActive = query.trim().length > 0;

  const categoryOptions = useMemo(
    () => [...new Set(readyAssets.map((asset) => asset.category))].sort(),
    [readyAssets]
  );

  const visibleReady = useMemo(
    () =>
      sortSimulationAssets({
        assets: filterSimulationAssets({ assets: readyAssets, query, categories }),
        recentAssetIds,
        savedAssetIds,
      }),
    [categories, query, readyAssets, recentAssetIds, savedAssetIds]
  );

  const visibleUnavailable = useMemo(
    () =>
      searchActive
        ? filterSimulationAssets({ assets: unavailableAssets, query, categories })
        : [],
    [categories, query, searchActive, unavailableAssets]
  );

  function selectionSource(asset: SimulationAssetCatalogItem): AssetSelectionMetadata['source'] {
    if (searchActive) return 'search';
    if (recentAssetIds.includes(asset.assetId)) return 'recent';
    if (savedAssetIds.includes(asset.assetId)) return 'saved';
    return 'ranked';
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Choose asset</Text>
          <TouchableOpacity onPress={onClose} accessibilityLabel="Close asset picker">
            <Ionicons name="close" size={28} color={Colors.dark} />
          </TouchableOpacity>
        </View>

        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search coins"
          autoCapitalize="none"
          style={styles.searchInput}
        />

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          <TouchableOpacity style={[styles.chip, categories.length === 0 && styles.chipSelected]} onPress={() => setCategories([])}>
            <Text style={styles.chipText}>All</Text>
          </TouchableOpacity>
          {categoryOptions.map((category) => {
            const selected = categories.includes(category);
            return (
              <TouchableOpacity
                key={category}
                style={[styles.chip, selected && styles.chipSelected]}
                onPress={() => setCategories(selected ? [] : [category])}
              >
                <Text style={styles.chipText}>{category}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <ScrollView keyboardShouldPersistTaps="handled">
          {visibleReady.map((asset) => (
            <TouchableOpacity
              key={asset.assetId}
              style={[styles.row, asset.assetId === selectedAssetId && styles.rowSelected]}
              onPress={() =>
                onSelect(asset, {
                  source: selectionSource(asset),
                  queryLength: query.trim().length,
                })
              }
            >
              <View>
                <Text style={styles.assetName}>{asset.name}</Text>
                <Text style={styles.assetMeta}>
                  {asset.symbol} · {asset.category} · #{asset.market.rank ?? '-'}
                </Text>
              </View>
              <View style={styles.rowRight}>
                <Text style={styles.priceText}>
                  {asset.market.currentPriceUsd ? `$${asset.market.currentPriceUsd.toLocaleString()}` : 'Unavailable'}
                </Text>
                <Text style={styles.changeText}>
                  {asset.market.priceChangePercentage24h === null
                    ? ''
                    : `${asset.market.priceChangePercentage24h.toFixed(2)}%`}
                </Text>
              </View>
            </TouchableOpacity>
          ))}

          {visibleUnavailable.map((asset) => (
            <View key={asset.assetId} style={[styles.row, styles.rowDisabled]}>
              <View>
                <Text style={styles.assetName}>{asset.name}</Text>
                <Text style={styles.assetMeta}>
                  {asset.symbol} · {asset.category}
                </Text>
                <Text style={styles.unavailableReason}>{asset.availability.reason}</Text>
                {!!asset.availability.detail && (
                  <Text style={styles.unavailableDetail}>{asset.availability.detail}</Text>
                )}
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );
}
```

Add these styles in the same file:

```tsx
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: 20,
    paddingTop: 64,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  title: {
    color: Colors.dark,
    fontSize: 24,
    fontWeight: '800',
  },
  searchInput: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D5DAE2',
    color: Colors.dark,
    fontSize: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  filterScroll: {
    marginVertical: 14,
    maxHeight: 42,
  },
  chip: {
    alignItems: 'center',
    borderColor: '#D5DAE2',
    borderRadius: 8,
    borderWidth: 1,
    height: 36,
    justifyContent: 'center',
    marginRight: 8,
    paddingHorizontal: 12,
  },
  chipSelected: {
    backgroundColor: '#E8E7FF',
    borderColor: Colors.primary,
  },
  chipText: {
    color: Colors.dark,
    fontSize: 13,
    fontWeight: '700',
  },
  row: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderColor: '#E5E7EB',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    minHeight: 76,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  rowSelected: {
    borderColor: Colors.primary,
  },
  rowDisabled: {
    alignItems: 'flex-start',
    opacity: 0.72,
  },
  assetName: {
    color: Colors.dark,
    fontSize: 16,
    fontWeight: '800',
  },
  assetMeta: {
    color: Colors.gray,
    fontSize: 12,
    marginTop: 3,
  },
  rowRight: {
    alignItems: 'flex-end',
    marginLeft: 12,
  },
  priceText: {
    color: Colors.dark,
    fontSize: 14,
    fontWeight: '800',
  },
  changeText: {
    color: Colors.gray,
    fontSize: 12,
    marginTop: 3,
  },
  unavailableReason: {
    color: '#C24135',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 6,
  },
  unavailableDetail: {
    color: Colors.gray,
    fontSize: 12,
    marginTop: 3,
  },
});
```

- [ ] **Step 4: Run picker tests**

```bash
./node_modules/.bin/jest --runTestsByPath apps/frontend/src/features/simulation/components/simulationAssetPicker.test.tsx --runInBand --watchman=false
```

Expected: pass.

- [ ] **Step 5: Commit**

```bash
git add apps/frontend/src/features/simulation/components/simulationAssetPicker.tsx apps/frontend/src/features/simulation/components/simulationAssetPicker.test.tsx
git commit -m "feat: add simulation asset picker"
```

## Task 11: Integrate Catalog Picker Into Simulation Screen

**Files:**
- Modify: `apps/frontend/src/features/simulation/screens/simulationScreen.tsx`
- Modify: `apps/frontend/src/features/simulation/screens/simulationScreen.test.tsx`

- [ ] **Step 1: Add failing screen tests**

Add focused source-level tests to `simulationScreen.test.tsx`:

```ts
it('uses the backend asset catalog instead of hard-coded BTC ETH SOL picker copy', () => {
  expect(source).toContain('getSimulationAssets');
  expect(source).toContain('SimulationAssetPicker');
  expect(source).not.toContain('SIMULATION_ASSETS: Array');
});

it('records asset picker metrics', () => {
  expect(source).toContain('crypto.simulation.asset_picker.opened');
  expect(source).toContain('crypto.simulation.asset_picker.selected');
});

it('uses asset-specific historical date bounds', () => {
  expect(source).toContain('selectedAsset.historical.firstDate');
  expect(source).toContain('selectedAsset.historical.lastDate');
});
```

- [ ] **Step 2: Run screen tests to verify failure**

```bash
./node_modules/.bin/jest --runTestsByPath apps/frontend/src/features/simulation/screens/simulationScreen.test.ts --runInBand --watchman=false
```

Expected: fail.

- [ ] **Step 3: Add catalog query and selected asset state**

In `simulationScreen.tsx`, import:

```ts
import { getSimulationAssets } from '@/features/simulation/api/getSimulationAssets';
import { SimulationAssetPicker } from '@/features/simulation/components/simulationAssetPicker';
import { SimulationAssetCatalogItem } from '@shared/simulationAssetCatalogTypes';
```

Replace asset state with:

```ts
const [selectedAssetId, setSelectedAssetId] = useState('bitcoin');
const [assetPickerVisible, setAssetPickerVisible] = useState(false);
const assetsQuery = useQuery({
  queryKey: ['simulation-assets'],
  queryFn: getSimulationAssets,
});

const assetCatalog = assetsQuery.data?.status === 'success' ? assetsQuery.data : null;
const readyAssets = assetCatalog?.assets.ready ?? [];
const unavailableAssets = assetCatalog?.assets.unavailable ?? [];
const selectedAsset =
  readyAssets.find((item) => item.assetId === selectedAssetId) ?? readyAssets[0] ?? null;
```

- [ ] **Step 4: Use assetId in history and price queries**

Update history query:

```ts
const historyQuery = useQuery({
  queryKey: ['simulation-history', selectedAsset?.assetId, selectedYear],
  queryFn: () => getSimulationHistory({ assetId: selectedAsset!.assetId, year: selectedYear }),
  enabled: Boolean(selectedAsset),
});
```

Update mutation:

```ts
getSimulationPrice({
  assetId: selectedAsset!.assetId,
  date,
  amountUsd: numericAmount,
})
```

- [ ] **Step 5: Clamp date to asset-specific bounds**

Add:

```ts
function clampDateToAssetRange(value: string, asset: SimulationAssetCatalogItem) {
  const firstDate = asset.historical.firstDate ?? value;
  const lastDate = asset.historical.lastDate ?? value;
  if (value < firstDate) return firstDate;
  if (value > lastDate) return lastDate;
  return value;
}
```

When selecting an asset:

```ts
function onSelectAsset(asset: SimulationAssetCatalogItem, metadata: { source: string; queryLength: number }) {
  setSelectedAssetId(asset.assetId);
  setDate((currentDate) => clampDateToAssetRange(currentDate, asset));
  setSelectedYear(Number(clampDateToAssetRange(date, asset).slice(0, 4)));
  setAssetPickerVisible(false);
  recordMetric({
    name: 'crypto.simulation.asset_picker.selected',
    durationMs: 0,
    status: 'success',
    metadata: {
      assetId: asset.assetId,
      symbol: asset.symbol,
      category: asset.category,
      rank: asset.market.rank,
      searchActive: metadata.queryLength > 0,
      queryLength: metadata.queryLength,
      source: metadata.source,
    },
  });
}
```

- [ ] **Step 6: Replace segmented selector with selected-asset control**

Remove the `SIMULATION_ASSETS.map` segmented buttons and render:

```tsx
<TouchableOpacity
  style={styles.selectedAssetButton}
  onPress={() => {
    setAssetPickerVisible(true);
    recordMetric({
      name: 'crypto.simulation.asset_picker.opened',
      durationMs: 0,
      status: 'success',
      metadata: { selectedAssetId },
    });
  }}
>
  <View>
    <Text style={styles.assetSymbol}>{selectedAsset?.symbol ?? 'Asset'}</Text>
    <Text style={styles.assetName}>{selectedAsset?.name ?? 'Loading assets'}</Text>
  </View>
  <Ionicons name="chevron-forward" size={20} color={Colors.gray} />
</TouchableOpacity>
```

Render picker near the end of the component:

```tsx
<SimulationAssetPicker
  visible={assetPickerVisible}
  readyAssets={readyAssets}
  unavailableAssets={unavailableAssets}
  selectedAssetId={selectedAssetId}
  savedAssetIds={savedItems.map((item) => item.input.assetId)}
  recentAssetIds={savedItems.slice(0, 5).map((item) => item.input.assetId)}
  onSelect={onSelectAsset}
  onClose={() => setAssetPickerVisible(false)}
/>
```

- [ ] **Step 7: Update run gating**

Set:

```ts
const [acceptsStalePrice, setAcceptsStalePrice] = useState(false);
const firstAvailableDate = selectedAsset?.historical.firstDate ?? MIN_SIMULATION_DATE;
const lastAvailableDate = selectedAsset?.historical.lastDate ?? MAX_SIMULATION_DATE;
const marketIsFresh = selectedAsset?.market.status === 'fresh';
const marketIsAcceptedStale = selectedAsset?.market.status === 'stale' && acceptsStalePrice;
const canRunSimulation =
  Boolean(selectedAsset) &&
  (marketIsFresh || marketIsAcceptedStale) &&
  Number.isFinite(numericAmount) &&
  numericAmount > 0 &&
  /^\d{4}-\d{2}-\d{2}$/.test(date) &&
  date >= firstAvailableDate &&
  date <= lastAvailableDate;
```

Reset stale acceptance when the selected asset changes:

```ts
useEffect(() => {
  setAcceptsStalePrice(false);
}, [selectedAssetId]);
```

Render stale/unavailable current price states above the Run button:

```tsx
{selectedAsset?.market.status === 'stale' && !acceptsStalePrice && (
  <View style={styles.marketWarning}>
    <Text style={styles.stateText}>
      Current price is stale. Last updated {selectedAsset.market.updatedAt ?? 'recently'}.
    </Text>
    <TouchableOpacity style={styles.inlineRetryButton} onPress={() => setAcceptsStalePrice(true)}>
      <Text style={styles.inlineRetryText}>Run with stale price</Text>
    </TouchableOpacity>
  </View>
)}

{selectedAsset?.market.status === 'unavailable' && (
  <View style={styles.marketWarning}>
    <Text style={styles.stateText}>Current price is unavailable. Try refreshing assets.</Text>
  </View>
)}
```

Add style:

```ts
marketWarning: {
  backgroundColor: '#FFF7ED',
  borderColor: '#FDBA74',
  borderRadius: 8,
  borderWidth: 1,
  gap: 8,
  marginBottom: 12,
  padding: 12,
},
```

- [ ] **Step 8: Update save call**

Pass `assetId` and `assetSnapshot`:

```ts
await saveSimulationSnapshot({
  input: {
    assetId: selectedAsset.assetId,
    asset: selectedAsset.symbol,
    requestedDate: date,
    amountUsd: numericAmount,
  },
  assetSnapshot: {
    assetId: selectedAsset.assetId,
    symbol: selectedAsset.symbol,
    name: selectedAsset.name,
    category: selectedAsset.category,
    imageUrl: selectedAsset.market.imageUrl,
  },
  result: latestResult,
});
```

- [ ] **Step 9: Run screen tests**

```bash
./node_modules/.bin/jest --runTestsByPath apps/frontend/src/features/simulation/screens/simulationScreen.test.ts --runInBand --watchman=false
```

Expected: pass.

- [ ] **Step 10: Commit**

```bash
git add apps/frontend/src/features/simulation/screens/simulationScreen.tsx apps/frontend/src/features/simulation/screens/simulationScreen.test.ts
git commit -m "feat: integrate expanded simulation asset picker"
```

## Task 12: Update Metrics And Project Reference Docs

**Files:**
- Modify: `docs/project-reference/metrics.md`
- Modify: `docs/project-reference/architecture.md`
- Modify: `docs/project-reference/issues.md`
- Modify: `docs/project-reference/troubleshooting.md`

- [ ] **Step 1: Update metrics catalog**

Add:

```md
### Simulation Asset Catalog

- `crypto.simulation.asset_picker.opened`
  - Records when the expanded asset picker opens.
- `crypto.simulation.asset_picker.search`
  - Records search input usage in the asset picker.
- `crypto.simulation.asset_picker.selected`
  - Records ready asset selection.
  - Metadata includes assetId, symbol, category, rank, searchActive, queryLength, and source.
- `crypto.simulation.asset_picker.unavailable_viewed`
  - Records when search reveals unavailable CSV-listed assets.
- `crypto.client.simulation_assets.fetch`
  - Measures the mobile request to `/api/simulation/assets`.
- `crypto.api.simulation_assets.market_coingecko`
  - Measures CoinGecko `/coins/markets` refresh.
- `crypto.api.simulation_assets.market_cache`
  - Records fresh, refreshed, stale, and unavailable market cache states.
```

- [ ] **Step 2: Update architecture docs**

Document:

- `simulation_assets` table.
- Worker-owned `/api/simulation/assets`.
- canonical `assetId`.
- temporary BTC/ETH/SOL symbol compatibility.
- frontend full-screen picker.

- [ ] **Step 3: Update issues ledger**

Move “support only BTC/ETH/SOL” into resolved after implementation, and add remaining risks:

- invalid CSV repair for 12 assets.
- picker ergonomics after device testing.
- CoinGecko Demo rate-limit monitoring.

- [ ] **Step 4: Update troubleshooting**

Add commands:

```bash
curl -i 'https://fintech-reliability-api.shubhkapadia2031.workers.dev/api/simulation/assets'
curl -i 'https://fintech-reliability-api.shubhkapadia2031.workers.dev/api/simulation/prices?assetId=bitcoin&date=2021-01-01&amountUsd=100'
curl -i 'https://fintech-reliability-api.shubhkapadia2031.workers.dev/api/simulation/history?assetId=bitcoin&year=2021'
```

- [ ] **Step 5: Commit**

```bash
git add docs/project-reference/metrics.md docs/project-reference/architecture.md docs/project-reference/issues.md docs/project-reference/troubleshooting.md
git commit -m "docs: document expanded simulation asset catalog"
```

## Task 13: Final Verification, D1 Deploy, Worker Deploy, And Smoke

**Files:**
- No source files expected unless verification finds a bug.

- [ ] **Step 1: Run Python importer tests**

```bash
/Users/shubhkapadia/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3 -m unittest scripts/historical_prices/test_import_historical_prices.py
```

Expected: all tests pass.

- [ ] **Step 2: Run focused Simulation tests**

```bash
./node_modules/.bin/jest --runTestsByPath apps/frontend/src/shared/api/simulationAssetCatalogValidators.test.ts apps/backend/__tests__/simulation/simulationAssetRepository.test.ts apps/backend/__tests__/simulation/coinGeckoMarketsClient.test.ts apps/backend/__tests__/simulation/simulationMarketCache.test.ts apps/backend/__tests__/api/simulation-assets-api.test.ts apps/backend/__tests__/api/simulation-prices-api.test.ts apps/backend/__tests__/api/simulation-history-api.test.ts apps/frontend/src/features/simulation/api/getSimulationAssets.test.ts apps/frontend/src/features/simulation/api/getSimulationPrice.test.ts apps/frontend/src/features/simulation/api/getSimulationHistory.test.ts apps/frontend/src/features/simulation/assets/filterSimulationAssets.test.ts apps/frontend/src/features/simulation/components/simulationAssetPicker.test.tsx apps/frontend/src/features/simulation/screens/simulationScreen.test.ts apps/frontend/src/features/simulation/storage/savedSimulationsStore.test.ts --runInBand --watchman=false
```

Expected: all tests pass.

- [ ] **Step 3: Run full verification**

```bash
./node_modules/.bin/jest --runInBand --watchman=false
./node_modules/.bin/tsc --noEmit
node -e "JSON.parse(require('fs').readFileSync('app.json','utf8')); console.log('app.json valid')"
```

Expected: all commands exit 0.

- [ ] **Step 4: Apply D1 migration and import SQL**

Run from repo root:

```bash
./node_modules/.bin/wrangler d1 execute fintech-historical-prices --remote --file apps/backend/migrations/0002_simulation_assets.sql
./node_modules/.bin/wrangler d1 execute fintech-historical-prices --remote --file tmp/historical_prices/historical_crypto_prices.sql
```

Expected:

- migration succeeds.
- import succeeds.
- `simulation_assets` contains 100 rows.

Verify:

```bash
./node_modules/.bin/wrangler d1 execute fintech-historical-prices --remote --command "SELECT status, COUNT(*) AS count FROM simulation_assets GROUP BY status ORDER BY status;"
```

Expected current target:

- `historical_invalid`: 12
- `ready`: 88

- [ ] **Step 5: Deploy Worker**

Run:

```bash
cd apps/backend
../../node_modules/.bin/wrangler deploy
```

Expected: deploy succeeds and prints Worker URL.

- [ ] **Step 6: Verify production endpoints**

Run:

```bash
curl -i 'https://fintech-reliability-api.shubhkapadia2031.workers.dev/api/simulation/assets'
curl -i 'https://fintech-reliability-api.shubhkapadia2031.workers.dev/api/simulation/prices?assetId=bitcoin&date=2021-01-01&amountUsd=100'
curl -i 'https://fintech-reliability-api.shubhkapadia2031.workers.dev/api/simulation/history?assetId=bitcoin&year=2021'
```

Expected:

- `/assets` returns `status: "success"` with split ready/unavailable lists.
- `/prices` returns `status: "success"`.
- `/history` returns `status: "success"` with points.

- [ ] **Step 7: Smoke app UI**

Run:

```bash
./node_modules/.bin/expo export --platform web --output-dir /private/tmp/fintech-expanded-assets-web-export
```

Expected: export succeeds and includes Simulation route.

Manual device smoke:

- open Simulation.
- open asset picker.
- search `ETH` and select Ethereum.
- search `SUI` and confirm unavailable reason plus technical detail appears.
- select a non-BTC ready asset.
- confirm date clamps or preserves correctly.
- run simulation.
- save simulation.
- confirm saved row shows selected asset metadata.

- [ ] **Step 8: Measurement summary**

Report:

```text
Measurement: expanded asset selection increases from 3 hard-coded simulation assets to the imported ready catalog, with picker open/search/select/unavailable interactions measured by the new crypto.simulation.asset_picker.* events and /api/simulation/assets client/API latency measured.
```

- [ ] **Step 9: Commit any verification fixes**

If verification required source changes:

```bash
git add <fixed-files>
git commit -m "fix: stabilize expanded simulation asset catalog"
```

If no source changes were required, do not create an empty commit.
