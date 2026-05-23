export const simulationAssets = {
  BTC: {
    symbol: 'BTC',
    name: 'Bitcoin',
    coinGeckoId: 'bitcoin',
    historicalKey: 'BTC',
  },
  ETH: {
    symbol: 'ETH',
    name: 'Ethereum',
    coinGeckoId: 'ethereum',
    historicalKey: 'ETH',
  },
  SOL: {
    symbol: 'SOL',
    name: 'Solana',
    coinGeckoId: 'solana',
    historicalKey: 'SOL',
  },
} as const;

export const simulationHistoricalDateRange = {
  min: '2021-01-01',
  max: '2026-03-22',
} as const;

export type SimulationAssetSymbol = keyof typeof simulationAssets;

export function isSimulationAssetSymbol(value: string): value is SimulationAssetSymbol {
  return value === 'BTC' || value === 'ETH' || value === 'SOL';
}

export function getSimulationAsset(symbol: SimulationAssetSymbol) {
  return simulationAssets[symbol];
}

export function getSimulationCoinGeckoIds() {
  return Object.values(simulationAssets).map((asset) => asset.coinGeckoId);
}
