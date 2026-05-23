import { SqlDatabase } from '../../types';

export type HistoricalDateResolution = 'exact' | 'next_available';

export interface HistoricalPriceRecord {
  assetSymbol: string;
  assetName: string;
  requestedDate: string;
  resolvedDate: string;
  dateResolution: HistoricalDateResolution;
  priceUsd: number;
  sourceName: string;
  sourcePath: string;
  sourceVersion: string;
  importedAt: string;
}

export interface HistoricalPriceSeries {
  assetSymbol: string;
  assetName: string;
  points: Array<{
    date: string;
    priceUsd: number;
  }>;
  sourceName: string;
  sourcePath: string;
  sourceVersion: string;
  importedAt: string;
}

interface HistoricalPriceRow {
  asset_symbol: string;
  asset_name: string;
  date: string;
  close_usd: number;
  source_name: string;
  source_path: string;
  source_version: string;
  imported_at: string;
}

function addDays(date: string, days: number) {
  const value = new Date(`${date}T00:00:00.000Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

function minDate(left: string, right: string) {
  return left <= right ? left : right;
}

export async function findHistoricalPrice({
  db,
  assetSymbol,
  requestedDate,
  historicalMaxDate,
}: {
  db: SqlDatabase;
  assetSymbol: string;
  requestedDate: string;
  historicalMaxDate: string;
}): Promise<HistoricalPriceRecord | null> {
  const upperBound = minDate(addDays(requestedDate, 3), historicalMaxDate);
  const row = await db
    .prepare(
      `SELECT asset_symbol, asset_name, date, close_usd, source_name, source_path, source_version, imported_at
       FROM historical_crypto_prices
       WHERE asset_symbol = ?
         AND date >= ?
         AND date <= ?
       ORDER BY date ASC
       LIMIT 1`
    )
    .bind(assetSymbol, requestedDate, upperBound)
    .first<HistoricalPriceRow>();

  if (!row) return null;

  return {
    assetSymbol: row.asset_symbol,
    assetName: row.asset_name,
    requestedDate,
    resolvedDate: row.date,
    dateResolution: row.date === requestedDate ? 'exact' : 'next_available',
    priceUsd: row.close_usd,
    sourceName: row.source_name,
    sourcePath: row.source_path,
    sourceVersion: row.source_version,
    importedAt: row.imported_at,
  };
}

export async function findHistoricalPriceSeries({
  db,
  assetSymbol,
  startDate,
  endDate,
}: {
  db: SqlDatabase;
  assetSymbol: string;
  startDate: string;
  endDate: string;
}): Promise<HistoricalPriceSeries | null> {
  const rows = await db
    .prepare(
      `SELECT asset_symbol, asset_name, date, close_usd, source_name, source_path, source_version, imported_at
       FROM historical_crypto_prices
       WHERE asset_symbol = ?
         AND date >= ?
         AND date <= ?
       ORDER BY date ASC`
    )
    .bind(assetSymbol, startDate, endDate)
    .all<HistoricalPriceRow>();

  if (rows.results.length === 0) return null;

  const first = rows.results[0];
  return {
    assetSymbol: first.asset_symbol,
    assetName: first.asset_name,
    points: rows.results.map((row) => ({
      date: row.date,
      priceUsd: row.close_usd,
    })),
    sourceName: first.source_name,
    sourcePath: first.source_path,
    sourceVersion: first.source_version,
    importedAt: first.imported_at,
  };
}
