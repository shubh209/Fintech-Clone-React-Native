import {
  DEFAULT_TRANSACTION_CATEGORIES,
  filterTransactions,
  formatTransactionCategoryLabel,
  formatTransactionDate,
  getMonthlyTransactionSummary,
  getTransactionCategories,
  getTransactionsNewestFirst,
  inferTransactionCategory,
  normalizeTransaction,
  normalizePersistedTransactions,
  normalizeTransactionCategory,
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

  it('infers transaction categories from title and amount', () => {
    expect(inferTransactionCategory({ title: 'Added Money', amount: 100 })).toBe('income');
    expect(inferTransactionCategory({ title: 'Coffee Shop', amount: -8 })).toBe('food');
    expect(inferTransactionCategory({ title: 'Metro transfer', amount: -3 })).toBe('transport');
    expect(inferTransactionCategory({ title: 'Card payment', amount: -40 })).toBe('shopping');
  });

  it('normalizes missing categories with inferred categories', () => {
    const transaction = normalizeTransaction({
      id: 'tx-2',
      amount: -12,
      title: 'Lunch',
      date: '2024-01-02T12:00:00.000Z',
    });

    expect(transaction.category).toBe('food');
  });

  it('backfills categories for legacy persisted transactions', () => {
    expect(
      normalizePersistedTransactions([
        {
          id: 'legacy',
          amount: -8,
          title: 'Coffee Shop',
          date: '2024-01-02T12:00:00.000Z',
        },
      ])
    ).toEqual([
      {
        id: 'legacy',
        amount: -8,
        title: 'Coffee Shop',
        date: '2024-01-02T12:00:00.000Z',
        category: 'food',
      },
    ]);
  });

  it('filters transactions by query and category', () => {
    const transactions = [
      { id: 'income', amount: 100, title: 'Added Money', category: 'income' as const, date: '2024-01-01T12:00:00.000Z' },
      { id: 'coffee', amount: -8, title: 'Coffee Shop', category: 'food' as const, date: '2024-01-02T12:00:00.000Z' },
      { id: 'train', amount: -3, title: 'Metro Ride', category: 'transport' as const, date: '2024-01-03T12:00:00.000Z' },
    ];

    expect(filterTransactions(transactions, { query: 'coffee', category: 'all' }).map((transaction) => transaction.id)).toEqual(['coffee']);
    expect(filterTransactions(transactions, { query: '', category: 'transport' }).map((transaction) => transaction.id)).toEqual(['train']);
  });

  it('summarizes monthly income, spending, and net activity', () => {
    const summary = getMonthlyTransactionSummary(
      [
        { id: 'income', amount: 300, title: 'Added Money', category: 'income' as const, date: '2024-01-01T12:00:00.000Z' },
        { id: 'food', amount: -50, title: 'Dinner', category: 'food' as const, date: '2024-01-02T12:00:00.000Z' },
        { id: 'old', amount: -20, title: 'Old', category: 'shopping' as const, date: '2023-12-02T12:00:00.000Z' },
      ],
      { now: new Date('2024-01-20T12:00:00.000Z') }
    );

    expect(summary).toEqual({
      income: 300,
      spending: 50,
      net: 250,
      count: 2,
    });
  });

  it('normalizes custom category names before persistence', () => {
    expect(normalizeTransactionCategory('  Weekend   Dining  ')).toBe('weekend dining');
    expect(normalizeTransactionCategory('')).toBe('other');
    expect(normalizeTransactionCategory('     ')).toBe('other');
  });

  it('formats category labels for default and custom names', () => {
    expect(formatTransactionCategoryLabel('food')).toBe('Food');
    expect(formatTransactionCategoryLabel('weekend dining')).toBe('Weekend Dining');
  });

  it('keeps default categories first and adds custom categories from transactions', () => {
    const categories = getTransactionCategories([
      {
        id: 'custom',
        amount: -80,
        title: 'Dinner',
        category: 'weekend dining',
        date: '2024-01-02T12:00:00.000Z',
      },
      {
        id: 'default',
        amount: -8,
        title: 'Coffee',
        category: 'food',
        date: '2024-01-03T12:00:00.000Z',
      },
    ]);

    expect(categories.slice(0, DEFAULT_TRANSACTION_CATEGORIES.length)).toEqual(
      DEFAULT_TRANSACTION_CATEGORIES
    );
    expect(categories).toContain('weekend dining');
  });

  it('filters transactions by normalized custom category names', () => {
    const transactions = [
      {
        id: 'custom',
        amount: -80,
        title: 'Dinner',
        category: 'weekend dining',
        date: '2024-01-02T12:00:00.000Z',
      },
      {
        id: 'food',
        amount: -8,
        title: 'Coffee',
        category: 'food',
        date: '2024-01-03T12:00:00.000Z',
      },
    ];

    expect(
      filterTransactions(transactions, { query: '', category: ' Weekend   Dining ' }).map(
        (transaction) => transaction.id
      )
    ).toEqual(['custom']);
  });
});
