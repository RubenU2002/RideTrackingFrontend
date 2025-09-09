import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'rt_access_token';

export async function saveToken(token: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(TOKEN_KEY, token, {
      keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
    });
  } catch {
    console.warn('SecureStore save failed; token kept in memory only');
    inMemoryToken = token;
  }
}

export async function getToken(): Promise<string | null> {
  try {
    const token = await SecureStore.getItemAsync(TOKEN_KEY);
    if (token) {
      return token;
    }
  } catch {
    // ignore
  }
  return inMemoryToken;
}

export async function deleteToken(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  } catch {
    // ignore
  } finally {
    inMemoryToken = null;
  }
}

// In-memory fallback for cases where SecureStore is unavailable
let inMemoryToken: string | null = null;
export function setMemoryToken(token: string | null) {
  inMemoryToken = token;
}
