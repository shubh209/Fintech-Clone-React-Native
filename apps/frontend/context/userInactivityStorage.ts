import { MMKV } from 'react-native-mmkv';

export interface InactivityStorage {
  getNumber: (key: string) => number | undefined;
  set: (key: string, value: number) => void;
}

let instance: InactivityStorage | null = null;

function createInMemoryInactivityStorage(): InactivityStorage {
  const values = new Map<string, number>();

  return {
    getNumber: (key: string) => values.get(key),
    set: (key: string, value: number) => {
      values.set(key, value);
    },
  };
}

export function getInactivityStorage(): InactivityStorage {
  if (instance) {
    return instance;
  }

  try {
    instance = new MMKV({ id: 'inactivity-storage' });
  } catch {
    instance = createInMemoryInactivityStorage();
  }

  return instance;
}
