import { Hono } from 'hono';
import { ApiEnv } from '../../types';
import { getPurchasingPowerComparisons } from './purchasingPowerService';

export const purchasingPowerRoutes = new Hono<{ Bindings: ApiEnv }>();

purchasingPowerRoutes.get('/comparisons', async (context) => {
  const result = getPurchasingPowerComparisons({
    city: context.req.query('city'),
    amountUsd: context.req.query('amountUsd'),
  });

  return context.json(result.body, result.status as 200);
});
