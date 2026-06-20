import { SimulationEventSummary } from '../../../../../../packages/shared/src';
import { buildSimulationMarketEventsForAsset } from './buildSimulationMarketEventsForAsset';

export function mergeSimulationEvents({
  assetSymbol,
  databaseEvents,
  minimumCount = 5,
}: {
  assetSymbol: string;
  databaseEvents: SimulationEventSummary[];
  minimumCount?: number;
}) {
  if (databaseEvents.length >= minimumCount) return databaseEvents;

  const seenIds = new Set(databaseEvents.map((event) => event.id));
  const fallbackEvents = buildSimulationMarketEventsForAsset(assetSymbol).filter(
    (event) => !seenIds.has(event.id)
  );

  return [...databaseEvents, ...fallbackEvents].slice(0, minimumCount);
}
