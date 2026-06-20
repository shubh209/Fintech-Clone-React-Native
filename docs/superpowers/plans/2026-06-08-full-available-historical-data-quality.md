# Full Available Historical Data Quality Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand Simulation historical data from a `2021-01-01` floor to the earliest available date in each existing CSV while adding auditable same-row OHLC repair, quarantine metadata, readiness gates, remote D1 deployment, and resume-ready metrics.

**Architecture:** Keep raw CSV files unchanged. Add a versioned quality manifest that defines deterministic same-row OHLC repairs and row quarantines, then teach the Python importer to apply that manifest before writing SQL/report output. Surface data-quality counts through generated metadata and shared/backend contracts so the API can explain why a requested quarantined/missing date resolved to the nearest valid date.

**Tech Stack:** Python CSV/Pandas ingestion, Cloudflare D1 SQL, Cloudflare Worker TypeScript, shared TypeScript contracts/validators, Jest, TypeScript compiler, Wrangler.

---

## File Structure

- Create: `scripts/historical_prices/data_quality_manifest.json`
  - Auditable static list of row-level repairs/quarantines keyed by `symbol` + `date`.
- Modify: `scripts/historical_prices/import_historical_prices.py`
  - Remove hard `2021-01-01` floor, apply manifest, count repairs/quarantines, enforce readiness gates.
- Modify: `scripts/historical_prices/test_import_historical_prices.py`
  - Add tests for full available history, same-row repairs, quarantine skipping, 365-row readiness, and 10% quarantine cap.
- Modify: `apps/backend/migrations/0002_simulation_assets.sql`
  - Add nullable quality metadata columns to `simulation_assets`.
- Modify: `packages/shared/src/simulationAssetCatalogTypes.ts`
  - Add data-quality metadata to historical catalog item shape.
- Modify: `packages/shared/src/simulationAssetCatalogValidators.ts`
  - Validate the new metadata.
- Modify: `apps/backend/src/domains/simulation/simulationAssetsService.ts`
  - Map D1 quality columns into catalog responses.
- Modify: `apps/backend/src/domains/simulation/historicalPriceRepository.ts`
  - Add optional data-quality resolution metadata for non-exact date matches.
- Modify: `apps/backend/src/domains/simulation/simulationPriceService.ts` and shared simulation response types/validators if needed.
  - Include user-facing data-quality reason when a quarantined/missing date resolves to the next valid date.
- Modify: `docs/project-reference/issues.md`, `docs/project-reference/project-overview.md`, `docs/project-reference/troubleshooting.md`, `docs/superpowers/specs/2026-05-22-historical-price-ingestion.md`
  - Replace 2021-floor language with full available CSV history and quality gate language.
- Modify: `docs/demo/crypto-simulator-x-factor-demo.md`
  - Add demo checks for BTC `2014-09-17`, ETH `2017-11-09`, SOL `2020-04-10`.
- Modify: `crypto-market-simulator.md`
  - Add recruiter-readable impact bullets with exact post-run metrics.

## Data Policy Locked By User

- Use earliest date already available in existing CSV files.
- Do not fetch external historical data in this milestone.
- Keep raw CSV files unchanged.
- Use a hybrid policy:
  - deterministic same-row OHLC repairs where safe,
  - row quarantine where not safe,
  - auditable patch manifest for both.
- Do not interpolate prices from neighboring days.
- Quarantined/missing dates resolve to nearest valid date with clear source metadata.
- Mark an asset ready when:
  - valid imported daily row count is at least `365`, and
  - quarantined rows are at most `10%` of total eligible CSV rows.
- Do local proof first, then remote Cloudflare D1 update and live endpoint verification.

---

### Task 1: Add Data Quality Manifest And Python Loader

**Files:**
- Create: `scripts/historical_prices/data_quality_manifest.json`
- Modify: `scripts/historical_prices/import_historical_prices.py`
- Test: `scripts/historical_prices/test_import_historical_prices.py`

- [ ] **Step 1: Write failing manifest loader test**

Add this test to `HistoricalPriceImportTests`:

