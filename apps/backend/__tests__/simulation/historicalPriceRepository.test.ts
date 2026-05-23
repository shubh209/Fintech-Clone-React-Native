import {
  findHistoricalPrice,
  findHistoricalPriceSeries,
} from '../../src/domains/simulation/historicalPriceRepository';
import { SqlDatabase } from '../../src/types';

function fakeDb(rows: Array<Record<string, unknown>>) {
  const calls: unknown[][] = [];
  const db = {
    prepare: () => ({
      bind: (...values: unknown[]) => {
        calls.push(values);
        return {
          first: async () => {
            const [assetSymbol, requestedDate, upperBound] = values;
            return (
              rows
                .filter(
                  (row) =>
                    row.asset_symbol === assetSymbol &&
                    typeof row.date === 'string' &&
                    row.date >= String(requestedDate) &&
                    row.date <= String(upperBound)
                )
                .sort((left, right) => String(left.date).localeCompare(String(right.date)))[0] ??
              null
            );
          },
          all: async () => {
            const [assetSymbol, startDate, endDate] = values;
            return {
              results: rows
                .filter(
                  (row) =>
                    row.asset_symbol === assetSymbol &&
                    typeof row.date === 'string' &&
                    row.date >= String(startDate) &&
                    row.date <= String(endDate)
                )
                .sort((left, right) => String(left.date).localeCompare(String(right.date))),
            };
          },
          run: async () => ({}),
          bind: () => {
            throw new Error('nested bind not used');
          },
        };
      },
      first: async () => null,
      all: async () => ({ results: [] }),
      run: async () => ({}),
    }),
  } as unknown as SqlDatabase;

  return { db, calls };
}

const btcRow = {
  asset_symbol: 'BTC',
  asset_name: 'bitcoin',
  date: '2021-01-01',
  close_usd: 29374.15,
  source_name: 'Top 100 Cryptocurrency Historical Prices',
  source_path: 'crypto_top100/bitcoin_BTC.csv',
  source_version: '2026-05-22',
  imported_at: '2026-05-22T01:00:00.000Z',
};

describe('historical price repository', () => {
  it('returns exact date matches', async () => {
    const { db } = fakeDb([btcRow]);

    const result = await findHistoricalPrice({
      db,
      assetSymbol: 'BTC',
      requestedDate: '2021-01-01',
      historicalMaxDate: '2026-03-22',
    });

    expect(result?.assetSymbol).toBe('BTC');
    expect(result?.requestedDate).toBe('2021-01-01');
    expect(result?.resolvedDate).toBe('2021-01-01');
    expect(result?.dateResolution).toBe('exact');
    expect(result?.priceUsd).toBe(29374.15);
  });

  it('returns the next available date within 3 days', async () => {
    const { db } = fakeDb([{ ...btcRow, date: '2021-01-03' }]);

    const result = await findHistoricalPrice({
      db,
      assetSymbol: 'BTC',
      requestedDate: '2021-01-01',
      historicalMaxDate: '2026-03-22',
    });

    expect(result?.requestedDate).toBe('2021-01-01');
    expect(result?.resolvedDate).toBe('2021-01-03');
    expect(result?.dateResolution).toBe('next_available');
  });

  it('returns null when no bounded next date exists', async () => {
    const { db } = fakeDb([{ ...btcRow, date: '2021-01-05' }]);

    const result = await findHistoricalPrice({
      db,
      assetSymbol: 'BTC',
      requestedDate: '2021-01-01',
      historicalMaxDate: '2026-03-22',
    });

    expect(result).toBe(null);
  });

  it('caps next available lookup at the latest imported historical date', async () => {
    const { db, calls } = fakeDb([{ ...btcRow, date: '2021-01-04' }]);

    await findHistoricalPrice({
      db,
      assetSymbol: 'BTC',
      requestedDate: '2021-01-01',
      historicalMaxDate: '2021-01-02',
    });

    expect(calls[0]).toEqual(['BTC', '2021-01-01', '2021-01-02']);
  });

  it('returns historical chart points for an asset and date range', async () => {
    const { db } = fakeDb([
      btcRow,
      { ...btcRow, date: '2021-01-02', close_usd: 30000 },
      { ...btcRow, asset_symbol: 'ETH', date: '2021-01-01', close_usd: 750 },
    ]);

    const result = await findHistoricalPriceSeries({
      db,
      assetSymbol: 'BTC',
      startDate: '2021-01-01',
      endDate: '2021-01-31',
    });

    expect(result).toEqual({
      assetSymbol: 'BTC',
      assetName: 'bitcoin',
      points: [
        { date: '2021-01-01', priceUsd: 29374.15 },
        { date: '2021-01-02', priceUsd: 30000 },
      ],
      sourceName: 'Top 100 Cryptocurrency Historical Prices',
      sourcePath: 'crypto_top100/bitcoin_BTC.csv',
      sourceVersion: '2026-05-22',
      importedAt: '2026-05-22T01:00:00.000Z',
    });
  });
});
