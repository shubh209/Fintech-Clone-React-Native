import {
  isTransactionSnapshot,
  normalizeTransactionSnapshot,
  SharedTransactionInput,
  TransactionSnapshot,
} from '../../../../packages/shared/src';
import { ApiEnv } from '../types';

const transactionKeyPrefix = 'transactions:';

export function getTransactionUserKey(userId: string) {
  return `${transactionKeyPrefix}${userId}`;
}

export async function readTransactionSnapshot({
  env,
  userId,
}: {
  env: ApiEnv;
  userId: string;
}): Promise<TransactionSnapshot> {
  const snapshot = await env.TRANSACTIONS?.get<unknown>(getTransactionUserKey(userId), 'json');

  if (isTransactionSnapshot(snapshot)) {
    return snapshot;
  }

  return {
    transactions: [],
    updatedAt: null,
  };
}

export async function writeTransactionSnapshot({
  env,
  userId,
  transactions,
  updatedAt = new Date().toISOString(),
}: {
  env: ApiEnv;
  userId: string;
  transactions: SharedTransactionInput[];
  updatedAt?: string;
}): Promise<TransactionSnapshot> {
  const snapshot = normalizeTransactionSnapshot({ transactions, updatedAt });

  if (!env.TRANSACTIONS?.put) {
    throw new Error('Missing TRANSACTIONS KV binding');
  }

  await env.TRANSACTIONS.put(getTransactionUserKey(userId), JSON.stringify(snapshot));

  return snapshot;
}