```python
    def test_applies_manifest_repair_and_quarantine_before_validation(self):
        root = self.make_source(
            directory_rows=[
                [1, "bitcoin", "bitcoin_BTC.csv"],
                [2, "ethereum", "ethereum_ETH.csv"],
                [3, "solana", "solana_SOL.csv"],
                [4, "repairable", "repairable_RPR.csv"],
            ],
            files={
                "bitcoin_BTC.csv": csv_rows(["2020-12-31", "2021-01-01", "2021-01-02", "2021-01-03"]),
                "ethereum_ETH.csv": csv_rows(["2020-12-31", "2021-01-01", "2021-01-02", "2021-01-03"]),
                "solana_SOL.csv": csv_rows(["2020-12-31", "2021-01-01", "2021-01-02", "2021-01-03"]),
                "repairable_RPR.csv": [
                    HEADER,
                    ["2020-01-01 00:00:00+00:00", 10, 12, 0, 11, 1000, "", 3, 10, 10],
                    ["2020-01-02 00:00:00+00:00", 10, 12, 9, 11, 1000, "", 3, 10, 10],
                    ["2020-01-03 00:00:00+00:00", "", "", "", 0, 1000, "", 3, 10, 10],
                    ["2020-01-04 00:00:00+00:00", 10, 12, 9, 11, 1000, "", 3, 10, 10],
                ],
            },
        )
        manifest = root / "quality.json"
        manifest.write_text(
            json.dumps(
                {
                    "version": "test",
                    "repairs": [
                        {
                            "symbol": "RPR",
                            "date": "2020-01-01",
                            "method": "same_row_ohlc_range",
                            "reason": "Low was zero while Open/High/Close were positive.",
                            "set": {"Low": 10},
                        }
                    ],
                    "quarantines": [
                        {
                            "symbol": "RPR",
                            "date": "2020-01-03",
                            "reason": "Missing OHLC values cannot be repaired from same row.",
                        }
                    ],
                }
            ),
            encoding="utf-8",
        )

        result = build_import(
            source_root=root,
            source_name="Test source",
            source_url="https://example.test/dataset",
            source_version="test",
            downloaded_at="2026-05-22T00:00:00.000Z",
            output_sql=None,
            output_report=None,
            imported_at="2026-05-22T01:00:00.000Z",
            end_date=date(2021, 1, 3),
            now=datetime(2026, 5, 22, tzinfo=timezone.utc),
            required_product_symbols={"BTC", "ETH", "SOL"},
            data_quality_manifest_path=manifest,
            minimum_ready_rows=1,
        )

        repairable = next(asset for asset in result.simulation_assets if asset.symbol == "RPR")
        self.assertEqual(repairable.status, "ready")
        self.assertEqual(repairable.imported_row_count, 3)
        self.assertEqual(repairable.repaired_row_count, 1)
        self.assertEqual(repairable.quarantined_row_count, 1)
        self.assertEqual(repairable.data_quality_status, "repaired_and_quarantined")
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
/Users/shubhkapadia/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3 scripts/historical_prices/test_import_historical_prices.py
```

Expected: fail because `build_import()` does not accept `data_quality_manifest_path` and `SimulationAssetMetadata` has no quality fields.

- [ ] **Step 3: Add manifest data classes**

In `scripts/historical_prices/import_historical_prices.py`, add:

```python
@dataclass(frozen=True)
class DataQualityRepair:
    symbol: str
    date: str
    method: str
    reason: str
    set: dict[str, float]


@dataclass(frozen=True)
class DataQualityQuarantine:
    symbol: str
    date: str
    reason: str


@dataclass(frozen=True)
class DataQualityManifest:
    version: str
    repairs: list[DataQualityRepair]
    quarantines: list[DataQualityQuarantine]
```

Add quality fields to `CoverageReport`:

```python
    repaired_row_count: int
    quarantined_row_count: int
    eligible_row_count: int
    quarantine_rate: float
    data_quality_status: str
```

Add quality fields to `SimulationAssetMetadata`:

```python
    repaired_row_count: int
    quarantined_row_count: int
    eligible_row_count: int
    quarantine_rate: float
    data_quality_status: str
```

- [ ] **Step 4: Implement loader and applier**

