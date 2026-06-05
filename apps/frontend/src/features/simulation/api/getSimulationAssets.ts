import { getCryptoApiUrl } from '@/features/crypto-market/api/getCryptoApiUrl';
import { isSimulationAssetCatalogResponse } from '@/shared/api/simulationAssetCatalogValidators';
import { timeAsync } from '@/shared/metrics/metrics';
import { SimulationAssetCatalogResponse } from '@shared/simulationAssetCatalogTypes';

export async function getSimulationAssets(): Promise<SimulationAssetCatalogResponse> {
  return timeAsync('crypto.client.simulation_assets.fetch', async () => {
    const response = await fetch(getCryptoApiUrl('/api/simulation/assets'));
    const payload = await response.json();

    if (!isSimulationAssetCatalogResponse(payload)) {
      throw new Error('Invalid simulation asset catalog response from cloud API');
    }

    return payload;
  });
}
