import { MMKV } from 'react-native-mmkv';
import { setTransactionRepository, useBalanceStore } from './balanceStore';

const mockValues = new Map<string, string>();

jest.mock('react-native-mmkv', () => {
  const mockMMKV: any = jest.fn();

  mockMMKV.mockImplementation(() => ({
    getString: (key: string) => mockValues.get(key),
    set: (key: string, value: string) => {
      mockValues.set(key, value);
    },
    delete: (key: string) => {
      mockValues.delete(key);
    },
  }));

  return {
    MMKV: mockMMKV,
  };
});

describe('balance store', () => {
  const repository = {
    loadTransactions: jest.fn(),
    saveTransactions: jest.fn(),
  };

  beforeEach(() => {
    mockValues.clear();
    (MMKV as any).mockClear();
    repository.loadTransactions.mockReset();
    repository.saveTransactions.mockReset();
    repository.loadTransactions.mockResolvedValue({
      source: 'cloud',
      transactions: [],
      updatedAt: null,
    });
    repository.saveTransactions.mockResolvedValue({
      source: 'cloud',
      transactions: [],
      updatedAt: null,
    });
    setTransactionRepository(repository as any);
    useBalanceStore.setState({ transactions: [], syncStatus: 'idle' });
  });

  it('updates one transaction category with normalized custom names', () => {
    const store = useBalanceStore.getState();

    store.runTransaction({
      id: 'tx-1',
      amount: -28,
      title: 'Dinner',
      date: '2024-01-02T12:00:00.000Z',
    });
    store.runTransaction({
      id: 'tx-2',
      amount: -8,
      title: 'Coffee',
      date: '2024-01-03T12:00:00.000Z',
    });

    useBalanceStore.getState().updateTransactionCategory('tx-1', ' Weekend   Dining ');

    expect(useBalanceStore.getState().transactions).toEqual([
      {
        id: 'tx-1',
        amount: -28,
        title: 'Dinner',
        date: '2024-01-02T12:00:00.000Z',
        category: 'weekend dining',
      },
      {
        id: 'tx-2',
        amount: -8,
        title: 'Coffee',
        date: '2024-01-03T12:00:00.000Z',
        category: 'food',
      },
    ]);
  });

  it('falls back to other for blank category updates', () => {
    useBalanceStore.getState().runTransaction({
      id: 'tx-1',
      amount: -28,
      title: 'Dinner',
      date: '2024-01-02T12:00:00.000Z',
    });

    useBalanceStore.getState().updateTransactionCategory('tx-1', '   ');

    expect(useBalanceStore.getState().transactions[0].category).toBe('other');
  });

  it('hydrates transactions from the cloud repository', async () => {
    repository.loadTransactions.mockResolvedValue({
      source: 'cloud',
      transactions: [
        {
          id: 'tx-cloud',
          amount: 20,
          title: 'Deposit',
          date: '2024-01-02T12:00:00.000Z',
          category: 'income',
        },
      ],
      updatedAt: '2024-01-02T12:01:00.000Z',
    });

    await useBalanceStore.getState().hydrateTransactions();

    expect(useBalanceStore.getState().transactions).toEqual([
      {
        id: 'tx-cloud',
        amount: 20,
        title: 'Deposit',
        date: '2024-01-02T12:00:00.000Z',
        category: 'income',
      },
    ]);
    expect(useBalanceStore.getState().syncStatus).toBe('synced');
  });

  it('keeps optimistic transactions when cloud save fails', async () => {
    repository.saveTransactions.mockRejectedValue(new Error('network down'));

    await useBalanceStore.getState().runTransaction({
      id: 'tx-1',
      amount: -8,
      title: 'Coffee',
      date: '2024-01-02T12:00:00.000Z',
    });

    expect(useBalanceStore.getState().transactions).toEqual([
      {
        id: 'tx-1',
        amount: -8,
        title: 'Coffee',
        date: '2024-01-02T12:00:00.000Z',
        category: 'food',
      },
    ]);
    expect(useBalanceStore.getState().syncStatus).toBe('fallback');
  });

  it('syncs category updates to the cloud repository', async () => {
    useBalanceStore.setState({
      transactions: [
        {
          id: 'tx-1',
          amount: -28,
          title: 'Dinner',
          date: '2024-01-02T12:00:00.000Z',
          category: 'food',
        },
      ],
      syncStatus: 'idle',
    });

    await useBalanceStore.getState().updateTransactionCategory('tx-1', ' Weekend Dining ');

    expect(repository.saveTransactions).toHaveBeenCalledWith([
      {
        id: 'tx-1',
        amount: -28,
        title: 'Dinner',
        date: '2024-01-02T12:00:00.000Z',
        category: 'weekend dining',
      },
    ]);
  });
});
