import { TOP_SIMULATION_ASSET_SYMBOLS } from '../assets/topSimulationAssetScope';
import { buildSimulationMarketEventsForAsset } from './buildSimulationMarketEventsForAsset';

export function findFallbackSimulationEventById(eventId: string) {
  for (const assetSymbol of TOP_SIMULATION_ASSET_SYMBOLS) {
    const event = buildSimulationMarketEventsForAsset(assetSymbol).find((item) => item.id === eventId);
    if (event) return event;
  }

  return null;
}
