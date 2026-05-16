import { MMKV } from 'react-native-mmkv';
import { createMMKVZustandStorage, zustandStorage } from './mmkv-storage';

jest.mock('react-native-mmkv', () => ({
  MMKV: jest.fn(),
}));

describe('MMKV Zustand storage adapter', () => {
  it('stores and returns raw strings for createJSONStorage', () => {
    const values = new Map<string, string>();
    const fakeMMKV = {
      getString: (key: string) => values.get(key),
      set: (key: string, value: string) => values.set(key, value),
      delete: (key: string) => values.delete(key),
    };

    const storage = createMMKVZustandStorage(fakeMMKV);
    const persistedValue = '{"state":{"transactions":[]},"version":0}';

    storage.setItem('balance', persistedValue);

    expect(storage.getItem('balance')).toBe(persistedValue);

    storage.removeItem('balance');

    expect(storage.getItem('balance')).toBeNull();
  });

  it('reads legacy double-encoded persisted strings', () => {
    const persistedValue = '{"state":{"transactions":[]},"version":0}';
    const values = new Map<string, string>([
      ['balance', JSON.stringify(persistedValue)],
    ]);
    const fakeMMKV = {
      getString: (key: string) => values.get(key),
      set: (key: string, value: string) => values.set(key, value),
      delete: (key: string) => values.delete(key),
    };

    const storage = createMMKVZustandStorage(fakeMMKV);

    expect(storage.getItem('balance')).toBe(persistedValue);
  });

  it('falls back to in-memory storage when MMKV cannot be created', () => {
    const MockedMMKV = MMKV as any;
    MockedMMKV.mockImplementation(() => {
      throw new Error('MMKV is unavailable without on-device JSI');
    });

    const persistedValue = '{"state":{"transactions":[]},"version":0}';

    expect(() => zustandStorage.setItem('balance', persistedValue)).not.toThrow();
    expect(zustandStorage.getItem('balance')).toBe(persistedValue);

    zustandStorage.removeItem('balance');

    expect(zustandStorage.getItem('balance')).toBeNull();
  });
});
