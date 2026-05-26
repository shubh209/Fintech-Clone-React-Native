# Expanded Simulation Asset Catalog Design

## Status

Design approved for implementation planning.

## Goal

Expand Simulation from the hard-coded BTC, ETH, and SOL flow to the full CSV asset universe while keeping the simulator trustworthy, searchable, and easy to use.

The product target is all 100 assets listed in `data/crypto_data/crypto_directory.csv`. The initial simulation-ready set is the subset whose historical CSV data validates successfully and whose CoinGecko market mapping is verified. At the time of design, 88 assets import successfully and 12 assets need data repair or validation work.

## Product Principles

- The Worker owns the simulation asset catalog. The frontend does not hard-code the list of 88 or 100 assets.
- Historical readiness and current market availability are separate states.
- The main picker shows simulation-ready assets by default.
- Direct search can reveal unavailable CSV assets with a friendly explanation and expandable technical detail.
- Asset lookup should help users choose quickly without becoming a full market screener.
- Simulation remains single-asset for this expansion.
- Trust labels must stay visible when data is stale, unavailable, or sourced from fallback/imported data.

## User Experience

The Simulation screen replaces the BTC/ETH/SOL segmented selector with a compact selected-asset control. The control shows the selected asset name, symbol, current USD price when available, and 24-hour movement when available.

Tapping the control opens a full-screen asset picker.

The picker includes:

- a search input pinned near the top.
- category and availability filters.
- ready assets by default.
- recently selected or saved assets first, then market-cap rank.
- rows with icon, name, symbol, category, rank, current USD price, 24-hour change, and availability state.

Search matches asset name, symbol, and category. It does not search raw technical validation reasons.

Unavailable assets are hidden from the default ready list. If a user searches for a matching unavailable asset, the picker shows a disabled row with a friendly reason and expandable technical detail.

After selecting an asset:

- preserve the current selected date if it falls inside the new asset's historical date range.
- otherwise clamp the date to the nearest valid date for that asset.
- immediately fetch the selected/default year history for the chart.
- fetch other years on demand through React Query caching.
- block chart/date selection before the asset's first imported date and after its last imported date.

The Simulation flow remains one selected asset, one historical date, and one USD amount.

## Asset Availability

The internal asset statuses are:

- `ready`: historical data validates and CoinGecko market mapping is verified.
- `needs_market_mapping`: historical data is valid, but the CoinGecko market identity is missing or not verified.
- `historical_invalid`: the CSV asset exists but historical validation failed.

The public asset endpoint returns `ready` and `unavailable` lists. `needs_market_mapping` and `historical_invalid` assets both appear in `unavailable`.

Ready assets can still have live market data temporarily unavailable. In that case they remain selectable in the picker, but running a simulation depends on the current-price state.

Current-price policy:

- fresh market data runs normally.
- stale cached market data up to 24 hours old can be used only after explicit user acceptance.
- stale data older than 24 hours blocks simulation.
- no current price blocks simulation and offers retry.

## Backend Data Model

Add a D1 metadata table named `simulation_assets` that contains all 100 CSV directory entries.

Suggested fields:

- `asset_id`: stable public ID, using CoinGecko ID / CSV slug such as `bitcoin` or `avalanche-2`.
- `symbol`: display/search symbol such as `BTC`.
- `name`: display name.
- `csv_file_name`: source CSV filename.
- `category`: manual primary category for the picker.
- `status`: `ready`, `needs_market_mapping`, or `historical_invalid`.
- `historical_symbol`: current key into `historical_crypto_prices.asset_symbol`.
- `first_imported_date`.
- `last_imported_date`.
- `imported_row_count`.
- `missing_date_count`.
- `largest_gap_days`.
- `unavailable_reason`: user-friendly explanation.
- `unavailable_detail`: technical validation or mapping detail.
- `coin_gecko_id`: verified CoinGecko ID when available.
- `imported_at`.
- `updated_at`.

Do not migrate `historical_crypto_prices` from `asset_symbol` to `asset_id` in this slice. Historical lookups can use `simulation_assets.historical_symbol` internally while public APIs accept stable `assetId`.

The importer should generate or refresh the metadata table from `crypto_directory.csv`, historical coverage output, manual category mapping, and CoinGecko mapping verification.

## CoinGecko Integration

The project uses the CoinGecko Demo plan.

Use:

- base URL: `https://api.coingecko.com/api/v3`.
- auth header: `x-cg-demo-api-key`.
- market endpoint: `GET /coins/markets`.

