import { selectReadySimulationAssets } from './simulationSupportedAssetSelection';
import { SimulationSupportedAssetCandidate } from './simulationSupportedAssetTypes';

function candidate(
  symbol: string,
  marketRank: number | null,
  overrides: Partial<SimulationSupportedAssetCandidate> = {}
): SimulationSupportedAssetCandidate {
  return {
    assetId: symbol.toLowerCase(),
    symbol,
    name: symbol.toLowerCase(),
    status: 'ready',
    coinGeckoId: symbol.toLowerCase(),
    historicalSymbol: symbol,
    firstImportedDate: '2021-01-01',
    lastImportedDate: '2026-03-22',
    importedRowCount: 1000,
    marketRank,
    ...overrides,
  };
}

describe('selectReadySimulationAssets', () => {
  it('returns all ready assets by market rank without a top-20 limit', () => {
    const rows = [
      candidate('AAVE', 64),
      candidate('BTC', 1),
      candidate('ETH', 2),
      candidate('BNB', 4),
    ];

    expect(selectReadySimulationAssets(rows).map((asset) => asset.symbol)).toEqual([
      'BTC',
      'ETH',
      'BNB',
      'AAVE',
    ]);
  });

  it('excludes non-ready rows and rows without CoinGecko IDs', () => {
    const selected = selectReadySimulationAssets(
      [
        candidate('BTC', 1),
        candidate('BAD', 2, { status: 'historical_invalid' }),
        candidate('MISS', 3, { coinGeckoId: null }),
        candidate('OUT', null),
        candidate('ETH', 4),
      ]
    );

    expect(selected.map((asset) => asset.symbol)).toEqual(['BTC', 'ETH', 'OUT']);
  });
});
