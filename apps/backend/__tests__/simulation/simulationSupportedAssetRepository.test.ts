import { listSupportedSimulationAssetCandidates } from '../../src/domains/simulation/assets/simulationSupportedAssetRepository';
import { listSupportedSimulationAssets } from '../../src/domains/simulation/assets/simulationSupportedAssetService';
import { SqlDatabase } from '../../src/types';

function row(
  symbol: string,
  marketRank: number | null,
  overrides: Record<string, unknown> = {}
) {
  return {
    asset_id: symbol.toLowerCase(),
    symbol,
    name: symbol.toLowerCase(),
    status: 'ready',
    coin_gecko_id: symbol.toLowerCase(),
    historical_symbol: symbol,
    first_imported_date: '2021-01-01',
    last_imported_date: '2026-03-22',
    imported_row_count: 1000,
    market_rank: marketRank,
    ...overrides,
  };
}

function fakeDb(rows: Array<Record<string, unknown>>) {
  const calls: Array<{ query: string; values: unknown[] }> = [];
  const db = {
    prepare: (query: string) => ({
      bind: (...values: unknown[]) => {
        calls.push({ query, values });
        return {
          all: async () => ({ results: rows }),
          first: async () => null,
          run: async () => ({}),
          bind: () => {
            throw new Error('nested bind not used');
          },
        };
      },
      all: async () => {
        calls.push({ query, values: [] });
        return { results: rows };
      },
      first: async () => null,
      run: async () => ({}),
    }),
  } as unknown as SqlDatabase;

  return { db, calls };
}

describe('supported simulation asset repository', () => {
  it('lists candidate rows with market rank metadata', async () => {
    const { db, calls } = fakeDb([row('BNB', 4)]);

    const result = await listSupportedSimulationAssetCandidates({ db });

    expect(calls[0].query).toContain('FROM simulation_assets');
    expect(calls[0].query).toContain('market_rank');
    expect(result).toEqual([
      {
        assetId: 'bnb',
        symbol: 'BNB',
        name: 'bnb',
        status: 'ready',
        coinGeckoId: 'bnb',
        historicalSymbol: 'BNB',
        firstImportedDate: '2021-01-01',
        lastImportedDate: '2026-03-22',
        importedRowCount: 1000,
        marketRank: 4,
      },
    ]);
  });

  it('returns only top supported assets from the service', async () => {
    const approved = ['BTC', 'ETH', 'USDT', 'BNB'];
    const { db } = fakeDb([
      row('AAVE', 64),
      ...approved.map((symbol, index) => row(symbol, index + 1)),
      row('BAD', 2, { status: 'historical_invalid' }),
      row('MISS', 3, { coin_gecko_id: null }),
    ]);

    const result = await listSupportedSimulationAssets({ db, limit: 4 });

    expect(result.map((asset) => asset.symbol)).toEqual(approved);
  });
});