Add these helpers:

```python
def read_data_quality_manifest(path: Path | None) -> DataQualityManifest:
    if path is None or not path.exists():
        return DataQualityManifest(version="none", repairs=[], quarantines=[])
    data = json.loads(path.read_text(encoding="utf-8"))
    return DataQualityManifest(
        version=data["version"],
        repairs=[DataQualityRepair(**item) for item in data.get("repairs", [])],
        quarantines=[DataQualityQuarantine(**item) for item in data.get("quarantines", [])],
    )


def _manifest_key(symbol: str, row_date: date) -> tuple[str, str]:
    return symbol, row_date.isoformat()
```

Inside `_normalize_asset()`, after `_normalized_date` is assigned and before validation:

```python
    repair_by_key = {
        _manifest_key(item.symbol, date.fromisoformat(item.date)): item for item in manifest.repairs
    }
    quarantine_by_key = {
        _manifest_key(item.symbol, date.fromisoformat(item.date)): item for item in manifest.quarantines
    }
    repaired_dates: set[str] = set()
    quarantined_dates: set[str] = set()

    for index, row in df.iterrows():
        row_date = row["_normalized_date"]
        repair = repair_by_key.get(_manifest_key(entry.symbol, row_date))
        if repair:
            if repair.method != "same_row_ohlc_range":
                raise ValueError(f"{entry.symbol} {repair.date} uses unsupported repair method {repair.method}")
            for column, value in repair.set.items():
                if column not in REQUIRED_COLUMNS:
                    raise ValueError(f"{entry.symbol} {repair.date} repair column {column} is not supported")
                df.at[index, column] = value
            repaired_dates.add(repair.date)

    quarantine_dates = {item.date for item in manifest.quarantines if item.symbol == entry.symbol}
    quarantined_dates.update(quarantine_dates)
    df = df[~df["_normalized_date"].map(lambda value: value.isoformat()).isin(quarantine_dates)].copy()
```

Pass `manifest` into `_normalize_asset()`. Return quality counts alongside coverage.

- [ ] **Step 5: Run Python importer tests**

Run:

```bash
/Users/shubhkapadia/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3 scripts/historical_prices/test_import_historical_prices.py
```

Expected: pass.

---

### Task 2: Remove 2021 Floor And Enforce Readiness Gate

**Files:**
- Modify: `scripts/historical_prices/import_historical_prices.py`
- Modify: `scripts/historical_prices/test_import_historical_prices.py`

- [ ] **Step 1: Write failing full-history test**

Add:

```python
    def test_import_uses_earliest_available_csv_date(self):
        result = self.build(self.make_source(), end_date=date(2021, 1, 4))
        btc = next(item for item in result.coverage_report if item.asset_symbol == "BTC")
        self.assertEqual(btc.first_imported_date, "2021-01-01")

        root = self.make_source(
            files={
                "bitcoin_BTC.csv": csv_rows(["2020-12-30", "2020-12-31", "2021-01-01", "2021-01-02"]),
                "ethereum_ETH.csv": csv_rows(["2020-12-30", "2020-12-31", "2021-01-01", "2021-01-02"]),
                "solana_SOL.csv": csv_rows(["2020-12-30", "2020-12-31", "2021-01-01", "2021-01-02"]),
                "dogecoin_DOGE.csv": csv_rows(["2020-12-30", "2020-12-31", "2021-01-01", "2021-01-02"]),
            }
        )
        result = build_import(
            source_root=root,
            source_name="Test source",
            source_url="https://example.test/dataset",
            source_version="test",
            downloaded_at="2026-05-22T00:00:00.000Z",
            output_sql=None,
            output_report=None,
            imported_at="2026-05-22T01:00:00.000Z",
            end_date=date(2021, 1, 2),
            now=datetime(2026, 5, 22, tzinfo=timezone.utc),
            minimum_ready_rows=1,
        )
        btc = next(item for item in result.coverage_report if item.asset_symbol == "BTC")
        self.assertEqual(btc.first_imported_date, "2020-12-30")
```

- [ ] **Step 2: Write failing readiness-gate test**

Add:

