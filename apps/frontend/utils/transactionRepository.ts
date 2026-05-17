import {
  normalizeTransactionRecord,
  normalizeTransactionSnapshot,
  SharedTransactionInput,
  SharedTransactionRecord,
  TransactionSnapshot,
} from '../../../packages/shared/src';
import { zustandStorage } from '@/Store/storage/mmkv-storage';
import { recordMetric, timeAsync } from './metrics';
import {
  getTransactionApiUrl,
  getTransactionAuthToken,
} from './transactionApiClient';

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
  authTokenProvider?: () => Promise<string | null>;
  storage?: TransactionRepositoryStorage;
}

async function headers(authTokenProvider: () => Promise<string | null>) {
  const token = await authTokenProvider();
  const requestHeaders: Record<string, string> = {
    'content-type': 'application/json',
  };

  if (token) {
    requestHeaders.authorization = `Bearer ${token}`;
  }

  return requestHeaders;
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
  authTokenProvider = getTransactionAuthToken,
  storage = zustandStorage,
}: TransactionRepositoryOptions = {}) {
  const getUrl = () => getTransactionApiUrl('/api/transactions', apiBaseUrl);

  return {
    async loadTransactions(): Promise<TransactionRepositoryResult> {
      try {
        const snapshot = await timeAsync(
          'transactions.client.load',
          async () => {
            const response = await fetch(getUrl(), {
              headers: await headers(authTokenProvider),
            });

            if (!response.ok) {
              throw new Error(`Transaction load failed with ${response.status}`);
            }

            return normalizeTransactionSnapshot(await response.json());
          },
          { source: 'cloud' }
        );
        await writeCachedSnapshot(storage, snapshot);

        return {
          source: 'cloud',
          transactions: snapshot.transactions,
          updatedAt: snapshot.updatedAt,
        };
      } catch {
        recordMetric({
          name: 'transactions.client.fallback',
          durationMs: 0,
          status: 'success',
          metadata: { operation: 'load', source: 'cache' },
        });
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
        const snapshot = await timeAsync(
          'transactions.client.save',
          async () => {
            const response = await fetch(getUrl(), {
              method: 'PUT',
              headers: await headers(authTokenProvider),
              body: JSON.stringify({ transactions: normalizedTransactions }),
            });

            if (!response.ok) {
              throw new Error(`Transaction save failed with ${response.status}`);
            }

            return normalizeTransactionSnapshot(await response.json());
          },
          { source: 'cloud', transactionCount: normalizedTransactions.length }
        );
        await writeCachedSnapshot(storage, snapshot);

        return {
          source: 'cloud',
          transactions: snapshot.transactions,
          updatedAt: snapshot.updatedAt,
        };
      } catch {
        recordMetric({
          name: 'transactions.client.fallback',
          durationMs: 0,
          status: 'success',
          metadata: {
            operation: 'save',
            source: 'cache',
            transactionCount: normalizedTransactions.length,
          },
        });
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
