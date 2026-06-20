import { getCryptoApiUrl } from '@/features/crypto-market/api/getCryptoApiUrl';
import { isSimulationEventListResponse } from '@/shared/api/simulationValidators';
import { timeAsync } from '@/shared/metrics/metrics';
import { SimulationEventListResponse } from '@shared/simulationTypes';

export interface GetSimulationEventsParams {
  asset: string;
}

export async function getSimulationEvents({
  asset,
}: GetSimulationEventsParams): Promise<SimulationEventListResponse> {
  const query = new URLSearchParams({
    asset,
  });

  return timeAsync(
    'crypto.client.simulation_events.fetch',
    async () => {
      const response = await fetch(getCryptoApiUrl(`/api/simulation/events?${query.toString()}`));
      const payload = await response.json();

      if (!isSimulationEventListResponse(payload)) {
        throw new Error('Invalid simulation event list response from cloud API');
      }

      return payload;
    },
    {
      asset,
    }
  );
}