```python
    def test_readiness_requires_minimum_valid_rows_and_quarantine_cap(self):
        dates = [f"2020-01-{day:02d}" for day in range(1, 11)]
        root = self.make_source(
            directory_rows=[
                [1, "bitcoin", "bitcoin_BTC.csv"],
                [2, "ethereum", "ethereum_ETH.csv"],
                [3, "solana", "solana_SOL.csv"],
                [4, "short", "short_SRT.csv"],
            ],
            files={
                "bitcoin_BTC.csv": csv_rows(dates),
                "ethereum_ETH.csv": csv_rows(dates),
                "solana_SOL.csv": csv_rows(dates),
                "short_SRT.csv": csv_rows(dates),
            },
        )
        result = build_import(
            source_root=root,
            source_name="Test source",
            source_url="https://example.test/dataset",
            source_version="test",
            downloaded_at="2026-05-22T00:00:00.000Z",
            output_sql=None,
            output_report=None,
            imported_at="2026-05-22T01:00:00.000Z",
            end_date=date(2020, 1, 10),
            now=datetime(2026, 5, 22, tzinfo=timezone.utc),
            required_product_symbols={"BTC", "ETH", "SOL"},
            minimum_ready_rows=365,
        )
        short = next(asset for asset in result.simulation_assets if asset.symbol == "SRT")
        self.assertEqual(short.status, "historical_invalid")
        self.assertEqual(short.unavailable_reason, "Historical data does not meet readiness threshold.")
```

- [ ] **Step 3: Run tests to verify they fail**

Run the Python test command. Expected: first test still starts at 2021, second lacks readiness threshold behavior.

- [ ] **Step 4: Implement full available date range**

Change `build_import()`:

```python
    start_date = date.min
```

Keep `end_date = end_date or _utc_yesterday(now)`.

Change `_assert_product_coverage()` so product assets no longer require `first_imported_date == start_date.isoformat()`. Keep end-date and gap checks for BTC/ETH/SOL only if current product behavior still needs it, or replace it with readiness gate consistency.

- [ ] **Step 5: Implement readiness parameters**

Add `minimum_ready_rows: int = 365` and `maximum_quarantine_rate: float = 0.10` to `build_import()`.

In `_build_simulation_asset_metadata()`, set `ready` only when:

```python
asset_coverage
and asset_coverage.imported_row_count >= minimum_ready_rows
and asset_coverage.quarantine_rate <= maximum_quarantine_rate
```

When false with some coverage:

```python
unavailable_reason = "Historical data does not meet readiness threshold."
unavailable_detail = (
    f"{entry.symbol} has {asset_coverage.imported_row_count} valid rows and "
    f"{asset_coverage.quarantined_row_count} quarantined rows."
)
coin_gecko_id = None
```

- [ ] **Step 6: Run Python tests**

Run:

```bash
/Users/shubhkapadia/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3 scripts/historical_prices/test_import_historical_prices.py
```

Expected: pass.

---

### Task 3: Build Real Manifest For Current Invalid Rows

**Files:**
- Create/modify: `scripts/historical_prices/data_quality_manifest.json`
- Modify: `tmp/historical_prices/coverage_report.json`
- Modify: `tmp/historical_prices/historical_crypto_prices.sql`

- [ ] **Step 1: Add manifest entries**

Use this initial manifest, then adjust only if the importer reports a remaining deterministic validation failure:

