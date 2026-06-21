import { SqlDatabase } from '../../../types';
import { selectReadySimulationAssets } from './simulationSupportedAssetSelection';
import { listSupportedSimulationAssetCandidates } from './simulationSupportedAssetRepository';
import { SimulationSupportedAsset } from './simulationSupportedAssetTypes';

export async function listSupportedSimulationAssets({
  db,
}: {
  db: SqlDatabase;
}): Promise<SimulationSupportedAsset[]> {
  const candidates = await listSupportedSimulationAssetCandidates({ db });
  return selectReadySimulationAssets(candidates);
}

export async function findSupportedSimulationAssetBySymbol({
  db,
  symbol,
}: {
  db: SqlDatabase;
  symbol: string;
}): Promise<SimulationSupportedAsset | null> {
  const normalizedSymbol = symbol.toUpperCase();
  const assets = await listSupportedSimulationAssets({ db });
  return assets.find((asset) => asset.symbol === normalizedSymbol) ?? null;
}
