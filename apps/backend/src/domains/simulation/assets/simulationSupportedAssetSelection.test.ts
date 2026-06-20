import { selectTopSimulationAssets } from './simulationSupportedAssetSelection';
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

describe('selectTopSimulationAssets', () => {
  it('returns the approved top 20 ready assets by market rank', () => {
    const approvedSymbols = [
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
    const rows = [
      candidate('AAVE', 64),
      ...approvedSymbols.map((symbol, index) => candidate(symbol, index + 1)),
    ];

    expect(selectTopSimulationAssets(rows, 20).map((asset) => asset.symbol)).toEqual(
      approvedSymbols
    );
  });

  it('excludes non-ready rows and rows without CoinGecko IDs', () => {
    const selected = selectTopSimulationAssets(
      [
        candidate('BTC', 1),
        candidate('BAD', 2, { status: 'historical_invalid' }),
        candidate('MISS', 3, { coinGeckoId: null }),
        candidate('OUT', null),
        candidate('ETH', 4),
      ],
      20
    );

    expect(selected.map((asset) => asset.symbol)).toEqual(['BTC', 'ETH']);
  });
});