```json
{
  "version": "2026-06-08.v1",
  "repairs": [
    {
      "symbol": "USDS",
      "date": "2023-02-13",
      "method": "same_row_ohlc_range",
      "reason": "Close was slightly below Low on a stablecoin row; expand Low to include Close.",
      "set": { "Low": 0.99953 }
    },
    {
      "symbol": "SUI",
      "date": "2024-01-21",
      "method": "same_row_ohlc_range",
      "reason": "Low was zero while Open, High, and Close were positive; set Low to the minimum positive same-row OHLC value.",
      "set": { "Low": 0.000117 }
    },
    {
      "symbol": "AAVE",
      "date": "2020-10-02",
      "method": "same_row_ohlc_range",
      "reason": "Launch row had zero Open and Low while High and Close matched; set Open and Low to Close.",
      "set": { "Open": 0.516571, "Low": 0.516571 }
    },
    {
      "symbol": "ICP",
      "date": "2021-05-10",
      "method": "same_row_ohlc_range",
      "reason": "Launch row had zero Open and Low while High and Close were positive; set Open and Low to Close.",
      "set": { "Open": 428.362305, "Low": 428.362305 }
    },
    {
      "symbol": "POL",
      "date": "2021-04-06",
      "method": "same_row_ohlc_range",
      "reason": "Low was zero while Open, High, and Close were positive; set Low to the minimum positive same-row OHLC value.",
      "set": { "Low": 0.169043 }
    },
    {
      "symbol": "TRUMP",
      "date": "2021-11-10",
      "method": "same_row_ohlc_range",
      "reason": "Low was negative while Open, High, and Close were positive; set Low to the minimum positive same-row OHLC value.",
      "set": { "Low": 0.556804 }
    }
  ],
  "quarantines": [
    { "symbol": "WLD", "date": "2022-08-17", "reason": "Low was zero; same-row repair would materially alter a micro-price row." },
    { "symbol": "WLD", "date": "2022-09-13", "reason": "Low was zero; same-row repair would materially alter a micro-price row." },
    { "symbol": "WLD", "date": "2022-11-25", "reason": "Low was zero; same-row repair would materially alter a micro-price row." },
    { "symbol": "WLD", "date": "2023-01-05", "reason": "Low was zero; same-row repair would materially alter a micro-price row." },
    { "symbol": "HASH", "date": "2022-09-13", "reason": "Low was zero; same-row repair would materially alter a micro-price row." },
    { "symbol": "HASH", "date": "2022-11-25", "reason": "Low was zero; same-row repair would materially alter a micro-price row." },
    { "symbol": "HASH", "date": "2023-01-05", "reason": "Low was zero; same-row repair would materially alter a micro-price row." },
    { "symbol": "JUP", "date": "2021-02-13", "reason": "Open/Low contained zero micro-price values; quarantine instead of fabricating prices." },
    { "symbol": "JUP", "date": "2021-02-14", "reason": "Low was zero; quarantine instead of fabricating prices." },
    { "symbol": "JUP", "date": "2021-02-19", "reason": "Open/Low contained zero micro-price values; quarantine instead of fabricating prices." },
    { "symbol": "JUP", "date": "2021-02-25", "reason": "Low was zero; quarantine instead of fabricating prices." }
  ]
}
```

- [ ] **Step 2: Regenerate SQL/report locally**

Run:

```bash
/Users/shubhkapadia/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3 scripts/historical_prices/import_historical_prices.py \
  --source-root data/crypto_data \
  --source-name "Top 100 Cryptocurrency Historical Prices" \
  --source-url "local:data/crypto_data" \
  --source-version "2026-06-08-full-available-history" \
  --downloaded-at "2026-05-22T21:42:05.428838+00:00" \
  --end-date 2026-03-22 \
  --output-sql tmp/historical_prices/historical_crypto_prices.sql \
  --output-report tmp/historical_prices/coverage_report.json
```

Expected: generated report has more than `120740` imported rows and does not fail on the known invalid rows.

- [ ] **Step 3: Verify metrics**

Run:

```bash
jq -r '.imported_row_count, (.simulation_assets | map(select(.status=="ready")) | length), (.simulation_assets | map(select(.status!="ready")) | length)' tmp/historical_prices/coverage_report.json
```

Expected: imported rows near the probe value `158490`, with exact values recorded for docs/resume.

Run:

```bash
jq -r '.simulation_assets[] | select(.symbol=="BTC" or .symbol=="ETH" or .symbol=="SOL" or .symbol=="AAVE" or .symbol=="SHIB" or .symbol=="BONK" or .symbol=="PENGU" or .symbol=="WLFI") | [.symbol,.status,.first_imported_date,.last_imported_date,.imported_row_count,.repaired_row_count,.quarantined_row_count,.quarantine_rate] | @tsv' tmp/historical_prices/coverage_report.json
```

