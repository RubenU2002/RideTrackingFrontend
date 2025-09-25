import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider, useAuth } from '@/core/auth/AuthContext';
import '@/core/location/tracking';
import { TripProvider } from '@/core/state/tripStore';
import { SyncProvider } from '@/core/sync/SyncProvider';
import { AppThemeProvider } from '@/core/theme/ThemeProvider';
import { GSProvider } from '@/core/ui/GluestackProvider';
import { useColorScheme } from '@/hooks/useColorScheme';
import '@/core/mapbox/init';

function RootNavigator() {
  const { loading, isAuthenticated } = useAuth();

  if (loading) {
    return null;
  }

  return (
    <Stack>
      {isAuthenticated ? (
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      ) : (
        <>
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="register" options={{ headerShown: false }} />
        </>
      )}
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  return (
    <AppThemeProvider>
      <GSProvider>
        <TripProvider>
          <SafeAreaProvider>
            <ThemeProvider
              value={
                colorScheme === 'dark'
                  ? {
                      ...DarkTheme,
                      colors: {
                        ...DarkTheme.colors,
                        background: '#0B1220',
                        card: '#0E1626',
                        primary: '#7FB3FF',
                        text: '#E6EDF8',
                        border: '#1F2A44',
                      },
                    }
                  : {
                      ...DefaultTheme,
                      colors: {
                        ...DefaultTheme.colors,
                        background: '#F7FAFF',
                        card: '#FFFFFF',
                        primary: '#2D7FF9',
                        text: '#0B1220',
                        border: '#E3EAF6',
                      },
                    }
              }
            >
              <AuthProvider>
                <SyncProvider>
                  <RootNavigator />
                </SyncProvider>
              </AuthProvider>
              <StatusBar style="auto" />
            </ThemeProvider>
          </SafeAreaProvider>
        </TripProvider>
      </GSProvider>
    </AppThemeProvider>
  );
}
