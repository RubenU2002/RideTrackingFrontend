import MapboxGL from '@rnmapbox/maps';

// Initialize Mapbox access token once for the whole app.
// Uses EXPO_PUBLIC_ prefix so it is embedded at build time.
const token = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN;

if (!token) {
  console.warn(
    '[mapbox] Missing EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN. Map views will not render without a token.',
  );
} else {
  try {
    MapboxGL.setAccessToken(token);
  } catch (e) {
    console.warn('[mapbox] Failed setting access token', e);
  }
}

// Configure some sane defaults to reduce re-renders & work.
MapboxGL.setTelemetryEnabled(false);

export {}; // module side-effects only