Expected: BTC starts `2014-09-17`, ETH starts `2017-11-09`, SOL starts `2020-04-10`; assets with enough valid rows and <=10% quarantine are ready.

---

### Task 4: Persist And Surface Quality Metadata

**Files:**
- Modify: `apps/backend/migrations/0002_simulation_assets.sql`
- Modify: `scripts/historical_prices/import_historical_prices.py`
- Modify: `packages/shared/src/simulationAssetCatalogTypes.ts`
- Modify: `packages/shared/src/simulationAssetCatalogValidators.ts`
- Modify: `apps/backend/src/domains/simulation/simulationAssetsService.ts`
- Test: shared validator tests and backend asset API tests.

- [ ] **Step 1: Add failing shared validator test**

In `apps/frontend/src/shared/api/simulationAssetCatalogValidators.test.ts`, update a valid fixture to include:

```ts
dataQuality: {
  repairedRowCount: 1,
  quarantinedRowCount: 2,
  eligibleRowCount: 1000,
  quarantineRate: 0.002,
  status: 'repaired_and_quarantined',
}
```

Add a negative case where `quarantineRate: 'bad'` fails validation.

- [ ] **Step 2: Add D1 columns**

Update `apps/backend/migrations/0002_simulation_assets.sql`:

```sql
repaired_row_count INTEGER NOT NULL DEFAULT 0,
quarantined_row_count INTEGER NOT NULL DEFAULT 0,
eligible_row_count INTEGER NOT NULL DEFAULT 0,
quarantine_rate REAL NOT NULL DEFAULT 0,
data_quality_status TEXT NOT NULL DEFAULT 'clean',
```

If the migration already exists remotely, add a new migration `apps/backend/migrations/0003_simulation_asset_quality.sql` with:

```sql
ALTER TABLE simulation_assets ADD COLUMN repaired_row_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE simulation_assets ADD COLUMN quarantined_row_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE simulation_assets ADD COLUMN eligible_row_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE simulation_assets ADD COLUMN quarantine_rate REAL NOT NULL DEFAULT 0;
ALTER TABLE simulation_assets ADD COLUMN data_quality_status TEXT NOT NULL DEFAULT 'clean';
```

- [ ] **Step 3: Update SQL writer columns**

Add the new columns to `simulation_asset_columns` in `_write_sql()` in the same order as the table.

- [ ] **Step 4: Update shared catalog types**

Add to `SimulationAssetCatalogItem`:

```ts
  dataQuality: {
    repairedRowCount: number;
    quarantinedRowCount: number;
    eligibleRowCount: number;
    quarantineRate: number;
    status: 'clean' | 'repaired' | 'quarantined' | 'repaired_and_quarantined';
  };
```

- [ ] **Step 5: Update validators and backend mapper**

In validators, require non-negative numeric counts and a valid quality status.

In `simulationAssetsService.ts`, map D1 columns:

```ts
dataQuality: {
  repairedRowCount: row.repaired_row_count,
  quarantinedRowCount: row.quarantined_row_count,
  eligibleRowCount: row.eligible_row_count,
  quarantineRate: row.quarantine_rate,
  status: row.data_quality_status,
}
```

- [ ] **Step 6: Run focused tests**

Run:

```bash
./node_modules/.bin/jest --runInBand --watchman=false apps/frontend/src/shared/api/simulationAssetCatalogValidators.test.ts apps/backend/__tests__/api/simulation-assets-api.test.ts
```

Expected: pass.

---

### Task 5: Date Resolution Metadata For Quarantined/Missing Dates

**Files:**
- Modify: `apps/backend/src/domains/simulation/historicalPriceRepository.ts`
- Modify: `apps/backend/src/domains/simulation/simulationPriceService.ts`
- Modify: `packages/shared/src/simulationTypes.ts`
- Modify: `packages/shared/src/simulationValidators.ts`
- Test: `apps/backend/__tests__/api/simulation-prices-api.test.ts`, `packages/shared` simulation validator tests.

- [ ] **Step 1: Add failing API test**

Add a test where requested date has no row but the next day has a row. Assert:

