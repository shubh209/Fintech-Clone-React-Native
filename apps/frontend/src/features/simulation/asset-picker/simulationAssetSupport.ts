import { SimulationAssetCatalogItem } from '@shared/simulationAssetCatalogTypes';

export function getSelectedAssetAvailability(asset: SimulationAssetCatalogItem | null) {
  if (!asset) {
    return {
      canSimulate: true,
      reason: null,
      detail: null,
    };
  }

  if (asset.status === 'ready') {
    return {
      canSimulate: true,
      reason: null,
      detail: null,
    };
  }

  return asset.availability;
}
