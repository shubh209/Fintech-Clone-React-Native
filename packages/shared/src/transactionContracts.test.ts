import {
  isTransactionSnapshot,
  normalizeTransactionRecord,
  normalizeTransactionSnapshot,
} from './transactionContracts';

describe('transaction contracts', () => {
  it('normalizes transaction records for the cloud contract', () => {
    expect(
      normalizeTransactionRecord({
        id: 'tx-1',
        amount: -12,
        title: 'Coffee',
        date: '2024-01-02T12:00:00.000Z',
        category: '  Morning   Coffee ',
      })
    ).toEqual({
      id: 'tx-1',
      amount: -12,
      title: 'Coffee',
      date: '2024-01-02T12:00:00.000Z',
      category: 'morning coffee',
    });
  });

  it('rejects malformed cloud snapshots', () => {
    expect(
      isTransactionSnapshot({
        transactions: [
          {
            id: 'tx-1',
            amount: Number.NaN,
            title: 'Broken',
            date: 'not-a-date',
            category: 'other',
          },
        ],
        updatedAt: '2024-01-02T12:00:00.000Z',
      })
    ).toBe(false);
  });

  it('normalizes a valid snapshot and backfills missing categories', () => {
    expect(
      normalizeTransactionSnapshot({
        transactions: [
          {
            id: 'tx-1',
            amount: 25,
            title: 'Deposit',
            date: '2024-01-02T12:00:00.000Z',
          },
        ],
        updatedAt: '2024-01-02T12:01:00.000Z',
      })
    ).toEqual({
      transactions: [
        {
          id: 'tx-1',
          amount: 25,
          title: 'Deposit',
          date: '2024-01-02T12:00:00.000Z',
          category: 'income',
        },
      ],
      updatedAt: '2024-01-02T12:01:00.000Z',
    });
  });
});
