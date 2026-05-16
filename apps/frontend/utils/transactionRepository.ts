import {
  normalizeTransactionRecord,
  normalizeTransactionSnapshot,
  SharedTransactionInput,
  SharedTransactionRecord,
  TransactionSnapshot,
} from '../../../packages/shared/src';
import { zustandStorage } from '@/Store/storage/mmkv-storage';
import { getTransactionApiUrl, getTransactionUserId } from './transactionApiClient';

export const transactionCacheKey = 'transactions-cache';

type RepositorySource = 'cloud' | 'cache';

export interface TransactionRepositoryResult {
  source: RepositorySource;
  transactions: SharedTransactionRecord[];
  updatedAt: string | null;
}

interface TransactionRepositoryStorage {
  getItem: (key: string) => unknown | Promise<unknown>;
  setItem: (key: string, value: string) => unknown | Promise<unknown>;
  removeItem: (key: string) => unknown | Promise<unknown>;
}

interface TransactionRepositoryOptions {
  apiBaseUrl?: string;
  userIdProvider?: () => string;
  storage?: TransactionRepositoryStorage;
}

function headers(userId: string) {
  return {
    'content-type': 'application/json',
    'x-fintech-user-id': userId,
  };
}

async function readCachedSnapshot(
  storage: TransactionRepositoryStorage
): Promise<TransactionRepositoryResult> {
  const cached = await storage.getItem(transactionCacheKey);

  if (typeof cached !== 'string') {
    return {
      source: 'cache',
      transactions: [],
      updatedAt: null,
    };
  }

  const snapshot = normalizeTransactionSnapshot(JSON.parse(cached));
  return {
    source: 'cache',
    transactions: snapshot.transactions,
    updatedAt: snapshot.updatedAt,
  };
}

async function writeCachedSnapshot(
  storage: TransactionRepositoryStorage,
  snapshot: TransactionSnapshot
) {
  await storage.setItem(transactionCacheKey, JSON.stringify(snapshot));
}

export function createTransactionRepository({
  apiBaseUrl,
  userIdProvider = getTransactionUserId,
  storage = zustandStorage,
}: TransactionRepositoryOptions = {}) {
  const getUrl = () => getTransactionApiUrl('/api/transactions', apiBaseUrl);

  return {
    async loadTransactions(): Promise<TransactionRepositoryResult> {
      try {
        const response = await fetch(getUrl(), {
          headers: headers(userIdProvider()),
        });

        if (!response.ok) {
          throw new Error(`Transaction load failed with ${response.status}`);
        }

        const snapshot = normalizeTransactionSnapshot(await response.json());
        await writeCachedSnapshot(storage, snapshot);

        return {
          source: 'cloud',
          transactions: snapshot.transactions,
          updatedAt: snapshot.updatedAt,
        };
      } catch {
        return readCachedSnapshot(storage);
      }
    },

    async saveTransactions(
      transactions: SharedTransactionInput[]
    ): Promise<TransactionRepositoryResult> {
      const normalizedTransactions = transactions.map(normalizeTransactionRecord);
      const optimisticSnapshot = normalizeTransactionSnapshot({
        transactions: normalizedTransactions,
        updatedAt: new Date().toISOString(),
      });

      await writeCachedSnapshot(storage, optimisticSnapshot);

      try {
        const response = await fetch(getUrl(), {
          method: 'PUT',
          headers: headers(userIdProvider()),
          body: JSON.stringify({ transactions: normalizedTransactions }),
        });

        if (!response.ok) {
          throw new Error(`Transaction save failed with ${response.status}`);
        }

        const snapshot = normalizeTransactionSnapshot(await response.json());
        await writeCachedSnapshot(storage, snapshot);

        return {
          source: 'cloud',
          transactions: snapshot.transactions,
          updatedAt: snapshot.updatedAt,
        };
      } catch {
        return {
          source: 'cache',
          transactions: optimisticSnapshot.transactions,
          updatedAt: optimisticSnapshot.updatedAt,
        };
      }
    },
  };
}

export type TransactionRepository = ReturnType<typeof createTransactionRepository>;

export const transactionRepository = createTransactionRepository();
