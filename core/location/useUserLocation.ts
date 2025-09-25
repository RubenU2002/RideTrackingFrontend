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

  const requestPermissionAndGetCurrent = useCallback(async () => {
    try {
      const perm = await Location.getForegroundPermissionsAsync();
      let granted = perm.granted;
      if (!granted) {
        const req = await Location.requestForegroundPermissionsAsync();
        granted = req.granted;
      }
      setHasPermission(granted);
      if (granted) {
        const pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      }
      return granted;
    } catch (e: any) {
      setError(e?.message ?? 'location_error');
      return false;
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      await refreshLastKnown();
      if (!mounted) {return;}
      if (requestOnMount) {
        await requestPermissionAndGetCurrent();
      } else {
        const fg = await Location.getForegroundPermissionsAsync();
        if (!mounted) {return;}
        setHasPermission(fg.granted);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [refreshLastKnown, requestOnMount, requestPermissionAndGetCurrent]);

  return {
    coords,
    error,
    hasPermission,
    refreshLastKnown,
    requestPermissionAndGetCurrent,
  } as const;
}
