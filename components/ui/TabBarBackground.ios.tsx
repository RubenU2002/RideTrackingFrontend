import { useThemeController } from '@/core/theme/ThemeProvider';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import { StyleSheet, useColorScheme as useRNColorScheme } from 'react-native';

export default function BlurTabBarBackground() {
  const { mode, resolved } = useThemeController();
  const system = useRNColorScheme() ?? 'light';
  const effective = mode === 'system' ? system : resolved;

  const tint = effective === 'dark' ? 'dark' : 'light';
  return <BlurView tint={tint} intensity={80} style={StyleSheet.absoluteFill} />;
}

export function useBottomTabOverflow() {
  return useBottomTabBarHeight();
}
