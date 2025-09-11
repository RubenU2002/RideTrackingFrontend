import * as SecureStore from 'expo-secure-store';

// Key used to persist preferred theme mode
const THEME_MODE_KEY = 'rt_theme_mode_v1';

export type PersistedThemeMode = 'system' | 'light' | 'dark';

export async function saveThemeMode(mode: PersistedThemeMode) {
  try {
    await SecureStore.setItemAsync(THEME_MODE_KEY, mode, {
      keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
    });
  } catch (e) {
    if (__DEV__) {console.warn('No se pudo guardar el modo de tema', e);}
    inMemoryThemeMode = mode;
  }
}

export async function loadThemeMode(): Promise<PersistedThemeMode | null> {
  try {
    const v = await SecureStore.getItemAsync(THEME_MODE_KEY);
    if (v === 'system' || v === 'light' || v === 'dark') {return v;}
  } catch {}
  return inMemoryThemeMode;
}

let inMemoryThemeMode: PersistedThemeMode | null = null;
export function setMemoryThemeMode(v: PersistedThemeMode | null) {
  inMemoryThemeMode = v;
}
