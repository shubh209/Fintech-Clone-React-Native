import { SqlDatabase } from '../../../types';
import { SimulationSupportedAssetCandidate } from './simulationSupportedAssetTypes';
import { getTopSimulationAssetRankSql } from './topSimulationAssetScope';

interface SupportedSimulationAssetRow {
  asset_id: string;
  symbol: string;
  name: string;
  status: string;
  coin_gecko_id: string | null;
  historical_symbol: string;
  first_imported_date: string | null;
  last_imported_date: string | null;
  imported_row_count: number;
  market_rank: number | null;
}

function mapRow(row: SupportedSimulationAssetRow): SimulationSupportedAssetCandidate {
  return {
    assetId: row.asset_id,
    symbol: row.symbol,
    name: row.name,
    status: row.status,
    coinGeckoId: row.coin_gecko_id,
    historicalSymbol: row.historical_symbol,
    firstImportedDate: row.first_imported_date,
    lastImportedDate: row.last_imported_date,
    importedRowCount: row.imported_row_count,
    marketRank: row.market_rank,
  };
}

export async function listSupportedSimulationAssetCandidates({
  db,
}: {
  db: SqlDatabase;
}): Promise<SimulationSupportedAssetCandidate[]> {
  const rankSql = getTopSimulationAssetRankSql();
  const rows = await db
    .prepare(
      `SELECT
         asset_id,
         symbol,
         name,
         status,
         coin_gecko_id,
         historical_symbol,
         first_imported_date,
         last_imported_date,
         imported_row_count,
         CASE symbol ${rankSql} ELSE NULL END AS market_rank
       FROM simulation_assets
       ORDER BY symbol ASC`
    )
    .all<SupportedSimulationAssetRow>();

  return rows.results.map(mapRow);
}
