import { SimulationAssetCatalogItem } from '@shared/simulationAssetCatalogTypes';

export const SUPPORTED_SIMULATION_SYMBOLS = [
  'BTC',
  'ETH',
  'USDT',
  'BNB',
  'USDC',
  'XRP',
  'SOL',
  'TRX',
  'HYPE',
  'DOGE',
  'USDS',
  'RAIN',
  'LEO',
  'ZEC',
  'XLM',
  'WBT',
  'ADA',
  'LINK',
  'CC',
  'XMR',
];

export function isSupportedSimulationSymbol(symbol: string) {
  return SUPPORTED_SIMULATION_SYMBOLS.includes(symbol);
}

export function getSelectedAssetAvailability(asset: SimulationAssetCatalogItem | null) {
  if (!asset) {
    return {
      canSimulate: true,
      reason: null,
      detail: null,
    };
  }

  if (!isSupportedSimulationSymbol(asset.symbol)) {
    return {
      canSimulate: false,
      reason: 'Simulation supports the top 20 ready coins.',
      detail: `${asset.symbol} is in the database, but historical simulation is not enabled for this coin yet.`,
    };
  }

  return asset.availability;
}