The Worker should use `/coins/markets` for picker enrichment because it provides rank, image, current price, market cap, and 24-hour movement. Market enrichment should be cached in the Worker. If CoinGecko fails, the asset catalog endpoint still returns historical-ready assets with market status set to stale or unavailable.

CoinGecko IDs must come from a verified mapping table. CSV slugs are good candidates, but assets should become `ready` only after historical validation and CoinGecko identity verification pass. Ambiguous symbols must not be resolved at runtime by guessing.

Manual primary categories are the v2 source of truth for picker filters. CoinGecko tags can be optional enrichment later.

Initial category vocabulary:

- `Crypto`
- `Stablecoin`
- `Meme`
- `Exchange Token`
- `Layer 1`
- `Layer 2`
- `DeFi`
- `Oracle`
- `Privacy`
- `Tokenized Asset`
- `Other`

## API Contract

Add:

```text
GET /api/simulation/assets
```

Response:

```ts
{
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
    marketCacheStatus: 'fresh' | 'stale' | 'unavailable';
  };
}
```

Catalog item:

```ts
{
  assetId: string;
  symbol: string;
  name: string;
  category: string;
  status: 'ready' | 'needs_market_mapping' | 'historical_invalid';
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
    status: 'fresh' | 'stale' | 'unavailable';
  };
  availability: {
    canSimulate: boolean;
    reason: string | null;
    detail: string | null;
  };
}
```

`GET /api/simulation/prices` and `GET /api/simulation/history` should accept `assetId` as the canonical parameter:

```text
GET /api/simulation/prices?assetId=bitcoin&date=2021-01-01&amountUsd=100
GET /api/simulation/history?assetId=bitcoin&year=2021
```

Keep the existing `asset` symbol parameter temporarily for BTC, ETH, and SOL compatibility.

## Saved Simulations

Saved simulations should use a hybrid snapshot model:

- store stable `assetId`.
- store display metadata snapshot: symbol, name, category, and image URL when available.
- store input, result, and source metadata snapshot.
- keep enough stable IDs for future grouping or refresh.

Saved simulations remain hypothetical snapshots, not live holdings.

## Metrics

Primary metric:

- `crypto.simulation.asset_picker.selected`

Supporting metrics:

- `crypto.simulation.asset_picker.opened`
- `crypto.simulation.asset_picker.search`
- `crypto.simulation.asset_picker.unavailable_viewed`
- `crypto.client.simulation_assets.fetch`
- `crypto.api.simulation_assets.market_coingecko`
- `crypto.api.simulation_assets.market_cache`

Selection metadata should include:

- `assetId`
- `symbol`
- `category`
- `rank`
- `searchActive`
- `queryLength`
- `source`: `recent`, `ranked`, `search`, or `saved`

Measurement baseline:

- Before: Simulation supports 3 hard-coded assets and expanded asset selection is impossible and unmeasured.
- After: Simulation exposes the imported ready asset catalog, unavailable CSV assets are discoverable through search, and picker open/search/select/unavailable interactions are measured.

## Test Plan

Backend tests:

- metadata generation includes all 100 CSV directory assets.
- ready assets include historical date ranges and coverage metadata.
- invalid CSV assets become `historical_invalid`.
- market mapping failures become `needs_market_mapping`.
- `/api/simulation/assets` returns split ready and unavailable lists.
- market enrichment handles fresh, stale, and unavailable CoinGecko states.
- `/api/simulation/prices` accepts canonical `assetId`.
- `/api/simulation/history` accepts canonical `assetId`.
- BTC/ETH/SOL symbol compatibility remains during migration.

Frontend tests:

- picker renders ready assets by default.
- search matches ready assets by name, symbol, and category.
- search can reveal unavailable matching assets.
- unavailable rows show friendly reason and technical detail.
- category and availability filters work.
- selecting an asset preserves date when valid.
- selecting an asset clamps date when previous date is outside range.
- selected asset fetches the default year history immediately.
- run action blocks unavailable current price.
- stale current price requires explicit acceptance.
- saved simulations snapshot asset metadata and stable asset IDs.
- metrics fire for picker open, search, selection, unavailable view, and asset fetch.

## Non-Goals

This expansion does not include:

- multi-asset comparison.
- portfolio basket simulation.
- purchasing-power comparison.
- full market screener filters.
- live trading, holdings, orders, transactions, or financial advice.
- migrating historical D1 primary keys from symbol to asset ID.
- repairing all invalid CSV assets in the same implementation slice, though the design supports graduating them later.

## Open Follow-Up

The UI density and picker ergonomics should be revisited after running the app on device. Row content, filter placement, and stale-price prompts may need adjustment once the interaction is felt in the real app.
