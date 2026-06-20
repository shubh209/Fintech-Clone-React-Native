import { getCryptoApiUrl } from '@/features/crypto-market/api/getCryptoApiUrl';
import { timeAsync } from '@/shared/metrics/metrics';
import { isSimulationPriceResponse } from '@/shared/api/simulationValidators';
import { SimulationPriceResponse } from '@shared/simulationTypes';

export interface GetSimulationPriceParams {
  asset: string;
  date: string;
  amountUsd: number;
}

export async function getSimulationPrice({
  asset,
  date,
  amountUsd,
}: GetSimulationPriceParams): Promise<SimulationPriceResponse> {
  const query = new URLSearchParams({
    asset,
    date,
    amountUsd: String(amountUsd),
  });

  return timeAsync(
    'crypto.client.simulation_prices.fetch',
    async () => {
      const response = await fetch(getCryptoApiUrl(`/api/simulation/prices?${query.toString()}`));
      const payload = await response.json();

      if (!isSimulationPriceResponse(payload)) {
        throw new Error('Invalid simulation price response from cloud API');
      }

      return payload;
    },
    {
      asset,
      date,
    }
  );
}
