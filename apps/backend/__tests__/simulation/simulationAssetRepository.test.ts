import {
  findSimulationAssetByAssetId,
  findSimulationAssetBySymbol,
  listSimulationAssets,
} from '../../src/domains/simulation/simulationAssetRepository';
import { SqlDatabase } from '../../src/types';

function fakeDb(rows: Array<Record<string, unknown>>) {
  const calls: Array<{ query: string; values: unknown[] }> = [];
  const db = {
    prepare: (query: string) => ({
      bind: (...values: unknown[]) => {
        calls.push({ query, values });
        return {
          first: async () => {
            const [lookup] = values;

            if (query.includes('WHERE asset_id = ?')) {
              return rows.find((row) => row.asset_id === lookup) ?? null;
            }

            if (query.includes('WHERE symbol = ?')) {
              return rows.find((row) => row.symbol === lookup) ?? null;
            }

            return null;
          },
          all: async () => ({ results: [] }),
          run: async () => ({}),
          bind: () => {
            throw new Error('nested bind not used');
          },
        };
      },
      first: async () => null,
      all: async () => {
        calls.push({ query, values: [] });
        return {
          results: [...rows].sort((left, right) => {
            const statusOrder = String(left.status).localeCompare(String(right.status));
            return statusOrder || String(left.symbol).localeCompare(String(right.symbol));
          }),
        };
      },
      run: async () => ({}),
    }),
  } as unknown as SqlDatabase;

  return { db, calls };
}

const readyBitcoinRow = {
  asset_id: 'bitcoin',
  symbol: 'BTC',
  name: 'Bitcoin',
  csv_file_name: 'bitcoin_BTC.csv',
  category: 'Layer 1',
  status: 'ready',
  historical_symbol: 'BTC',
  first_imported_date: '2013-04-28',
  last_imported_date: '2026-03-22',
  imported_row_count: 4713,
  missing_date_count: 0,
  largest_gap_days: 1,
  unavailable_reason: null,
  unavailable_detail: null,
  coin_gecko_id: 'bitcoin',
  imported_at: '2026-05-26T00:00:00.000Z',
  updated_at: '2026-05-26T00:00:00.000Z',
};

const invalidAssetRow = {
  asset_id: 'bad-data-token',
  symbol: 'BAD',
  name: 'Bad Data Token',
  csv_file_name: 'bad-data-token_BAD.csv',
  category: 'Other',
  status: 'historical_invalid',
  historical_symbol: 'BAD',
  first_imported_date: null,
  last_imported_date: null,
  imported_row_count: 0,
  missing_date_count: 0,
  largest_gap_days: 0,
  unavailable_reason: 'Historical CSV invalid',
  unavailable_detail: 'missing Date column',
  coin_gecko_id: null,
  imported_at: '2026-05-26T00:00:00.000Z',
  updated_at: '2026-05-26T00:00:00.000Z',
};

describe('simulation asset repository', () => {
  it('lists simulation assets ordered by status then symbol and maps D1 rows', async () => {
    const { db, calls } = fakeDb([invalidAssetRow, readyBitcoinRow]);

    const result = await listSimulationAssets({ db });

    expect(calls[0].query).toContain('FROM simulation_assets');
    expect(calls[0].query).toContain('ORDER BY status ASC, symbol ASC');
    expect(result).toEqual([
      {
        assetId: 'bad-data-token',
        symbol: 'BAD',
        name: 'Bad Data Token',
        csvFileName: 'bad-data-token_BAD.csv',
        category: 'Other',
        status: 'historical_invalid',
        historicalSymbol: 'BAD',
        firstImportedDate: null,
        lastImportedDate: null,
        importedRowCount: 0,
        missingDateCount: 0,
        largestGapDays: 0,
        unavailableReason: 'Historical CSV invalid',
        unavailableDetail: 'missing Date column',
        coinGeckoId: null,
        importedAt: '2026-05-26T00:00:00.000Z',
        updatedAt: '2026-05-26T00:00:00.000Z',
      },
      {
        assetId: 'bitcoin',
        symbol: 'BTC',
        name: 'Bitcoin',
        csvFileName: 'bitcoin_BTC.csv',
        category: 'Layer 1',
        status: 'ready',
        historicalSymbol: 'BTC',
        firstImportedDate: '2013-04-28',
        lastImportedDate: '2026-03-22',
        importedRowCount: 4713,
        missingDateCount: 0,
        largestGapDays: 1,
        unavailableReason: null,
        unavailableDetail: null,
        coinGeckoId: 'bitcoin',
        importedAt: '2026-05-26T00:00:00.000Z',
        updatedAt: '2026-05-26T00:00:00.000Z',
      },
    ]);
  });

  it('finds a simulation asset by asset id with a bound lookup', async () => {
    const { db, calls } = fakeDb([readyBitcoinRow]);

    const result = await findSimulationAssetByAssetId({ db, assetId: 'bitcoin' });

    expect(calls[0].query).toContain('WHERE asset_id = ?');
    expect(calls[0].query).toContain('LIMIT 1');
    expect(calls[0].values).toEqual(['bitcoin']);
    expect(result?.assetId).toBe('bitcoin');
  });

  it('finds a simulation asset by symbol with a bound lookup', async () => {
    const { db, calls } = fakeDb([readyBitcoinRow]);

    const result = await findSimulationAssetBySymbol({ db, symbol: 'BTC' });

    expect(calls[0].query).toContain('WHERE symbol = ?');
    expect(calls[0].query).toContain('LIMIT 1');
    expect(calls[0].values).toEqual(['BTC']);
    expect(result?.symbol).toBe('BTC');
  });

  it('returns null when a lookup does not match an asset', async () => {
    const { db } = fakeDb([readyBitcoinRow]);

    const assetIdResult = await findSimulationAssetByAssetId({ db, assetId: 'missing' });
    const symbolResult = await findSimulationAssetBySymbol({ db, symbol: 'NOPE' });

    expect(assetIdResult).toBe(null);
    expect(symbolResult).toBe(null);
  });
});
