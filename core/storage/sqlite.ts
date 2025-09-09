import * as SQLite from 'expo-sqlite';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const db = await SQLite.openDatabaseAsync('ride_tracking.db');
      await db.execAsync('PRAGMA journal_mode = WAL;');
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS trips_local (
          id TEXT PRIMARY KEY NOT NULL,
          userId TEXT NOT NULL,
          platform TEXT,
          startTime INTEGER NOT NULL,
          startLat REAL,
          startLng REAL,
          endTime INTEGER,
          endLat REAL,
          endLng REAL,
          amount REAL,
          notes TEXT,
          status TEXT NOT NULL,
          syncedAt INTEGER
        );
      `);
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS trip_points (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          tripId TEXT NOT NULL,
          lat REAL NOT NULL,
          lng REAL NOT NULL,
          ts INTEGER NOT NULL,
          speed REAL,
          heading REAL,
          altitude REAL,
          accuracy REAL
        );
      `);
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS outbox (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          endpoint TEXT NOT NULL,
          method TEXT NOT NULL,
          body TEXT NOT NULL,
          attempts INTEGER NOT NULL DEFAULT 0,
          lastAttemptAt INTEGER,
          status TEXT NOT NULL DEFAULT 'PENDING'
        );
      `);
      return db;
    })();
  }
  return dbPromise;
}

export type DbTrip = {
  id: string;
  userId: string;
  platform?: string | null;
  startTime: number;
  startLat?: number | null;
  startLng?: number | null;
  endTime?: number | null;
  endLat?: number | null;
  endLng?: number | null;
  amount?: number | null;
  notes?: string | null;
  status: 'STARTED' | 'COMPLETED';
  syncedAt?: number | null;
};

export type DbPoint = {
  id?: number;
  tripId: string;
  lat: number;
  lng: number;
  ts: number;
  speed?: number | null;
  heading?: number | null;
  altitude?: number | null;
  accuracy?: number | null;
};
