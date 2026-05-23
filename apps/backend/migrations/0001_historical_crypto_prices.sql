CREATE TABLE IF NOT EXISTS historical_crypto_prices (
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

CREATE INDEX IF NOT EXISTS idx_historical_crypto_prices_lookup
ON historical_crypto_prices (asset_symbol, date);

CREATE TABLE IF NOT EXISTS historical_price_imports (
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
