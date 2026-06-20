import { SqlDatabase } from '../../../types';
import { selectTopSimulationAssets } from './simulationSupportedAssetSelection';
import { listSupportedSimulationAssetCandidates } from './simulationSupportedAssetRepository';
import { SimulationSupportedAsset } from './simulationSupportedAssetTypes';

export const TOP_SIMULATION_ASSET_LIMIT = 20;

export async function listSupportedSimulationAssets({
  db,
  limit = TOP_SIMULATION_ASSET_LIMIT,
}: {
  db: SqlDatabase;
  limit?: number;
}): Promise<SimulationSupportedAsset[]> {
  const candidates = await listSupportedSimulationAssetCandidates({ db });
  return selectTopSimulationAssets(candidates, limit);
}

export async function findSupportedSimulationAssetBySymbol({
  db,
  symbol,
  limit = TOP_SIMULATION_ASSET_LIMIT,
}: {
  db: SqlDatabase;
  symbol: string;
  limit?: number;
}): Promise<SimulationSupportedAsset | null> {
  const normalizedSymbol = symbol.toUpperCase();
  const assets = await listSupportedSimulationAssets({ db, limit });
  return assets.find((asset) => asset.symbol === normalizedSymbol) ?? null;
}
