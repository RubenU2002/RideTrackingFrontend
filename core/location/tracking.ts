import { Platform } from '@/core/api/Platform';
import type { CreateTripDto } from '@/core/api/trips';
import { DEFAULT_DISTANCE_INTERVAL_M, DEFAULT_TIME_INTERVAL_MS } from '@/core/location/config';
import {
  addTripPoint,
  createLocalTrip,
  deleteTripCascade,
  finalizeLocalTrip,
  getActiveTrip,
  getTripWithPoints,
} from '@/core/storage/tripRepo';
import { flushOutboxOnce, queueTripToOutbox } from '@/core/sync/outbox';
import { createLogger, fmtCoord } from '@/core/utils/logger';
import { nowInColombia, toColombiaISO } from '@/core/utils/timezone';
import cuid from 'cuid';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';

export const TASK_NAME = 'TRIP_TRACKING';
const log = createLogger('Tracking');

const lastPointByTrip = new Map<string, { lat: number; lng: number; ts: number }>();

type TripStatsUpdateCallback = () => void;
let statsUpdateCallback: TripStatsUpdateCallback | null = null;
let lastNotificationTime = 0;
const NOTIFICATION_THROTTLE_MS = 2000;

export function setStatsUpdateCallback(callback: TripStatsUpdateCallback | null) {
  statsUpdateCallback = callback;
}

function notifyStatsUpdate() {
  const now = nowInColombia();
  if (statsUpdateCallback && now - lastNotificationTime > NOTIFICATION_THROTTLE_MS) {
    lastNotificationTime = now;
    statsUpdateCallback();
  }
}

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
    const ts = Number.isFinite(tsRaw) ? tsRaw : nowInColombia();
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
    notifyStatsUpdate();
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
  platform?: Platform;
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
  const start = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
  const tripId = cuid();
  await createLocalTrip({
    id: tripId,
    userId: opts.userId,
    platform: opts.platform,
    startTime: nowInColombia(),
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
    accuracy: Location.Accuracy.High,
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
  platform: Platform;
  notes?: string;
}): Promise<{ queued: boolean; body?: CreateTripDto }> {
  const end = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
  const active = await getActiveTrip();
  if (!active) {
    return { queued: false };
  }

  await finalizeLocalTrip({
    tripId: active.id,
    endTime: nowInColombia(),
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
  if (!t.trip.platform || !t.trip.startTime || !t.trip.endTime) {
    log.error('Trip missing required fields', {
      platform: t.trip.platform,
      startTime: t.trip.startTime,
      endTime: t.trip.endTime,
    });
    return { queued: false };
  }

  const body: CreateTripDto = {
    platform: t.trip.platform,
    startTime: toColombiaISO(t.trip.startTime),
    endTime: toColombiaISO(t.trip.endTime),
    startLatitude: t.trip.startLat ?? 0,
    startLongitude: t.trip.startLng ?? 0,
    endLatitude: t.trip.endLat ?? undefined,
    endLongitude: t.trip.endLng ?? undefined,
    fare: t.trip.amount ?? undefined,
    currency: 'COP',
    notes: t.trip.notes ?? undefined,
    points: t.points.map((p) => ({
      latitude: p.lat,
      longitude: p.lng,
      timestamp: toColombiaISO(p.ts),
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

export async function cancelTripTracking(): Promise<void> {
  const started = await Location.hasStartedLocationUpdatesAsync(TASK_NAME);
  if (started) {
    await Location.stopLocationUpdatesAsync(TASK_NAME);
  }

  const active = await getActiveTrip();
  if (!active) {
    log.info('No active trip to cancel');
    return;
  }

  try {
    await deleteTripCascade(active.id);
    try {
      lastPointByTrip.delete(active.id);
    } catch {}
    log.info('Cancelled trip and removed local data', active.id);
  } catch (e) {
    log.warn('Failed to cancel trip locally', e);
  }
}
