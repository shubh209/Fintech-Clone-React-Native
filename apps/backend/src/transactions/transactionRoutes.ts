import { Hono } from 'hono';
import { isTransactionSnapshot } from '../../../../packages/shared/src';
import { ApiEnv } from '../types';
import { readTransactionSnapshot, writeTransactionSnapshot } from './transactionStore';

export const transactionRoutes = new Hono<{ Bindings: ApiEnv }>();

function getUserId(context: { req: { header: (name: string) => string | undefined } }) {
  return context.req.header('x-fintech-user-id')?.trim();
}

transactionRoutes.get('/transactions', async (context) => {
  const userId = getUserId(context);

  if (!userId) {
    return context.json({ error: 'Missing transaction user key' }, 401);
  }

  return context.json(await readTransactionSnapshot({ env: context.env, userId }));
});

transactionRoutes.put('/transactions', async (context) => {
  const userId = getUserId(context);

  if (!userId) {
    return context.json({ error: 'Missing transaction user key' }, 401);
  }

  const body = await context.req.json().catch(() => null);

  if (!body || typeof body !== 'object' || !Array.isArray((body as { transactions?: unknown }).transactions)) {
    return context.json({ error: 'Expected transactions array' }, 400);
  }

  const snapshot = await writeTransactionSnapshot({
    env: context.env,
    userId,
    transactions: (body as { transactions: [] }).transactions,
  });

  if (!isTransactionSnapshot(snapshot)) {
    return context.json({ error: 'Invalid transaction snapshot' }, 500);
  }

  return context.json(snapshot);
});
