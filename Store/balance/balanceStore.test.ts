import { MMKV } from 'react-native-mmkv';
import { useBalanceStore } from './balanceStore';

const mockValues = new Map<string, string>();

jest.mock('react-native-mmkv', () => ({
  MMKV: jest.fn(() => ({
    getString: (key: string) => mockValues.get(key),
    set: (key: string, value: string) => {
      mockValues.set(key, value);
    },
    delete: (key: string) => {
      mockValues.delete(key);
    },
  })),
}));

describe('balance store', () => {
  beforeEach(() => {
    mockValues.clear();
    (MMKV as jest.Mock).mockClear();
    useBalanceStore.setState({ transactions: [] });
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
});
