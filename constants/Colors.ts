/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

// Modern cool palette inspired by clean data UIs
const tintColorLight = '#2D7FF9'; // primary accent (light)
const tintColorDark = '#7FB3FF'; // primary accent (dark)

// Extended tokens for richer styling
export const Palette = {
  light: {
    background: '#F7FAFF',
    surface: '#FFFFFF',
    surfaceAlt: '#F0F4FB',
    text: '#0B1220',
    muted: '#6B778C',
    border: '#E3EAF6',
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
    accent: tintColorLight,
  },
  dark: {
    background: '#0B1220',
    surface: '#0E1626',
    surfaceAlt: '#101B2E',
    text: '#E6EDF8',
    muted: '#9AA7BD',
    border: '#1F2A44',
    success: '#34D399',
    warning: '#FBBF24',
    danger: '#F87171',
    accent: tintColorDark,
  },
} as const;

export const Colors = {
  light: {
    text: Palette.light.text,
    background: Palette.light.background,
    tint: tintColorLight,
    icon: '#5E6B82',
    tabIconDefault: '#7A889F',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: Palette.dark.text,
    background: Palette.dark.background,
    tint: tintColorDark,
    icon: '#9AA7BD',
    tabIconDefault: '#8995AA',
    tabIconSelected: tintColorDark,
  },
};
