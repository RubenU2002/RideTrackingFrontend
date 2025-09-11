import * as SecureStore from 'expo-secure-store';

const SETTINGS_KEY = 'rt_user_settings_v1';

export type UserSettings = {
  trackingOnlyDuringTrip: boolean;
};

const defaultSettings: UserSettings = {
  trackingOnlyDuringTrip: true,
};

export async function loadSettings(): Promise<UserSettings> {
  try {
    const raw = await SecureStore.getItemAsync(SETTINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...defaultSettings, ...parsed };
    }
  } catch (e) {
    if (__DEV__) {console.warn('No se pudieron cargar settings', e);}
  }
  return { ...defaultSettings };
}

export async function saveSettings(s: UserSettings): Promise<void> {
  try {
    await SecureStore.setItemAsync(SETTINGS_KEY, JSON.stringify(s), {
      keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
    });
  } catch (e) {
    if (__DEV__) {console.warn('No se pudieron guardar settings', e);}
  }
}