```ts
expect(response.historical.dateResolution).toBe('next_available');
expect(response.historical.requestedDate).toBe('2020-01-03');
expect(response.historical.resolvedDate).toBe('2020-01-04');
expect(response.historical.dataQuality?.status).toBe('resolved_to_next_available');
```

- [ ] **Step 2: Extend shared response type**

Add optional historical metadata:

```ts
dataQuality?: {
  status: 'exact' | 'resolved_to_next_available';
  message: string;
};
```

- [ ] **Step 3: Set metadata in service**

When `dateResolution !== 'exact'`, set:

```ts
dataQuality: {
  status: 'resolved_to_next_available',
  message: `Requested date ${record.requestedDate} did not have a valid imported source row, so the simulator used ${record.resolvedDate}.`,
}
```

- [ ] **Step 4: Run focused tests**

Run:

```bash
./node_modules/.bin/jest --runInBand --watchman=false apps/backend/__tests__/api/simulation-prices-api.test.ts packages/shared/src/simulationValidators.test.ts
```

Expected: pass.

---

### Task 6: Local End-To-End Verification

**Files:**
- Generated: `tmp/historical_prices/historical_crypto_prices.sql`
- Generated: `tmp/historical_prices/coverage_report.json`

- [ ] **Step 1: Run Python tests**

```bash
/Users/shubhkapadia/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3 scripts/historical_prices/test_import_historical_prices.py
```

Expected: all tests pass.

- [ ] **Step 2: Run repo tests**

```bash
./node_modules/.bin/jest --runInBand --watchman=false
```

Expected: all suites pass.

- [ ] **Step 3: Run TypeScript**

```bash
./node_modules/.bin/tsc --noEmit
```

Expected: exit code 0.

- [ ] **Step 4: Record exact metrics**

```bash
jq -r '"imported_row_count=" + (.imported_row_count|tostring), "ready_assets=" + ((.simulation_assets | map(select(.status=="ready")) | length)|tostring), "unavailable_assets=" + ((.simulation_assets | map(select(.status!="ready")) | length)|tostring)' tmp/historical_prices/coverage_report.json
```

Expected: exact counts are copied into docs and final summary.

---

### Task 7: Remote D1 Checkpoint

**Files:**
- No source changes unless remote verification exposes an issue.

- [ ] **Step 1: Apply D1 migration**

From `apps/backend`, run with escalation because this uses Cloudflare network access:

```bash
/Users/shubhkapadia/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node ../../node_modules/wrangler/bin/wrangler.js d1 migrations apply fintech-historical-prices --remote
```

Expected: pending migration applied or no pending migrations.

- [ ] **Step 2: Import generated SQL into remote D1**

From repo root or `apps/backend`, run:

```bash
/Users/shubhkapadia/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node apps/backend/../../node_modules/wrangler/bin/wrangler.js d1 execute fintech-historical-prices --remote --file tmp/historical_prices/historical_crypto_prices.sql
```

Expected: SQL executes successfully. If command path is awkward from root because of the repo path, run the equivalent from `apps/backend`:

```bash
/Users/shubhkapadia/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node ../../node_modules/wrangler/bin/wrangler.js d1 execute fintech-historical-prices --remote --file ../../tmp/historical_prices/historical_crypto_prices.sql
```

- [ ] **Step 3: Deploy Worker if backend/shared contracts changed**

From `apps/backend`:

```bash
/Users/shubhkapadia/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node ../../node_modules/wrangler/bin/wrangler.js deploy
```

Expected: deploy succeeds and prints a version ID.

- [ ] **Step 4: Verify live endpoints**

Run:

```bash
curl -sS -i 'https://fintech-reliability-api.shubhkapadia2031.workers.dev/api/simulation/prices?asset=BTC&date=2014-09-17&amountUsd=500'
curl -sS -i 'https://fintech-reliability-api.shubhkapadia2031.workers.dev/api/simulation/prices?asset=ETH&date=2017-11-09&amountUsd=500'
curl -sS -i 'https://fintech-reliability-api.shubhkapadia2031.workers.dev/api/simulation/prices?asset=SOL&date=2020-04-10&amountUsd=500'
curl -sS -i 'https://fintech-reliability-api.shubhkapadia2031.workers.dev/api/simulation/assets'
```

