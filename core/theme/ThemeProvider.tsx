import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Appearance, ColorSchemeName } from 'react-native';
import { loadThemeMode, saveThemeMode } from './themeStorage';

type ThemeMode = 'system' | 'light' | 'dark';

type ThemeContextValue = {
  mode: ThemeMode;
  resolved: Exclude<ColorSchemeName, null>;
  setMode: (mode: ThemeMode) => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function AppThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>('system');
  useEffect(() => {
    (async () => {
      const stored = await loadThemeMode();
      if (stored) {
        setModeState(stored);
      }
    })();
  }, []);

  const setMode = useCallback((m: ThemeMode) => {
    setModeState(m);
    saveThemeMode(m).catch(() => {});
  }, []);

  const system = Appearance.getColorScheme() ?? 'light';
  const resolved = mode === 'system' ? system : mode;

  const value = useMemo(() => ({ mode, resolved, setMode }), [mode, resolved, setMode]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useThemeController() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useThemeController must be used within AppThemeProvider');
  }
  return ctx;
}

export function useResolvedColorScheme(): Exclude<ColorSchemeName, null> {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    return (Appearance.getColorScheme() ?? 'light') as Exclude<ColorSchemeName, null>;
  }
  return ctx.resolved;
}
