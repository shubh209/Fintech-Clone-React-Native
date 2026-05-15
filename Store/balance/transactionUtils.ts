export type TransactionCategory =
  | 'income'
  | 'food'
  | 'transport'
  | 'shopping'
  | 'crypto'
  | 'other';

export interface PersistedTransaction {
  id: string;
  amount: number;
  date: string;
  title: string;
  category: TransactionCategory;
}

export interface TransactionInput {
  id: string;
  amount: number;
  date: Date | string | number;
  title: string;
  category?: TransactionCategory;
}

interface DateFormatOptions {
  locale?: string;
  timeZone?: string;
}

export function normalizeTransaction(transaction: TransactionInput): PersistedTransaction {
  return {
    ...transaction,
    date: new Date(transaction.date).toISOString(),
    category: transaction.category ?? inferTransactionCategory(transaction),
  };
}

export function normalizePersistedTransactions(
  transactions: Array<Omit<PersistedTransaction, 'category'> & Partial<Pick<PersistedTransaction, 'category'>>>
): PersistedTransaction[] {
  return transactions.map((transaction) => ({
    ...transaction,
    category: transaction.category ?? inferTransactionCategory(transaction),
  }));
}

export function formatTransactionDate(
  date: string,
  { locale, timeZone }: DateFormatOptions = {}
) {
  return new Date(date).toLocaleDateString(locale, timeZone ? { timeZone } : undefined);
}

export function getTransactionsNewestFirst<T extends Pick<PersistedTransaction, 'date'>>(
  transactions: T[]
) {
  return [...transactions].sort(
    (first, second) => Date.parse(second.date) - Date.parse(first.date)
  );
}

export function inferTransactionCategory({
  title,
  amount,
}: Pick<TransactionInput, 'title' | 'amount'>): TransactionCategory {
  const normalizedTitle = title.toLowerCase();

  if (amount > 0 || normalizedTitle.includes('added') || normalizedTitle.includes('deposit')) {
    return 'income';
  }

  if (
    normalizedTitle.includes('coffee') ||
    normalizedTitle.includes('lunch') ||
    normalizedTitle.includes('dinner') ||
    normalizedTitle.includes('food')
  ) {
    return 'food';
  }

  if (
    normalizedTitle.includes('metro') ||
    normalizedTitle.includes('train') ||
    normalizedTitle.includes('ride') ||
    normalizedTitle.includes('transfer')
  ) {
    return 'transport';
  }

  if (
    normalizedTitle.includes('card') ||
    normalizedTitle.includes('shop') ||
    normalizedTitle.includes('payment')
  ) {
    return 'shopping';
  }

  if (normalizedTitle.includes('crypto') || normalizedTitle.includes('bitcoin')) {
    return 'crypto';
  }

  return 'other';
}

export function filterTransactions<T extends PersistedTransaction>(
  transactions: T[],
  {
    query,
    category,
  }: {
    query: string;
    category: TransactionCategory | 'all';
  }
) {
  const normalizedQuery = query.trim().toLowerCase();

  return transactions.filter((transaction) => {
    const matchesQuery =
      normalizedQuery.length === 0 ||
      transaction.title.toLowerCase().includes(normalizedQuery) ||
      transaction.amount.toString().includes(normalizedQuery);
    const matchesCategory = category === 'all' || transaction.category === category;

    return matchesQuery && matchesCategory;
  });
}

export function getMonthlyTransactionSummary<T extends Pick<PersistedTransaction, 'amount' | 'date'>>(
  transactions: T[],
  { now = new Date() }: { now?: Date } = {}
) {
  const month = now.getMonth();
  const year = now.getFullYear();
  const monthlyTransactions = transactions.filter((transaction) => {
    const transactionDate = new Date(transaction.date);
    return transactionDate.getMonth() === month && transactionDate.getFullYear() === year;
  });
  const income = monthlyTransactions
    .filter((transaction) => transaction.amount > 0)
    .reduce((total, transaction) => total + transaction.amount, 0);
  const spending = Math.abs(
    monthlyTransactions
      .filter((transaction) => transaction.amount < 0)
      .reduce((total, transaction) => total + transaction.amount, 0)
  );

  return {
    income,
    spending,
    net: income - spending,
    count: monthlyTransactions.length,
  };
}
