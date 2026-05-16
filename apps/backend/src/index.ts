import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { ApiEnv } from './types';
import { cryptoRoutes } from './crypto/cryptoRoutes';
import { transactionRoutes } from './transactions/transactionRoutes';

const app = new Hono<{ Bindings: ApiEnv }>();

app.use('*', cors());

app.get('/health', (context) => context.json({ status: 'ok' }));
app.route('/api', cryptoRoutes);
app.route('/api', transactionRoutes);

export default app;
