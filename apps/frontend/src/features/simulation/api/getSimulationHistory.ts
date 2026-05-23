import { getCryptoApiUrl } from '@/features/crypto-market/api/getCryptoApiUrl';
import { timeAsync } from '@/shared/metrics/metrics';
import { isSimulationHistoryResponse } from '@/shared/api/simulationValidators';
import { SimulationAssetSymbol, SimulationHistoryResponse } from '@shared/simulationTypes';

export interface GetSimulationHistoryParams {
  asset: SimulationAssetSymbol;
  year: number;
}

export async function getSimulationHistory({
  asset,
  year,
}: GetSimulationHistoryParams): Promise<SimulationHistoryResponse> {
  const query = new URLSearchParams({
    asset,
    year: String(year),
  });

  return timeAsync(
    'crypto.client.simulation_history.fetch',
    async () => {
      const response = await fetch(getCryptoApiUrl(`/api/simulation/history?${query.toString()}`));
      const payload = await response.json();

      if (!isSimulationHistoryResponse(payload)) {
        throw new Error('Invalid simulation history response from cloud API');
      }

      return payload;
    },
    {
      asset,
      year,
    }
  );
}
