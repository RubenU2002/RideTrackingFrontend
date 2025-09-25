import { setStatsUpdateCallback } from '@/core/location/tracking';
import { getDb } from '@/core/storage/sqlite';
import { getActiveTrip } from '@/core/storage/tripRepo';
import { haversineKm } from '@/features/heatmap/recommendation';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { CurrentTripStats, TripPoint } from './tripStore';

type TripStatsHookResult = {
  currentStats?: CurrentTripStats;
  isLoading: boolean;
  refreshStats: () => Promise<void>;
};

export function useTripStats(): TripStatsHookResult {
  const [currentStats, setCurrentStats] = useState<CurrentTripStats | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isRefreshingRef = useRef(false);
  const refreshStatsRef = useRef<() => Promise<void>>(async () => {});

  const calculateDistance = useCallback((points: TripPoint[]): number => {
    if (points.length < 2) {
      return 0;
    }

    let totalDistance = 0;
    for (let i = 1; i < points.length; i++) {
      totalDistance += haversineKm(points[i - 1], points[i]);
    }
    return totalDistance;
  }, []);

  const refreshStats = useCallback(async () => {
    if (isRefreshingRef.current) {
      return;
    }
    isRefreshingRef.current = true;

    try {
      const activeTrip = await getActiveTrip();
      if (!activeTrip) {
        setCurrentStats(undefined);
        setIsLoading(false);
        return;
      }

      const db = await getDb();
      const pointsResult = await db.getAllAsync<{
        lat: number;
        lng: number;
        ts: number;
        speed?: number | null;
      }>('SELECT lat, lng, ts, speed FROM trip_points WHERE tripId = ? ORDER BY ts ASC', [
        activeTrip.id,
      ]);

      const points: TripPoint[] = pointsResult.map((p) => ({
        lat: p.lat,
        lng: p.lng,
        ts: p.ts,
      }));
      let currentSpeedKmh = 0;
      if (pointsResult.length > 0) {
        const last = pointsResult[pointsResult.length - 1];
        if (
          last.speed !== null &&
          last.speed !== undefined &&
          Number.isFinite(last.speed) &&
          last.speed >= 0
        ) {
          currentSpeedKmh = last.speed * 3.6;
        } else if (points.length >= 2) {
          const speeds: number[] = [];
          const take = Math.min(points.length - 1, 3);
          for (let i = 0; i < take; i++) {
            const a = points[points.length - 2 - i];
            const b = points[points.length - 1 - i];
            const dtSec = Math.max(0, (b.ts - a.ts) / 1000);
            if (dtSec > 0 && dtSec < 60) {
              const dk = haversineKm(a, b);
              speeds.push(dk / (dtSec / 3600));
            }
          }
          if (speeds.length > 0) {
            currentSpeedKmh = speeds.reduce((a, v) => a + v, 0) / speeds.length;
          }
        }
      }

      const newStats: CurrentTripStats = {
        id: activeTrip.id,
        startTime: activeTrip.startTime,
        pointsCount: points.length,
        distanceKm: calculateDistance(points),
        lastPoint: points.length > 0 ? points[points.length - 1] : undefined,
        currentSpeedKmh,
      };

      setCurrentStats((prevStats) => {
        if (
          !prevStats ||
          prevStats.pointsCount !== newStats.pointsCount ||
          Math.abs(prevStats.distanceKm - newStats.distanceKm) > 0.001
        ) {
          return newStats;
        }
        return prevStats;
      });
      setIsLoading(false);
    } catch (error) {
      console.warn('Error refreshing trip stats:', error);
      setCurrentStats(undefined);
      setIsLoading(false);
    } finally {
      isRefreshingRef.current = false;
    }
  }, [calculateDistance]);

  refreshStatsRef.current = refreshStats;

  const debouncedRefresh = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      refreshStatsRef.current?.();
    }, 800);
  }, []);

  useEffect(() => {
    refreshStats();

    setStatsUpdateCallback(debouncedRefresh);

    intervalRef.current = setInterval(() => {
      refreshStatsRef.current?.();
    }, 20000);

    return () => {
      setStatsUpdateCallback(null);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [debouncedRefresh, refreshStats]);

  return {
    currentStats,
    isLoading,
    refreshStats,
  };
}