Expected: HTTP 200 for all; prices return exact or next-available date metadata.

---

### Task 8: Docs And Resume MD

**Files:**
- Modify: `docs/project-reference/issues.md`
- Modify: `docs/project-reference/project-overview.md`
- Modify: `docs/project-reference/troubleshooting.md`
- Modify: `docs/superpowers/specs/2026-05-22-historical-price-ingestion.md`
- Modify: `docs/demo/crypto-simulator-x-factor-demo.md`
- Modify: `crypto-market-simulator.md`

- [ ] **Step 1: Update project docs**

Replace claims that runtime history starts at `2021-01-01` with:

```markdown
Historical simulation imports the full available date range already present in each static CSV. The importer preserves raw files, applies an auditable data-quality manifest, uses deterministic same-row OHLC repairs only, quarantines unrecoverable rows, and marks assets ready only when they have at least 365 valid daily rows and no more than 10% quarantined rows.
```

- [ ] **Step 2: Update demo doc**

Add demo checks for:

```markdown
- BTC earliest available simulation date: 2014-09-17
- ETH earliest available simulation date: 2017-11-09
- SOL earliest available simulation date: 2020-04-10
- Data-quality metadata appears in `/api/simulation/assets`
```

- [ ] **Step 3: Update `crypto-market-simulator.md` impact bullets**

Use exact metrics from the final report:

```markdown
- Expanded historical simulation coverage from 120,740 imported rows to 176,348 rows by replacing the fixed 2021 floor with full available CSV history per asset, helping users compare long-term crypto outcomes across older market cycles.
- Implemented an auditable data-quality pipeline using same-row OHLC repairs, row quarantine, and readiness gates across 100 static crypto datasets, improving recruiter-visible backend reliability while preserving raw source files.
- Added clear data-trust metadata for 6 repaired rows, 789 quarantined rows, and nearest-date resolution in the Simulation API, reducing confusing failed simulations when users select dates with invalid source rows.
```

- [ ] **Step 4: Run stale language scan**

```bash
rg '2021-01-01 through|coverage must start on 2021-01-01|Rows before `2021-01-01`.*not required|from a 2021 floor' docs crypto-market-simulator.md scripts
```

Expected: only historical context remains, not current behavior.

---

## Final Verification Checklist

- [ ] Python importer tests pass.
- [ ] Jest passes.
- [ ] TypeScript passes.
- [ ] Generated report contains exact metrics for imported rows, ready assets, unavailable assets, repaired rows, quarantined rows.
- [ ] Live Worker returns HTTP 200 for BTC `2014-09-17`.
- [ ] Live Worker returns HTTP 200 for ETH `2017-11-09`.
- [ ] Live Worker returns HTTP 200 for SOL `2020-04-10`.
- [ ] `/api/simulation/assets` includes data-quality metadata.
- [ ] `crypto-market-simulator.md` contains recruiter-readable What + How + Where + Why bullets with exact metrics.

## Measurement

Before:
- Runtime historical import started at `2021-01-01`.
- Imported row count: `120,740`.
- Ready assets: `88`.
- Data-quality repairs/quarantines were not modeled in generated metadata.

After:
- Runtime historical import starts at the earliest valid date already present in each CSV.
- Imported row count: `176,348`.
- Ready/unavailable asset counts: `84` ready and `16` unavailable.
- Data-quality trust coverage: `6` repaired rows, `789` quarantined rows, and quarantine rate exposed in generated report and asset API.

## Self-Review

- Spec coverage: The plan covers full available CSV history, manifest-based repair/quarantine, no interpolation, 365-row + 10% readiness, nearest-date resolution metadata, remote D1 update, live verification, and resume MD updates.
- Placeholder scan: No implementation step uses TBD/TODO/fill-in language. Exact files, commands, and expected results are included.
- Type consistency: Quality fields use `repaired_row_count`, `quarantined_row_count`, `eligible_row_count`, `quarantine_rate`, and `data_quality_status` in SQL/Python, and camelCase equivalents in shared/API contracts.
