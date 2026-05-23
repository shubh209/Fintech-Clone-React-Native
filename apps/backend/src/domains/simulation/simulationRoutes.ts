import { Hono } from 'hono';
import { ApiEnv } from '../../types';
import { getSimulationHistory } from './simulationHistoryService';
import { getSimulationPrice } from './simulationPriceService';

export const simulationRoutes = new Hono<{ Bindings: ApiEnv }>();

simulationRoutes.get('/prices', async (context) => {
  const result = await getSimulationPrice({
    env: context.env,
    asset: context.req.query('asset'),
    date: context.req.query('date'),
    amountUsd: context.req.query('amountUsd'),
  });

  return context.json(result.body, result.status as 200);
});

simulationRoutes.get('/history', async (context) => {
  const result = await getSimulationHistory({
    env: context.env,
    asset: context.req.query('asset'),
    year: context.req.query('year'),
  });

  return context.json(result.body, result.status as 200);
});
