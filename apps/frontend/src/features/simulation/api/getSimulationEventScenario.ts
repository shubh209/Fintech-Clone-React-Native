import { getCryptoApiUrl } from '@/features/crypto-market/api/getCryptoApiUrl';
import { isSimulationEventScenarioResponse } from '@/shared/api/simulationValidators';
import { timeAsync } from '@/shared/metrics/metrics';
import {
  SimulationEventDelay,
  SimulationEventScenarioResponse,
} from '@shared/simulationTypes';

export interface GetSimulationEventScenarioParams {
  eventId: string;
  delay: SimulationEventDelay;
  amountUsd: number;
}

export async function getSimulationEventScenario({
  eventId,
  delay,
  amountUsd,
}: GetSimulationEventScenarioParams): Promise<SimulationEventScenarioResponse> {
  const query = new URLSearchParams({
    eventId,
    delay,
    amountUsd: String(amountUsd),
  });

  return timeAsync(
    'crypto.client.simulation_event_scenarios.fetch',
    async () => {
      const response = await fetch(
        getCryptoApiUrl(`/api/simulation/event-scenarios?${query.toString()}`)
      );
      const payload = await response.json();

      if (!isSimulationEventScenarioResponse(payload)) {
        throw new Error('Invalid simulation event scenario response from cloud API');
      }

      return payload;
    },
    {
      eventId,
      delay,
    }
  );
}
