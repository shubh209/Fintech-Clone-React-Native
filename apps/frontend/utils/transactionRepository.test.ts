import { createTransactionRepository } from './transactionRepository';

describe('transaction repository', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('loads cloud transactions and refreshes the local cache', async () => {
    const cachedValues = new Map<string, string>();
    const repository = createTransactionRepository({
      apiBaseUrl: 'https://api.example.test',
      authTokenProvider: async () => 'session-token',
      storage: {
        getItem: (key) => cachedValues.get(key) ?? null,
        setItem: (key, value) => cachedValues.set(key, value),
        removeItem: (key) => cachedValues.delete(key),
      },
    });
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
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
      }),
    } as Response) as any;

    const result = await repository.loadTransactions();

    expect(result.source).toBe('cloud');
    expect(result.transactions).toHaveLength(1);
    expect(cachedValues.get('transactions-cache')).toContain('tx-1');
  });

  it('falls back to cached transactions when the cloud request fails', async () => {
    const cachedValues = new Map<string, string>([
      [
        'transactions-cache',
        JSON.stringify({
          transactions: [
            {
              id: 'cached-tx',
              amount: 40,
              title: 'Deposit',
              date: '2024-01-02T12:00:00.000Z',
              category: 'income',
            },
          ],
          updatedAt: '2024-01-02T12:01:00.000Z',
        }),
      ],
    ]);
    const repository = createTransactionRepository({
      apiBaseUrl: 'https://api.example.test',
      authTokenProvider: async () => 'session-token',
      storage: {
        getItem: (key) => cachedValues.get(key) ?? null,
        setItem: (key, value) => cachedValues.set(key, value),
        removeItem: (key) => cachedValues.delete(key),
      },
    });
    global.fetch = jest.fn().mockRejectedValue(new Error('network down')) as any;

    const result = await repository.loadTransactions();

    expect(result).toEqual({
      source: 'cache',
      transactions: [
        {
          id: 'cached-tx',
          amount: 40,
          title: 'Deposit',
          date: '2024-01-02T12:00:00.000Z',
          category: 'income',
        },
      ],
      updatedAt: '2024-01-02T12:01:00.000Z',
    });
  });

  it('saves normalized transactions to cloud and local cache', async () => {
    const cachedValues = new Map<string, string>();
    const repository = createTransactionRepository({
      apiBaseUrl: 'https://api.example.test',
      authTokenProvider: async () => 'session-token',
      storage: {
        getItem: (key) => cachedValues.get(key) ?? null,
        setItem: (key, value) => cachedValues.set(key, value),
        removeItem: (key) => cachedValues.delete(key),
      },
    });
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
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
      }),
    } as Response) as any;

    const result = await repository.saveTransactions([
      {
        id: 'tx-1',
        amount: -8,
        title: 'Coffee',
        date: '2024-01-02T12:00:00.000Z',
      },
    ]);

    expect(result.source).toBe('cloud');
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.example.test/api/transactions',
      expect.objectContaining({
        method: 'PUT',
        headers: expect.objectContaining({
          'content-type': 'application/json',
          authorization: 'Bearer session-token',
        }),
      })
    );
    expect(cachedValues.get('transactions-cache')).toContain('tx-1');
  });

  it('does not send the legacy client-provided user key header', async () => {
    const repository = createTransactionRepository({
      apiBaseUrl: 'https://api.example.test',
      authTokenProvider: async () => 'session-token',
      storage: {
        getItem: () => null,
        setItem: () => undefined,
        removeItem: () => undefined,
      },
    });
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        transactions: [],
        updatedAt: '2024-01-02T12:01:00.000Z',
      }),
    } as Response) as any;

    await repository.loadTransactions();

    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.example.test/api/transactions',
      expect.objectContaining({
        headers: expect.objectContaining({
          authorization: 'Bearer session-token',
        }),
      })
    );
    const [, options] = (global.fetch as any).mock.calls[0];
    expect(options.headers['x-fintech-user-id']).toBe(undefined);
  });
});
