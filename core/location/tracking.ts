import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import cuid from 'cuid';
import {
  addTripPoint,
  createLocalTrip,
  finalizeLocalTrip,
  getActiveTrip,
  getTripWithPoints,
  deleteTripCascade,
} from '@/core/storage/tripRepo';
import { DEFAULT_DISTANCE_INTERVAL_M, DEFAULT_TIME_INTERVAL_MS } from '@/core/location/config';
import { flushOutboxOnce, queueTripToOutbox } from '@/core/sync/outbox';
import type { CreateTripDto } from '@/core/api/trips';
import { createLogger, fmtCoord } from '@/core/utils/logger';

export const TASK_NAME = 'TRIP_TRACKING';
const log = createLogger('Tracking');

// Optional foreground listener for screen UI
let fgSub: Location.LocationSubscription | null = null;

// In-memory dedupe cache: last saved point per trip
const lastPointByTrip = new Map<string, { lat: number; lng: number; ts: number }>();

// Define background task to persist points
TaskManager.defineTask(TASK_NAME, async ({ data, error }) => {
  if (error) {
    log.warn('Background task error:', error);
    return;
  }
  const { locations } = data as { locations: Location.LocationObject[] };
  if (!locations || locations.length === 0) {
    return;
  }
  const active = await getActiveTrip();
  if (!active) {
    const started = await Location.hasStartedLocationUpdatesAsync(TASK_NAME);
    if (started) {
      await Location.stopLocationUpdatesAsync(TASK_NAME);
    }
    log.info('Locations received with no active trip; stopped updates');
    return;
  }
  for (const loc of locations) {
    const { coords, timestamp } = loc;
    if (coords.accuracy !== null && coords.accuracy !== undefined && coords.accuracy > 80) {
      continue;
    }
    const tsRaw = typeof timestamp === 'number' ? timestamp : new Date(timestamp).getTime();
    const ts = Number.isFinite(tsRaw) ? tsRaw : Date.now();
    const norm = (v: number | null | undefined) =>
      v === null || v === undefined || !Number.isFinite(v) || v < 0 ? null : v;
    const prev = lastPointByTrip.get(active.id);
    const sameCoords =
      prev &&
      Math.abs(prev.lat - coords.latitude) < 1e-6 &&
      Math.abs(prev.lng - coords.longitude) < 1e-6;
    if (sameCoords) {
      continue;
    }
    const tripPoint = {
      tripId: active.id,
      lat: coords.latitude,
      lng: coords.longitude,
      ts,
      speed: norm(coords.speed),
      heading: norm(coords.heading),
      altitude: coords.altitude ?? null,
      accuracy: coords.accuracy ?? null,
    };
    log.debug('Adding trippoint', tripPoint);
    await addTripPoint(tripPoint);
    lastPointByTrip.set(active.id, { lat: coords.latitude, lng: coords.longitude, ts });
    log.debug(
      'BG saved point',
      `lat=${fmtCoord(coords.latitude)}`,
      `lng=${fmtCoord(coords.longitude)}`,
      `acc=${coords.accuracy ?? 'n/a'}m`,
    );
  }
});

export type StartTripOptions = {
  userId: string;
  platform?: string;
  timeIntervalMs?: number;
  distanceIntervalM?: number;
};

export async function requestLocationPermissions(): Promise<boolean> {
  const fg = await Location.requestForegroundPermissionsAsync();
  if (fg.status !== 'granted') {
    return false;
  }
  const bg = await Location.requestBackgroundPermissionsAsync();
  return bg.status === 'granted';
}

export async function startTripTracking(opts: StartTripOptions): Promise<{ tripId: string }> {
  const granted = await requestLocationPermissions();
  if (!granted) {
    log.warn('Permissions not granted — aborting start');
    throw new Error('Permisos de ubicación no concedidos');
  }
  log.info('Starting trip tracking for user', opts.userId);
  const start = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
  const tripId = cuid();
  await createLocalTrip({
    id: tripId,
    userId: opts.userId,
    platform: opts.platform,
    startTime: Date.now(),
    startLat: start.coords.latitude,
    startLng: start.coords.longitude,
  });
  log.info(
    'Trip created',
    tripId,
    `start=${fmtCoord(start.coords.latitude)},${fmtCoord(start.coords.longitude)}`,
    `interval=${opts.timeIntervalMs ?? DEFAULT_TIME_INTERVAL_MS}ms/${opts.distanceIntervalM ?? DEFAULT_DISTANCE_INTERVAL_M}m`,
  );
  log.info(
    'timeIntervalMs:',
    opts.timeIntervalMs ?? DEFAULT_TIME_INTERVAL_MS,
    'distanceIntervalM:',
    opts.distanceIntervalM ?? DEFAULT_DISTANCE_INTERVAL_M,
  );
  await Location.startLocationUpdatesAsync(TASK_NAME, {
    accuracy: Location.Accuracy.Balanced,
    timeInterval: opts.timeIntervalMs ?? DEFAULT_TIME_INTERVAL_MS,
    distanceInterval: opts.distanceIntervalM ?? DEFAULT_DISTANCE_INTERVAL_M,
    showsBackgroundLocationIndicator: false,
    foregroundService: {
      notificationTitle: 'Tracking de viaje activo',
      notificationBody: 'Registrando tu ubicación para el viaje',
      notificationColor: '#0a84ff',
    },
    pausesUpdatesAutomatically: false,
  });
  log.info('Background updates started for', tripId);

  return { tripId };
}

