export interface PersistedTransaction {
  id: string;
  amount: number;
  date: string;
  title: string;
}

export interface TransactionInput {
  id: string;
  amount: number;
  date: Date | string | number;
  title: string;
}

interface DateFormatOptions {
  locale?: string;
  timeZone?: string;
}

export function normalizeTransaction(transaction: TransactionInput): PersistedTransaction {
  return {
    ...transaction,
    date: new Date(transaction.date).toISOString(),
  };
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
