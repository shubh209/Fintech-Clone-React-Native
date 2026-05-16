import app from '../../src';

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

    const response = await app.request('/api/transactions', {
      headers: { 'x-fintech-user-id': 'user-1' },
    }, {
      TRANSACTIONS: store,
    });

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

    const response = await app.request('/api/transactions', {
      method: 'PUT',
      headers: {
        'content-type': 'application/json',
        'x-fintech-user-id': 'user-1',
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
    }, {
      TRANSACTIONS: store,
    });

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

  it('rejects transaction requests without a user key', async () => {
    const { store } = createStore();

    const response = await app.request('/api/transactions', {}, {
      TRANSACTIONS: store,
    });

    expect(response.status).toBe(401);
  });
});
