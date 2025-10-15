// This file sets up a custom storage adapter for Zustand using MMKV (a fast, persistent key-value storage for React Native).
// - Creates an MMKV instance with the ID 'balance-storage'.
// - Exports 'zustandStorage' implementing the StateStorage interface for Zustand's persistence middleware.
// - Provides setItem, getItem, and removeItem methods to store, retrieve, and delete string values using MMKV.
// - Ensures Zustand state can be persisted efficiently on device storage.

// This is needed in your project to enable persistent state storage for Zustand using MMKV, which is optimized for React Native. 
// By using this adapter, any state managed by Zustand (such as user data, balances, or settings) will be saved to device storage and automatically restored when the app restarts. 
// This ensures a seamless user experience, even if the app is closed or the device is rebooted, and provides fast, reliable storage compared to alternatives like AsyncStorage.

// mmkv-storage.ts
import { StateStorage } from 'zustand/middleware';
import { MMKV } from 'react-native-mmkv';

let _storage: MMKV | null = null;

export function getStorage() {
  if (!_storage) {
    _storage = new MMKV({ id: 'balance-storage' });
  }
  return _storage;
}

export const zustandStorage: StateStorage = {
  setItem: (name, value) => {
    const storage = getStorage(); // ✅ ensure initialized
    storage.set(name, value);
  },
  getItem: (name) => {
    const storage = getStorage(); // ✅ ensure initialized
    const value = storage.getString(name);
    return value ?? null;
  },
  removeItem: (name) => {
    const storage = getStorage(); // ✅ ensure initialized
    storage.delete(name);
  },
};
