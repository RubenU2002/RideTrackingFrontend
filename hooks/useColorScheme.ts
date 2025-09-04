import { useResolvedColorScheme } from '@/core/theme/ThemeProvider';

// Drop-in replacement that respects the app override when provided.
export function useColorScheme() {
  return useResolvedColorScheme();
}
