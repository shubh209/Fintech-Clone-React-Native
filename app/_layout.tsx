import Colors from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useFonts } from 'expo-font';
import { Link, Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import {  ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';
import { ClerkProvider, useAuth } from '@clerk/clerk-expo'
import * as SecureStore from 'expo-secure-store';
export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';


const CLERK_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

// Cache the Clerk JWT
const tokenCache = {
  async getToken(key: string) {
    try {
      return SecureStore.getItemAsync(key);
    } catch (err) {
      return null;
    }
  },
  async saveToken(key: string, value: string) {
    try {
      return SecureStore.setItemAsync(key, value);
    } catch (err) {
      return;
    }
  },
};


// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const IntialLayout = () => {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();
  const segments = useSegments();

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);


  useEffect(() => {
    if (!isLoaded) return;

    const inAuthGroup = segments[0] === '(authenticated)';

    if (isSignedIn && !inAuthGroup) {
      router.replace('/(authenticated)/(tabs)/home');
    } else if (!isSignedIn) {
      router.replace('/');
    }
  }, [isSignedIn]);

  if (!loaded || !isLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return ( 
      <Stack>
            {/* index */}
            <Stack.Screen name="index" options={{ headerShown: false }} />

            {/* signup */}
            <Stack.Screen 
              name="signup" 
              options={{ 
                title:'Fintech-Clone',
                headerBackTitle: '',
                headerShadowVisible: false,
                headerStyle: {backgroundColor: Colors.background},
                headerLeft: () => (
                  <TouchableOpacity onPress={router.back}>
                    <Ionicons name="arrow-back" size={30} color={Colors.dark} />
                  </TouchableOpacity>
                )
              }} 
            />
            
            {/* login */}
            <Stack.Screen 
              name="login" 
              options={{ 
                title:'Fintech-Clone',
                headerBackTitle: '',
                headerShadowVisible: false,
                headerStyle: {backgroundColor: Colors.background},
                headerLeft: () => (
                  <TouchableOpacity onPress={router.back}>
                    <Ionicons name="arrow-back" size={30} color={Colors.dark} />
                  </TouchableOpacity>
                ),
                headerRight: () => (
                  <Link href={"/help"} asChild>
                    <TouchableOpacity>
                      <Ionicons name="help-circle-outline" size={30} color={Colors.dark} />
                    </TouchableOpacity>
                  </Link>
                )
              }} 
            />

            {/* help */}
            <Stack.Screen
              name="help"
              options={{
                title: 'Help',
                presentation: 'modal',
              }}
            />


            {/* verify phone number */}
            <Stack.Screen 
              name="verify/[phone]" 
              options={{ 
                title:'Fintech-Clone',
                headerBackTitle: '',
                headerShadowVisible: false,
                headerStyle: {backgroundColor: Colors.background},
                headerLeft: () => (
                  <TouchableOpacity onPress={router.back}>
                    <Ionicons name="arrow-back" size={30} color={Colors.dark} />
                  </TouchableOpacity>
                )
              }} 
            />

            {/* authenticated app */}
            <Stack.Screen 
              name="(authenticated)/(tabs)" 
              options={{ headerShown: false }} 
            />
        </Stack>

  );
}

const Layout = () => {
  return (
    <ClerkProvider tokenCache={tokenCache} publishableKey={CLERK_PUBLISHABLE_KEY!}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <StatusBar style="light"/>
        <IntialLayout />
      </GestureHandlerRootView >
    </ClerkProvider>
  );
}

export default Layout;