import { StateStorage } from 'zustand/middleware';
import { MMKV } from 'react-native-mmkv';

let instance: MMKV | null = null;
let fallbackStorage: MMKVStorage | null = null;

export function getMMKV() {
  if (!instance) {
    instance = new MMKV({ id: 'app-storage' });
  }
  return instance;
}

type MMKVStorage = Pick<MMKV, 'getString' | 'set' | 'delete'>;

function createInMemoryStorage(): MMKVStorage {
  const values = new Map<string, string>();

  return {
    getString: (key: string) => values.get(key),
    set: (key: string, value: string) => {
      values.set(key, value);
    },
    delete: (key: string) => {
      values.delete(key);
    },
  };
}

function getStorage() {
  try {
    return getMMKV();
  } catch {
    if (!fallbackStorage) {
      fallbackStorage = createInMemoryStorage();
    }

    return fallbackStorage;
  }
}

function normalizeStoredValue(value: string) {
  try {
    const parsed = JSON.parse(value);

    if (typeof parsed === 'string' && parsed.startsWith('{')) {
      return parsed;
    }
  } catch {
    return value;
  }

  return value;
}

export function createMMKVZustandStorage(storage: MMKVStorage): StateStorage {
  return {
    getItem: (key: string) => {
      const value = storage.getString(key);
      return value ? normalizeStoredValue(value) : null;
    },
    setItem: (key: string, value: string) => {
      storage.set(key, value);
    },
    removeItem: (key: string) => {
      storage.delete(key);
    },
  };
}

export const zustandStorage: StateStorage = {
  getItem: (key: string) => {
    return createMMKVZustandStorage(getStorage()).getItem(key);
  },
  setItem: (key: string, value: string) => {
    createMMKVZustandStorage(getStorage()).setItem(key, value);
  },
  removeItem: (key: string) => {
    createMMKVZustandStorage(getStorage()).removeItem(key);
  },
};
