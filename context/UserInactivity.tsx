import { useAuth } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { MMKV } from 'react-native-mmkv';

let storage: MMKV | null = null;

function getStorage() {
  if (!storage) {
    storage = new MMKV({
      id: 'inactivity-storage',
    });
  }
  return storage;
}

export function UserInactivityProvider({ children }: { children: React.ReactNode }) {
  const appState = useRef<AppStateStatus>(AppState.currentState);
  const router = useRouter();
  const { isSignedIn } = useAuth();

  useEffect(() => {
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [isSignedIn]);

  const handleAppStateChange = (nextAppState: AppStateStatus) => {
    const storage = getStorage();

    if (nextAppState === 'background') {
      storage.set('startTime', Date.now());
    }

    if (nextAppState === 'active' && appState.current === 'background') {
      const elapsed = Date.now() - (storage.getNumber('startTime') ?? 0);

      if (elapsed > 3000 && isSignedIn) {
        router.replace('/(authenticated)/(modals)/lock');
      }
    }

    appState.current = nextAppState;
  };

  return <>{children}</>;
}
