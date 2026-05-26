import { SimulationAssetCatalogStatus } from '../../../../../packages/shared/src';
import { SqlDatabase } from '../../types';

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

export async function listSimulationAssets({
  db,
}: {
  db: SqlDatabase;
}): Promise<SimulationAssetMetadataRecord[]> {
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
}): Promise<SimulationAssetMetadataRecord | null> {
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
}): Promise<SimulationAssetMetadataRecord | null> {
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
