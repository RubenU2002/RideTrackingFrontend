import React from 'react';
import { GluestackUIProvider } from '@gluestack-ui/themed';
import { config } from '@gluestack-ui/config';
import { useResolvedColorScheme } from '@/core/theme/ThemeProvider';

export function GSProvider({ children }: { children: React.ReactNode }) {
  const mode = useResolvedColorScheme();
  return (
    <GluestackUIProvider config={config} colorMode={mode === 'dark' ? 'dark' : 'light'}>
      {children}
    </GluestackUIProvider>
  );
}

