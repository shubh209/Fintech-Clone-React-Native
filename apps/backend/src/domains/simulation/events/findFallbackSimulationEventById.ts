import { buildSimulationMarketEventsForAsset } from './buildSimulationMarketEventsForAsset';

function getSymbolFromFallbackEventId(eventId: string) {
  const [symbol] = eventId.split('-', 1);
  return symbol ? symbol.toUpperCase() : null;
}

export function findFallbackSimulationEventById(eventId: string) {
  const assetSymbol = getSymbolFromFallbackEventId(eventId);
  if (!assetSymbol) return null;

  return buildSimulationMarketEventsForAsset(assetSymbol).find((item) => item.id === eventId) ?? null;
}
