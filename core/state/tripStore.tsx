import React, { createContext, useCallback, useContext, useMemo, useReducer } from 'react';

export type PlatformName = 'Uber' | 'DiDi' | 'inDrive' | 'Taxi';

export type TripPoint = {
  lat: number;
  lng: number;
  ts: number; // epoch ms
};

export type Trip = {
  id: string;
  start: number; // epoch ms
  end?: number;
  amount?: number; // currency units
  platform?: PlatformName;
  points: TripPoint[];
};

type State = {
  trips: Trip[];
  current?: Trip;
};

type Action =
  | { type: 'START_TRIP'; id: string; start: number }
  | { type: 'ADD_POINT'; point: TripPoint }
  | { type: 'END_TRIP'; end: number; amount: number; platform: PlatformName }
  | { type: 'CLEAR_ALL' };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'START_TRIP':
      return {
        ...state,
        current: { id: action.id, start: action.start, points: [] },
      };
    case 'ADD_POINT':
      if (!state.current) return state;
      return { ...state, current: { ...state.current, points: [...state.current.points, action.point] } };
    case 'END_TRIP':
      if (!state.current) return state;
      return {
        trips: [
          ...state.trips,
          { ...state.current, end: action.end, amount: action.amount, platform: action.platform },
        ],
        current: undefined,
      };
    case 'CLEAR_ALL':
      return { trips: [], current: undefined };
    default:
      return state;
  }
}

type Store = State & {
  startTrip: () => void;
  addPoint: (p: TripPoint) => void;
  endTrip: (payload: { amount: number; platform: PlatformName }) => void;
  clearAll: () => void;
};

const TripContext = createContext<Store | undefined>(undefined);

export function TripProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { trips: [] });

  const startTrip = useCallback(() => {
    dispatch({ type: 'START_TRIP', id: `trip_${Date.now()}`, start: Date.now() });
  }, []);

  const addPoint = useCallback((p: TripPoint) => {
    dispatch({ type: 'ADD_POINT', point: p });
  }, []);

  const endTrip = useCallback((payload: { amount: number; platform: PlatformName }) => {
    dispatch({ type: 'END_TRIP', end: Date.now(), amount: payload.amount, platform: payload.platform });
  }, []);

  const clearAll = useCallback(() => dispatch({ type: 'CLEAR_ALL' }), []);

  const value = useMemo<Store>(() => ({ ...state, startTrip, addPoint, endTrip, clearAll }), [state, startTrip, addPoint, endTrip, clearAll]);

  return <TripContext.Provider value={value}>{children}</TripContext.Provider>;
}

export function useTripStore() {
  const ctx = useContext(TripContext);
  if (!ctx) throw new Error('useTripStore must be used within TripProvider');
  return ctx;
}

// Simple mock tracker: generates a point every ~6s around a base coordinate
let mockInterval: ReturnType<typeof setInterval> | null = null;

export function startMockTracking(add: (p: TripPoint) => void, base: { lat: number; lng: number }) {
  stopMockTracking();
  mockInterval = setInterval(() => {
    const jitter = () => (Math.random() - 0.5) * 0.002; // ~100-200m
    add({ lat: base.lat + jitter(), lng: base.lng + jitter(), ts: Date.now() });
  }, 6000);
}

export function stopMockTracking() {
  if (mockInterval) clearInterval(mockInterval);
  mockInterval = null;
}

export type DailyStats = {
  dateKey: string; // YYYY-MM-DD
  trips: number;
  drivingMs: number;
  earnings: number;
};

export function computeStats(trips: Trip[]): {
  today: DailyStats;
  last7: DailyStats[];
  perHourStarts: Record<string, number>; // '0'..'23'
  earningsPerHour: number;
} {
  const now = new Date();
  const dateKey = (d: Date) => d.toISOString().slice(0, 10);
  const isToday = (t: Trip) => dateKey(new Date(t.start)) === dateKey(now);

  const ms = (t: Trip) => Math.max(0, (t.end ?? Date.now()) - t.start);
  const todayTrips = trips.filter(isToday);
  const today: DailyStats = {
    dateKey: dateKey(now),
    trips: todayTrips.length,
    drivingMs: todayTrips.reduce((acc, t) => acc + ms(t), 0),
    earnings: todayTrips.reduce((acc, t) => acc + (t.amount ?? 0), 0),
  };

  const last7: DailyStats[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const dk = dateKey(d);
    const dayTrips = trips.filter((t) => dateKey(new Date(t.start)) === dk);
    last7.push({
      dateKey: dk,
      trips: dayTrips.length,
      drivingMs: dayTrips.reduce((acc, t) => acc + ms(t), 0),
      earnings: dayTrips.reduce((acc, t) => acc + (t.amount ?? 0), 0),
    });
  }

  const perHourStarts: Record<string, number> = {};
  for (let h = 0; h < 24; h++) perHourStarts[String(h)] = 0;
  trips.forEach((t) => {
    const h = new Date(t.start).getHours();
    perHourStarts[String(h)]++;
  });

  const totalMs = trips.reduce((acc, t) => acc + ms(t), 0);
  const totalE = trips.reduce((acc, t) => acc + (t.amount ?? 0), 0);
  const earningsPerHour = totalMs > 0 ? (totalE / (totalMs / 3600000)) : 0;

  return { today, last7, perHourStarts, earningsPerHour };
}
