import { getDb } from '@/core/storage/sqlite';
import { getPendingCompletedTrips, markTripSynced } from '@/core/storage/tripRepo';
import type { DbPoint } from '@/core/storage/sqlite';
import { tripsApi, type CreateTripDto } from '@/core/api/trips';
import { API_BASE_URL } from '@/core/config/env';
import { createLogger } from '@/core/utils/logger';

const log = createLogger('Outbox');

export async function pendingOutboxCount(): Promise<number> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ c: number }>(
    'SELECT COUNT(1) as c FROM outbox WHERE status = "PENDING"',
  );
  return row?.c ?? 0;
}

export async function queueTripToOutbox(tripBody: CreateTripDto): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO outbox (endpoint, method, body, attempts, status) VALUES (?, 'POST', ?, 0, 'PENDING')`,
    '/trips',
    JSON.stringify(tripBody),
  );
  log.info('Queued trip body to outbox', 'points:', tripBody.points.length);
}

function toCreateTripDto(
  userId: string,
  points: DbPoint[],
  extra: {
    startLat?: number | null;
    startLng?: number | null;
    endLat?: number | null;
    endLng?: number | null;
    fare?: number | null;
    notes?: string | null;
  },
): CreateTripDto | null {
  if (
    points.length === 0 ||
    extra.startLat === null ||
    extra.startLat === undefined ||
    extra.startLng === null ||
    extra.startLng === undefined
  )
    {return null;}
  return {
    userId,
    startLatitude: extra.startLat!,
    startLongitude: extra.startLng!,
    endLatitude: extra.endLat ?? undefined,
    endLongitude: extra.endLng ?? undefined,
    fare: extra.fare ?? undefined,
    status: 'COMPLETED',
    notes: extra.notes ?? undefined,
    points: points.map((p) => ({
      latitude: p.lat,
      longitude: p.lng,
      timestamp: new Date(p.ts).toISOString(),
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
    if (!ok) {log.warn('Health check failed');}
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
  }>(
    'SELECT id, endpoint, method, body, attempts FROM outbox WHERE status="PENDING" ORDER BY id ASC LIMIT 10',
  );
  let sent = 0;
  let failed = 0;
  for (const item of queued) {
    const body = JSON.parse(item.body) as CreateTripDto;
    try {
      await tripsApi.createTrip(body);
      sent++;
      await db.runAsync('DELETE FROM outbox WHERE id=?', item.id);
    } catch {
      failed++;
      await db.runAsync(
        'UPDATE outbox SET attempts = attempts + 1, lastAttemptAt=? WHERE id=?',
        Date.now(),
        item.id,
      );
    }
  }

  // Also try to send any completed trips not yet queued/synced
  const pendingTrips = await getPendingCompletedTrips(3);
  for (const t of pendingTrips) {
    const body = toCreateTripDto(t.trip.userId, t.points, {
      startLat: t.trip.startLat ?? null,
      startLng: t.trip.startLng ?? null,
      endLat: t.trip.endLat ?? null,
      endLng: t.trip.endLng ?? null,
      fare: t.trip.amount ?? null,
      notes: t.trip.notes ?? null,
    });
    if (!body) {continue;}
    try {
      log.info('Flushing trip', t.trip.id, 'points:', body.points.length);
      await tripsApi.createTrip(body);
      await markTripSynced(t.trip.id);
      sent++;
    } catch (_e) {
      log.warn('Error sending trip', t.trip.id, _e);
      await queueTripToOutbox(body);
      failed++;
    }
  }

  log.info('Flush result', { sent, failed });
  return { sent, failed };
}
