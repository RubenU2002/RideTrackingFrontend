const baseUrl = process.env.EXPO_PUBLIC_API_BASE_URL;

if (!baseUrl) {
  if (process.env.NODE_ENV !== 'test') {
    // Throw at build/bundle time to fail with a clear message.
    // This ensures developers configure the environment before running the app.
    throw new Error(
      'Missing EXPO_PUBLIC_API_BASE_URL. Create RideTrackingFrontend/.env from .env.example and set EXPO_PUBLIC_API_BASE_URL.',
    );
  }
}

export const API_BASE_URL = baseUrl ?? 'http://localhost:3000/api/v1';
