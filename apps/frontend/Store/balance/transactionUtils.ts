export const DEFAULT_TRANSACTION_CATEGORIES = [
  'income',
  'food',
  'transport',
  'shopping',
  'crypto',
  'other',
] as const;

export type DefaultTransactionCategory = (typeof DEFAULT_TRANSACTION_CATEGORIES)[number];
export type TransactionCategory = DefaultTransactionCategory | (string & {});

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
    category: normalizeTransactionCategory(
      transaction.category ?? inferTransactionCategory(transaction)
    ),
  };
}

export function normalizePersistedTransactions(
  transactions: Array<Omit<PersistedTransaction, 'category'> & Partial<Pick<PersistedTransaction, 'category'>>>
): PersistedTransaction[] {
  return transactions.map((transaction) => ({
    ...transaction,
    category: normalizeTransactionCategory(
      transaction.category ?? inferTransactionCategory(transaction)
    ),
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

export function normalizeTransactionCategory(category: string): TransactionCategory {
  const normalized = category.trim().toLowerCase().replace(/\s+/g, ' ');
  return normalized.length > 0 ? normalized : 'other';
}

export function formatTransactionCategoryLabel(category: string) {
  return normalizeTransactionCategory(category)
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function getTransactionCategories<T extends Pick<PersistedTransaction, 'category'>>(
  transactions: T[]
) {
  const categories = new Set<TransactionCategory>(DEFAULT_TRANSACTION_CATEGORIES);

  transactions.forEach((transaction) => {
    categories.add(normalizeTransactionCategory(transaction.category));
  });

  return Array.from(categories);
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
  const normalizedCategory = category === 'all' ? 'all' : normalizeTransactionCategory(category);

  return transactions.filter((transaction) => {
    const matchesQuery =
      normalizedQuery.length === 0 ||
      transaction.title.toLowerCase().includes(normalizedQuery) ||
      transaction.amount.toString().includes(normalizedQuery);
    const matchesCategory =
      normalizedCategory === 'all' ||
      normalizeTransactionCategory(transaction.category) === normalizedCategory;

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
