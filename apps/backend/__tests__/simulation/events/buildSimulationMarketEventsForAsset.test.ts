import { TOP_SIMULATION_ASSET_SYMBOLS } from '../../../src/domains/simulation/assets/topSimulationAssetScope';
import { buildSimulationMarketEventsForAsset } from '../../../src/domains/simulation/events/buildSimulationMarketEventsForAsset';

describe('buildSimulationMarketEventsForAsset', () => {
  it('creates five sourced fallback events for every top-20 simulation asset', () => {
    for (const symbol of TOP_SIMULATION_ASSET_SYMBOLS) {
      const events = buildSimulationMarketEventsForAsset(symbol);

      expect(events).toHaveLength(5);
      expect(events.every((event) => event.assetSymbol === symbol)).toBe(true);
      expect(events.every((event) => event.id.startsWith(`${symbol.toLowerCase()}-`))).toBe(true);
      expect(events.every((event) => event.sources.length >= 2)).toBe(true);
    }
  });

  it('uses pre-2024 templates for assets whose imported history ends before 2024', () => {
    for (const symbol of ['USDS', 'CC']) {
      const events = buildSimulationMarketEventsForAsset(symbol);

      expect(events.every((event) => event.eventDate <= '2022-11-11')).toBe(true);
    }
  });
});
