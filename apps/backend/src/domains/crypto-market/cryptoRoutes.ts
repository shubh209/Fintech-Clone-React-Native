import { Hono } from 'hono';
import { ApiEnv } from '../../types';
import { getInfo, getListings, getTickers } from './cryptoService';

export const cryptoRoutes = new Hono<{ Bindings: ApiEnv }>();

cryptoRoutes.get('/listings', async (context) => {
  const limit = context.req.query('limit') ?? '5';
  return context.json(await getListings({ env: context.env, limit }));
});

cryptoRoutes.get('/info', async (context) => {
  const ids = context.req.query('ids') ?? '';
  return context.json(await getInfo({ env: context.env, ids }));
});

cryptoRoutes.get('/tickers', async (context) => {
  const id = context.req.query('id') ?? '1';
  return context.json(await getTickers({ env: context.env, id }));
});
