import { Platform } from '@/core/api/Platform';
import { getDb, type DbPoint, type DbTrip } from '@/core/storage/sqlite';
import { createLogger, fmtCoord } from '@/core/utils/logger';
import { nowInColombia } from '@/core/utils/timezone';

const log = createLogger('DB');

export async function createLocalTrip(params: {
  id: string;
  userId: string;
  platform?: Platform;
  startTime: number;
  startLat?: number;
  startLng?: number;
}): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO trips_local (id, userId, platform, startTime, startLat, startLng, status) VALUES (?, ?, ?, ?, ?, ?, 'STARTED')`,
    params.id,
    params.userId,
    params.platform ?? null,
    params.startTime,
    params.startLat ?? null,
    params.startLng ?? null,
  );
  log.info(
    'Created trip',
    params.id,
    'user:',
    params.userId,
    'start:',
    `${fmtCoord(params.startLat)},${fmtCoord(params.startLng)}`,
  );
}

export async function getActiveTrip(): Promise<DbTrip | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<DbTrip>(
    `SELECT * FROM trips_local WHERE status='STARTED' LIMIT 1`,
  );
  return row ?? null;
}

export async function addTripPoint(point: DbPoint): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO trip_points (tripId, lat, lng, ts, speed, heading, altitude, accuracy) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    point.tripId,
    point.lat,
    point.lng,
    point.ts,
    point.speed ?? null,
    point.heading ?? null,
    point.altitude ?? null,
    point.accuracy ?? null,
  );
  log.debug(
    'Saved point',
    point.tripId,
    `lat=${fmtCoord(point.lat)}`,
    `lng=${fmtCoord(point.lng)}`,
    `acc=${point.accuracy ?? 'n/a'}m`,
    `ts=${new Date(point.ts).toISOString()}`,
    `speed=${point.speed ?? 'n/a'}m/s`,
    `heading=${point.heading ?? 'n/a'}°`,
    `altitude=${point.altitude ?? 'n/a'}m`,
  );
}

export async function finalizeLocalTrip(params: {
  tripId: string;
  endTime: number;
  endLat?: number;
  endLng?: number;
  amount?: number;
  platform?: Platform;
  notes?: string;
}): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `UPDATE trips_local
     SET endTime=?, endLat=?, endLng=?, amount=?, platform=COALESCE(?, platform), notes=?, status='COMPLETED'
     WHERE id=?`,
    params.endTime,
    params.endLat ?? null,
    params.endLng ?? null,
    params.amount ?? null,
    params.platform ?? null,
    params.notes ?? null,
    params.tripId,
  );
  log.info(
    'Finalized trip',
    params.tripId,
    'end:',
    `${fmtCoord(params.endLat)},${fmtCoord(params.endLng)}`,
    'amount:',
    params.amount ?? 0,
  );
}

export async function getTripWithPoints(
  tripId: string,
): Promise<{ trip: DbTrip; points: DbPoint[] } | null> {
  const db = await getDb();
  const trip = await db.getFirstAsync<DbTrip>('SELECT * FROM trips_local WHERE id=?', tripId);
  if (!trip) {
    return null;
  }
  const points = await db.getAllAsync<DbPoint>(
    'SELECT * FROM trip_points WHERE tripId=? ORDER BY ts ASC',
    tripId,
  );
  return { trip, points };
}

export async function markTripSynced(tripId: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('UPDATE trips_local SET syncedAt=? WHERE id=?', nowInColombia(), tripId);
  log.info('Marked trip synced', tripId);
}

export async function getPendingCompletedTrips(
  limit = 10,
): Promise<{ trip: DbTrip; points: DbPoint[] }[]> {
  const db = await getDb();
  const trips = await db.getAllAsync<DbTrip>(
    `SELECT * FROM trips_local WHERE status='COMPLETED' AND (syncedAt IS NULL OR syncedAt=0) ORDER BY startTime ASC LIMIT ?`,
    limit,
  );
  const results: { trip: DbTrip; points: DbPoint[] }[] = [];
  for (const t of trips) {
    const points = await db.getAllAsync<DbPoint>(
      'SELECT * FROM trip_points WHERE tripId=? ORDER BY ts ASC',
      t.id,
    );
    results.push({ trip: t, points });
  }
  return results;
}

export async function clearAllLocalData(): Promise<void> {
  const db = await getDb();
  await db.execAsync('DELETE FROM trip_points; DELETE FROM trips_local; DELETE FROM outbox;');
}

export async function deleteTripCascade(tripId: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM trip_points WHERE tripId=?', tripId);
  await db.runAsync('DELETE FROM trips_local WHERE id=?', tripId);
  log.info('Deleted local trip and points', tripId);
}
