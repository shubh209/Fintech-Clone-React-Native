import Colors from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useFonts } from 'expo-font';
import { Link, Stack, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import {  TouchableOpacity } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';
const CLERK_PUNLISHABLE_KEY = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;
import { ClerkProvider, useAuth } from '@clerk/clerk-expo'
import { tokenCache } from '@clerk/clerk-expo/token-cache'
import { Slot } from 'expo-router'



export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';


// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const IntialLayout = () => {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);


  useEffect ( () => {
    console.log('isSignedIn', isSignedIn);
  }, [isSignedIn] );


  if (!loaded) {
    return null;
  }

  return <Stack>
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
         </Stack>
}

const RootLayoutNav = () => {
  return (
    <ClerkProvider tokenCache={tokenCache} publishableKey={CLERK_PUNLISHABLE_KEY!}>
      <Slot />
      <GestureHandlerRootView style={{ flex: 1 }}>
        <StatusBar style="light"/>
        <IntialLayout />
      </GestureHandlerRootView >
    </ClerkProvider>
  );
}

export default RootLayoutNav;