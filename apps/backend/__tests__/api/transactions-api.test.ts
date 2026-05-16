import app from '../../src';
import { createSign, generateKeyPairSync } from 'crypto';

const createStore = (initial: Record<string, unknown> = {}) => {
  const values = new Map(Object.entries(initial));
  const puts: Array<[string, unknown]> = [];

  return {
    store: {
      get: async <T = unknown>(key: string, type: 'json') => {
        expect(type).toBe('json');
        return (values.get(key) ?? null) as T | null;
      },
      put: async (key: string, value: string) => {
        const parsed = JSON.parse(value);
        puts.push([key, parsed]);
        values.set(key, parsed);
      },
    },
    puts,
  };
};

const issuer = 'https://issuer.example.test';
const keyPair = generateKeyPairSync('rsa', { modulusLength: 2048 });
const publicJwk = keyPair.publicKey.export({ format: 'jwk' }) as JsonWebKey;
const jwks = JSON.stringify({
  keys: [
    {
      ...publicJwk,
      kid: 'test-key',
      alg: 'RS256',
      use: 'sig',
    },
  ],
});

function base64Url(value: unknown) {
  const input = Buffer.isBuffer(value)
    ? value
    : Buffer.from(typeof value === 'string' ? value : JSON.stringify(value));

  return input
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function createClerkJwt(sub = 'user-1') {
  const header = base64Url({ alg: 'RS256', kid: 'test-key', typ: 'JWT' });
  const payload = base64Url({
    iss: issuer,
    sub,
    exp: Math.floor(Date.now() / 1000) + 300,
  });
  const signingInput = `${header}.${payload}`;
  const signature = createSign('RSA-SHA256').update(signingInput).sign(keyPair.privateKey);

  return `${signingInput}.${base64Url(signature)}`;
}

const createEnv = (store: ReturnType<typeof createStore>['store']) => ({
  TRANSACTIONS: store,
  CLERK_JWT_ISSUER: issuer,
  CLERK_JWKS_JSON: jwks,
});

describe('transactions cloud API', () => {
  it('returns a user transaction snapshot from Cloudflare KV', async () => {
    const { store } = createStore({
      'transactions:user-1': {
        transactions: [
          {
            id: 'tx-1',
            amount: -8,
            title: 'Coffee',
            date: '2024-01-02T12:00:00.000Z',
            category: 'food',
          },
        ],
        updatedAt: '2024-01-02T12:01:00.000Z',
      },
    });

    const response = await app.request(
      '/api/transactions',
      {
        headers: { authorization: `Bearer ${createClerkJwt('user-1')}` },
      },
      createEnv(store)
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      transactions: [
        {
          id: 'tx-1',
          amount: -8,
          title: 'Coffee',
          date: '2024-01-02T12:00:00.000Z',
          category: 'food',
        },
      ],
      updatedAt: '2024-01-02T12:01:00.000Z',
    });
  });

  it('persists normalized transaction snapshots for a user', async () => {
    const { store, puts } = createStore();

    const response = await app.request(
      '/api/transactions',
      {
        method: 'PUT',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${createClerkJwt('user-1')}`,
        },
        body: JSON.stringify({
          transactions: [
            {
              id: 'tx-1',
              amount: -8,
              title: 'Coffee',
              date: '2024-01-02T12:00:00.000Z',
            },
          ],
        }),
      },
      createEnv(store)
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.transactions[0].category).toBe('food');
    expect(typeof body.updatedAt).toBe('string');
    expect(puts).toEqual([
      [
        'transactions:user-1',
        {
          transactions: [
            {
              id: 'tx-1',
              amount: -8,
              title: 'Coffee',
              date: '2024-01-02T12:00:00.000Z',
              category: 'food',
            },
          ],
          updatedAt: body.updatedAt,
        },
      ],
    ]);
  });

  it('rejects transaction requests without a bearer token', async () => {
    const { store } = createStore();

    const response = await app.request('/api/transactions', {}, createEnv(store));

    expect(response.status).toBe(401);
  });

  it('rejects the old client-provided user key without a valid bearer token', async () => {
    const { store } = createStore();

    const response = await app.request(
      '/api/transactions',
      {
        headers: { 'x-fintech-user-id': 'user-1' },
      },
      createEnv(store)
    );

    expect(response.status).toBe(401);
  });
});
