import {
  formatTransactionDate,
  getTransactionsNewestFirst,
  normalizeTransaction,
} from './transactionUtils';

describe('transaction utils', () => {
  it('normalizes Date values to persisted ISO strings', () => {
    const transaction = normalizeTransaction({
      id: 'tx-1',
      amount: 120,
      title: 'Added Money',
      date: new Date('2024-01-02T12:00:00.000Z'),
    });

    expect(transaction.date).toBe('2024-01-02T12:00:00.000Z');
  });

  it('formats persisted date strings for display', () => {
    expect(
      formatTransactionDate('2024-01-02T12:00:00.000Z', {
        locale: 'en-US',
        timeZone: 'UTC',
      })
    ).toBe('1/2/2024');
  });

  it('returns newest transactions first without mutating the original array', () => {
    const transactions = [
      { id: 'older', amount: 10, title: 'Older', date: '2024-01-01T12:00:00.000Z' },
      { id: 'newer', amount: 20, title: 'Newer', date: '2024-01-03T12:00:00.000Z' },
    ];

    const sorted = getTransactionsNewestFirst(transactions);

    expect(sorted.map((transaction) => transaction.id)).toEqual(['newer', 'older']);
    expect(transactions.map((transaction) => transaction.id)).toEqual(['older', 'newer']);
  });
});
