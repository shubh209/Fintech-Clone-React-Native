export const DEFAULT_SHARED_TRANSACTION_CATEGORIES = [
  'income',
  'food',
  'transport',
  'shopping',
  'crypto',
  'other',
] as const;

export type SharedTransactionCategory =
  | (typeof DEFAULT_SHARED_TRANSACTION_CATEGORIES)[number]
  | (string & {});

export interface SharedTransactionRecord {
  id: string;
  amount: number;
  date: string;
  title: string;
  category: SharedTransactionCategory;
}

export type SharedTransactionInput = Omit<SharedTransactionRecord, 'category'> &
  Partial<Pick<SharedTransactionRecord, 'category'>>;

export interface TransactionSnapshot {
  transactions: SharedTransactionRecord[];
  updatedAt: string | null;
}

export function normalizeSharedTransactionCategory(category: string): SharedTransactionCategory {
  const normalized = category.trim().toLowerCase().replace(/\s+/g, ' ');
  return normalized.length > 0 ? normalized : 'other';
}

export function inferSharedTransactionCategory({
  title,
  amount,
}: Pick<SharedTransactionInput, 'title' | 'amount'>): SharedTransactionCategory {
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

export function normalizeTransactionRecord(
  transaction: SharedTransactionInput
): SharedTransactionRecord {
  return {
    id: transaction.id,
    amount: transaction.amount,
    title: transaction.title,
    date: new Date(transaction.date).toISOString(),
    category: normalizeSharedTransactionCategory(
      transaction.category ?? inferSharedTransactionCategory(transaction)
    ),
  };
}

export function normalizeTransactionSnapshot(value: {
  transactions: SharedTransactionInput[];
  updatedAt?: string | null;
}): TransactionSnapshot {
  return {
    transactions: value.transactions.map(normalizeTransactionRecord),
    updatedAt: value.updatedAt ?? null,
  };
}

export function isTransactionRecord(value: unknown): value is SharedTransactionRecord {
  if (!value || typeof value !== 'object') return false;

  const transaction = value as Partial<SharedTransactionRecord>;
  return (
    typeof transaction.id === 'string' &&
    transaction.id.length > 0 &&
    typeof transaction.title === 'string' &&
    transaction.title.length > 0 &&
    typeof transaction.amount === 'number' &&
    Number.isFinite(transaction.amount) &&
    typeof transaction.date === 'string' &&
    Number.isFinite(Date.parse(transaction.date)) &&
    typeof transaction.category === 'string' &&
    transaction.category.trim().length > 0
  );
}

export function isTransactionSnapshot(value: unknown): value is TransactionSnapshot {
  if (!value || typeof value !== 'object') return false;

  const snapshot = value as Partial<TransactionSnapshot>;
  return (
    Array.isArray(snapshot.transactions) &&
    snapshot.transactions.every(isTransactionRecord) &&
    (snapshot.updatedAt === null ||
      (typeof snapshot.updatedAt === 'string' && Number.isFinite(Date.parse(snapshot.updatedAt))))
  );
}
