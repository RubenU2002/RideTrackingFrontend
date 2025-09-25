import { tripsApi, type CreateTripDto } from '@/core/api/trips';
import { API_BASE_URL } from '@/core/config/env';
import type { DbPoint, DbTrip } from '@/core/storage/sqlite';
import { getDb } from '@/core/storage/sqlite';
import {
  deleteTripCascade,
  getPendingCompletedTrips,
  markTripSynced,
} from '@/core/storage/tripRepo';
import { createLogger } from '@/core/utils/logger';
import { nowInColombia, toColombiaISO } from '@/core/utils/timezone';
import { isValidPlatform, mapLegacyPlatform } from '../utils/platform';

const log = createLogger('Outbox');

export async function pendingOutboxCount(): Promise<number> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ c: number }>(
    'SELECT COUNT(1) as c FROM outbox WHERE status = "PENDING"',
  );
  return row?.c ?? 0;
}

export async function queueTripToOutbox(tripBody: CreateTripDto, tripId?: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO outbox (endpoint, method, body, attempts, status, tripId) VALUES (?, 'POST', ?, 0, 'PENDING', ?)`,
    '/trips',
    JSON.stringify(tripBody),
    tripId ?? null,
  );
  log.info('Queued trip body to outbox', 'points:', tripBody.points.length);
}

function toCreateTripDto(trip: DbTrip, points: DbPoint[]): CreateTripDto | null {
  // Validaciones más detalladas
  if (points.length === 0) {
    log.warn('Trip has no points, skipping:', trip.id);
    return null;
  }

  if (
    trip.startLat === null ||
    trip.startLat === undefined ||
    trip.startLng === null ||
    trip.startLng === undefined
  ) {
    log.warn('Trip missing start coordinates, skipping:', trip.id);
    return null;
  }

  if (!trip.platform) {
    log.warn('Trip missing platform, skipping:', trip.id);
    return null;
  }
  const platform =
    typeof trip.platform === 'string'
      ? isValidPlatform(trip.platform)
        ? trip.platform
        : mapLegacyPlatform(trip.platform)
      : trip.platform;

  if (!trip.startTime) {
    log.warn('Trip missing startTime, skipping:', trip.id);
    return null;
  }

  if (!trip.endTime) {
    log.warn('Trip missing endTime, skipping:', trip.id);
    return null;
  }

  return {
    platform: platform,
    startTime: toColombiaISO(trip.startTime),
    endTime: toColombiaISO(trip.endTime),
    startLatitude: trip.startLat!,
    startLongitude: trip.startLng!,
    endLatitude: trip.endLat ?? undefined,
    endLongitude: trip.endLng ?? undefined,
    fare: trip.amount ?? undefined,
    currency: 'COP', // Por defecto COP, se puede hacer configurable después
    notes: trip.notes ?? undefined,
    points: points.map((p) => ({
      latitude: p.lat,
      longitude: p.lng,
      timestamp: toColombiaISO(p.ts),
      speed: p.speed ?? undefined,
      heading: p.heading ?? undefined,
      altitude: p.altitude ?? undefined,
      accuracy: p.accuracy ?? undefined,
    })),
  };
}

async function hasGoodInternet(timeoutMs = 4000): Promise<boolean> {
  try {
    const controller = new AbortController();
    const to = setTimeout(() => controller.abort(), timeoutMs);
    const healthUrl = `${API_BASE_URL}/health`;
    const res = await fetch(healthUrl, {
      method: 'GET',
      signal: controller.signal,
    }).catch(() => null);
    clearTimeout(to);
    const ok = !!res && res.ok;
    if (!ok) {
      log.warn('Health check failed');
    }
    return ok;
  } catch (_e) {
    log.warn('Error checking internet', _e);
    return false;
  }
}

export async function flushOutboxOnce(): Promise<{ sent: number; failed: number }> {
  const db = await getDb();
  const good = await hasGoodInternet();
  if (!good) {
    log.debug('Skip flush: internet not good');
    return { sent: 0, failed: 0 };
  }

  // First, send any explicitly queued bodies
  const queued = await db.getAllAsync<{
    id: number;
    endpoint: string;
    method: string;
    body: string;
    attempts: number;
    tripId: string | null;
  }>(
    'SELECT id, endpoint, method, body, attempts, tripId FROM outbox WHERE status="PENDING" ORDER BY id ASC LIMIT 10',
  );
  let sent = 0;
  let failed = 0;
  for (const item of queued) {
    const body = JSON.parse(item.body) as CreateTripDto;
    try {
      await tripsApi.createTrip(body);
      sent++;
      // If this outbox item corresponds to a local trip, mark it as synced
      if (item.tripId) {
        try {
          await markTripSynced(item.tripId);
        } catch {
          log.warn('Could not mark trip synced for outbox item', item.tripId);
        }
      }
      log.debug('body:', body);
      await db.runAsync('DELETE FROM outbox WHERE id=?', item.id);
    } catch (e) {
      failed++;
      log.error('Error sending outbox item', item.id, e);
      await db.runAsync(
        'UPDATE outbox SET attempts = attempts + 1, lastAttemptAt=? WHERE id=?',
        nowInColombia(),
        item.id,
      );
    }
  }

  // Also try to send any completed trips not yet queued/synced
  // First, build a set of tripIds already pending in outbox to avoid duplicates
  const queuedTripIdsRows = await db.getAllAsync<{ tripId: string | null }>(
    'SELECT DISTINCT tripId FROM outbox WHERE status="PENDING" AND tripId IS NOT NULL',
  );
  const queuedTripIds = new Set(
    queuedTripIdsRows.map((r) => r.tripId).filter((v): v is string => !!v),
  );
  const pendingTrips = (await getPendingCompletedTrips(3)).filter(
    (t) => !queuedTripIds.has(t.trip.id),
  );
  for (const t of pendingTrips) {
    const body = toCreateTripDto(t.trip, t.points);
    if (!body) {
      continue;
    }
    try {
      log.info('Flushing trip', t.trip.id, 'points:', body.points.length);
      await tripsApi.createTrip(body);
      await markTripSynced(t.trip.id);
      sent++;
    } catch (_e) {
      log.warn('Error sending trip', t.trip.id, _e);
      await queueTripToOutbox(body, t.trip.id);
      try {
        await deleteTripCascade(t.trip.id);
      } catch (e) {
        log.warn('Could not delete local trip after queuing to outbox', t.trip.id, e);
      }
      failed++;
    }
  }

  log.info('Flush result', { sent, failed });
  return { sent, failed };
}
