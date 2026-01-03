import { useAuth } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { MMKV } from 'react-native-mmkv';

let storage: MMKV | null = null;

function getStorage() {
  if (!storage) {
    storage = new MMKV({ id: 'inactivity-storage' });
  }
  return storage;
}

export function UserInactivityProvider({ children }: { children: React.ReactNode }) {
  const appState = useRef<AppStateStatus>(AppState.currentState);
  const router = useRouter();
  const { isSignedIn } = useAuth();

  useEffect(() => {
    const sub = AppState.addEventListener('change', handleAppStateChange);
    return () => sub.remove();
  }, [isSignedIn]);

  const handleAppStateChange = (nextState: AppStateStatus) => {
    // MMKV is only touched here, on actual state change
    const storage = getStorage();

    if (nextState === 'background') {
      storage.set('startTime', Date.now());
    }

    if (nextState === 'active' && appState.current === 'background') {
      const elapsed = Date.now() - (storage.getNumber('startTime') ?? 0);

      if (elapsed > 3000 && isSignedIn) {
        router.replace('/(authenticated)/(modals)/lock');
      }
    }

    appState.current = nextState;
  };

  return <>{children}</>;
}
