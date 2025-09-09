import { Redirect, Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useAuth } from '@/core/auth/AuthContext';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return null;
  }
  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
          headerShown: false,
          tabBarButton: HapticTab,
          tabBarBackground: TabBarBackground,
          tabBarStyle: Platform.select({
            ios: {
              position: 'absolute',
            },
            default: {},
          }),
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Viaje',
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="car.fill" color={color} />,
          }}
        />
        <Tabs.Screen
          name="stats"
          options={{
            title: 'Stats',
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="chart.bar.fill" color={color} />,
          }}
        />
        <Tabs.Screen
          name="heatmap"
          options={{
            title: 'Mapa',
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="map.fill" color={color} />,
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: 'Ajustes',
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="gearshape.fill" color={color} />,
          }}
        />
      </Tabs>
    </SafeAreaView>
  );
}
