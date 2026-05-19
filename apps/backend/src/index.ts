import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { ApiEnv } from './types';
import { cryptoRoutes } from './domains/crypto-market/cryptoRoutes';

const app = new Hono<{ Bindings: ApiEnv }>();

app.use('*', cors());

app.get('/health', (context) => context.json({ status: 'ok' }));
app.route('/api', cryptoRoutes);

export default app;
