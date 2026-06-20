export const TOP_SIMULATION_ASSET_SYMBOLS = [
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
] as const;

export function getTopSimulationAssetRankSql() {
  return TOP_SIMULATION_ASSET_SYMBOLS.map(
    (symbol, index) => `WHEN '${symbol}' THEN ${index + 1}`
  ).join(' ');
}
