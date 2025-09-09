import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';
import { AppThemeProvider } from '@/core/theme/ThemeProvider';
import { TripProvider } from '@/core/state/tripStore';
import { GSProvider } from '@/core/ui/GluestackProvider';
import { AuthProvider, useAuth } from '@/core/auth/AuthContext';

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
            <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
              <AuthProvider>
                <RootNavigator />
              </AuthProvider>
              <StatusBar style="auto" />
            </ThemeProvider>
          </SafeAreaProvider>
        </TripProvider>
      </GSProvider>
    </AppThemeProvider>
  );
}
