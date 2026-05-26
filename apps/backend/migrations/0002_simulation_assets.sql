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
