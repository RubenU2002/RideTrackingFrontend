import * as Location from 'expo-location';
import { useCallback, useEffect, useState } from 'react';

export type LatLng = { lat: number; lng: number };

export function useUserLocation(options?: { requestOnMount?: boolean }) {
  const requestOnMount = options?.requestOnMount ?? false;
  const [coords, setCoords] = useState<LatLng | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  const refreshLastKnown = useCallback(async () => {
    try {
      const last = await Location.getLastKnownPositionAsync({ maxAge: 60_000 });
      if (last?.coords) {
        setCoords({ lat: last.coords.latitude, lng: last.coords.longitude });
      }
    } catch (e: any) {
      setError(e?.message ?? 'location_error');
    }
  }, []);

  const ensureForegroundPermission = useCallback(async () => {
    try {
      const current = await Location.getForegroundPermissionsAsync();
      if (current.granted) {
        setHasPermission(true);
        return true;
      }
      if (!current.canAskAgain) {
        setHasPermission(false);
        return false;
      }
      const requested = await Location.requestForegroundPermissionsAsync();
      setHasPermission(requested.granted);
      return requested.granted;
    } catch (e: any) {
      setError(e?.message ?? 'location_error');
      return false;
    }
  }, []);

  const waitForSinglePosition = useCallback(async () => {
    try {
      const result = await new Promise<LatLng>((resolve, reject) => {
        let cleaned = false;
        let subscription: Location.LocationSubscription | null = null;
        const timeout = setTimeout(() => {
          if (cleaned) {
            return;
          }
          cleaned = true;
          if (subscription) {
            subscription.remove();
          }
          reject(new Error('timeout'));
        }, 7000);

        Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            distanceInterval: 0,
            mayShowUserSettingsDialog: true,
          },
          (pos) => {
            if (cleaned) {
              return;
            }
            cleaned = true;
            clearTimeout(timeout);
            if (subscription) {
              subscription.remove();
            }
            resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          },
        )
          .then((sub) => {
            subscription = sub;
            if (cleaned) {
              subscription.remove();
            }
          })
          .catch((err) => {
            if (cleaned) {
              return;
            }
            cleaned = true;
            clearTimeout(timeout);
            if (subscription) {
              subscription.remove();
            }
            reject(err);
          });
      });
      return result;
    } catch (err: any) {
      throw err;
    }
  }, []);

  const requestPermissionAndGetCurrent = useCallback(async () => {
    const granted = await ensureForegroundPermission();
    if (!granted) {
      return false;
    }
    try {
      const next = await waitForSinglePosition();
      setCoords(next);
      return true;
    } catch (e: any) {
      setError(e?.message ?? 'location_error');
      return false;
    }
  }, [ensureForegroundPermission, waitForSinglePosition]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      await refreshLastKnown();
      if (!mounted) {
        return;
      }
      const fg = await Location.getForegroundPermissionsAsync();
      if (!mounted) {
        return;
      }
      setHasPermission(fg.granted);
      if (requestOnMount && !fg.granted && fg.canAskAgain) {
        await ensureForegroundPermission();
      }
    })();
    return () => {
      mounted = false;
    };
  }, [refreshLastKnown, requestOnMount, ensureForegroundPermission]);

  return {
    coords,
    error,
    hasPermission,
    refreshLastKnown,
    requestPermissionAndGetCurrent,
    ensureForegroundPermission,
  } as const;
}
