import { useAuth } from '@clerk/clerk-expo';
import { useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';

const authRoutes = new Set(['login', 'signup', 'help', 'verify']);

export function useAuthRedirects() {
  const router = useRouter();
  const segments = useSegments();
  const { isLoaded, isSignedIn } = useAuth();

  useEffect(() => {
    if (!isLoaded) return;

    const segment = segments[0];
    const isAuthRoute = authRoutes.has(segment ?? '');
    const inAuthenticatedGroup = segment === '(authenticated)';

    if (!isSignedIn && inAuthenticatedGroup) {
      router.replace('/');
      return;
    }

    if (isSignedIn && !inAuthenticatedGroup && !isAuthRoute) {
      router.replace('/(authenticated)/(tabs)/crypto');
    }
  }, [isSignedIn, isLoaded, router, segments]);

  return { isLoaded };
}