export async function stopTripTracking(params: {
  amount: number;
  platform: string;
  notes?: string;
}): Promise<{ queued: boolean; body?: CreateTripDto }> {
  try {
    fgSub?.remove();
  } catch {}
  fgSub = null;

  const end = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
  const active = await getActiveTrip();
  if (!active) {
    return { queued: false };
  }

  await finalizeLocalTrip({
    tripId: active.id,
    endTime: Date.now(),
    endLat: end.coords.latitude,
    endLng: end.coords.longitude,
    amount: params.amount,
    platform: params.platform,
    notes: params.notes,
  });
  log.info(
    'Trip finalized',
    active.id,
    `end=${fmtCoord(end.coords.latitude)},${fmtCoord(end.coords.longitude)}`,
    `amount=${params.amount}`,
    `platform=${params.platform}`,
  );

  // Stop background updates if running
  const started = await Location.hasStartedLocationUpdatesAsync(TASK_NAME);
  if (started) {
    await Location.stopLocationUpdatesAsync(TASK_NAME);
  }
  log.info('Background updates stopped for', active.id);

  // Try sending or queue
  const t = await getTripWithPoints(active.id);
  if (!t) {
    return { queued: false };
  }
  log.debug('Preparing payload for trip', active.id, 'points:', t.points.length);
  const body: CreateTripDto = {
    userId: t.trip.userId,
    startLatitude: t.trip.startLat ?? 0,
    startLongitude: t.trip.startLng ?? 0,
    endLatitude: t.trip.endLat ?? undefined,
    endLongitude: t.trip.endLng ?? undefined,
    fare: t.trip.amount ?? undefined,
    status: 'COMPLETED',
    notes: t.trip.notes ?? undefined,
    points: t.points.map((p) => ({
      latitude: p.lat,
      longitude: p.lng,
      timestamp: new Date(p.ts).toISOString(),
      speed:
        p.speed !== null && p.speed !== undefined && Number.isFinite(p.speed) && p.speed >= 0
          ? p.speed
          : undefined,
      heading:
        p.heading !== null &&
        p.heading !== undefined &&
        Number.isFinite(p.heading) &&
        p.heading >= 0
          ? p.heading
          : undefined,
      altitude: p.altitude ?? undefined,
      accuracy: p.accuracy ?? undefined,
    })),
  };

  // Try flush now; if fails it will be queued after
  try {
    await queueTripToOutbox(body, active.id);
    await deleteTripCascade(active.id);
    try {
      lastPointByTrip.delete(active.id);
    } catch {}
    log.info('Trip queued to outbox and local deleted', active.id, 'points:', body.points.length);
    await flushOutboxOnce();
    return { queued: true, body };
  } catch {
    log.warn('Immediate flush failed; will retry later for trip', active.id);
    return { queued: true, body };
  }
}

export async function startUiLocationFeed(options?: {
  timeIntervalMs?: number;
  distanceIntervalM?: number;
  onPoint?: (p: { lat: number; lng: number; ts: number }) => void;
}): Promise<() => void> {
  log.info('Starting UI location feed');
  const sub = await Location.watchPositionAsync(
    {
      accuracy: Location.Accuracy.Balanced,
      timeInterval: options?.timeIntervalMs ?? DEFAULT_TIME_INTERVAL_MS,
      distanceInterval: options?.distanceIntervalM ?? DEFAULT_DISTANCE_INTERVAL_M,
    },
    async (loc) => {
      const { coords, timestamp } = loc;
      const tsRaw = typeof timestamp === 'number' ? timestamp : new Date(timestamp).getTime();
      const ts = Number.isFinite(tsRaw) ? tsRaw : Date.now();
      if (coords.accuracy !== null && coords.accuracy !== undefined && coords.accuracy > 80) {
        return;
      }
      const norm = (v: number | null | undefined) =>
        v === null || v === undefined || !Number.isFinite(v) || v < 0 ? null : v;
      // write to DB for active trip as well
      const active = await getActiveTrip();
      if (active) {
        const prev = lastPointByTrip.get(active.id);
        const sameCoords =
          prev &&
          Math.abs(prev.lat - coords.latitude) < 1e-6 &&
          Math.abs(prev.lng - coords.longitude) < 1e-6;
        if (!sameCoords) {
          await addTripPoint({
            tripId: active.id,
            lat: coords.latitude,
            lng: coords.longitude,
            ts,
            speed: norm(coords.speed),
            heading: norm(coords.heading),
            altitude: coords.altitude ?? null,
            accuracy: coords.accuracy ?? null,
          });
          lastPointByTrip.set(active.id, { lat: coords.latitude, lng: coords.longitude, ts });
          log.debug(
            'FG saved point',
            `lat=${fmtCoord(coords.latitude)}`,
            `lng=${fmtCoord(coords.longitude)}`,
          );
        }
      }
      options?.onPoint?.({ lat: coords.latitude, lng: coords.longitude, ts });
    },
  );
  return () => {
    try {
      sub.remove();
    } catch {}
    log.info('Stopped UI location feed');
  };
}
