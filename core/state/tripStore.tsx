import { Platform } from '@/core/api/Platform';
import { getActiveTrip } from '@/core/storage/tripRepo';
import { nowInColombia } from '@/core/utils/timezone';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from 'react';

export type PlatformName = Platform;

export type TripPoint = {
  lat: number;
  lng: number;
  ts: number;
};

export type Trip = {
  id: string;
  start: number;
  end?: number;
  amount?: number;
  platform?: PlatformName;
  points: TripPoint[];
};

export type CurrentTripStats = {
  id: string;
  startTime: number;
  pointsCount: number;
  distanceKm: number;
  lastPoint?: TripPoint;
  // Velocidad instantánea estimada (km/h) basada en el último punto o segmento
  currentSpeedKmh?: number;
};

type State = {
  trips: Trip[];
  currentTripStats?: CurrentTripStats;
  isActiveTrip: boolean;
};

type Action =
  | { type: 'START_TRIP'; id: string; start: number }
  | { type: 'UPDATE_STATS'; stats: CurrentTripStats }
  | { type: 'END_TRIP'; end: number; amount: number; platform: PlatformName }
  | { type: 'CLEAR_ALL' }
  | { type: 'SET_ACTIVE_STATUS'; isActive: boolean };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'START_TRIP':
      return {
        ...state,
        isActiveTrip: true,
        currentTripStats: {
          id: action.id,
          startTime: action.start,
          pointsCount: 0,
          distanceKm: 0,
        },
      };
    case 'UPDATE_STATS':
      return {
        ...state,
        currentTripStats: action.stats,
      };
    case 'END_TRIP':
      if (!state.currentTripStats) {
        return state;
      }
      const completedTrip: Trip = {
        id: state.currentTripStats.id,
        start: state.currentTripStats.startTime,
        end: action.end,
        amount: action.amount,
        platform: action.platform,
        points: [],
      };
      return {
        trips: [...state.trips, completedTrip],
        isActiveTrip: false,
        currentTripStats: undefined,
      };
    case 'SET_ACTIVE_STATUS':
      return {
        ...state,
        isActiveTrip: action.isActive,
        currentTripStats: action.isActive ? state.currentTripStats : undefined,
      };
    case 'CLEAR_ALL':
      return { trips: [], isActiveTrip: false, currentTripStats: undefined };
    default:
      return state;
  }
}

type Store = State & {
  startTrip: () => void;
  updateTripStats: (stats: CurrentTripStats) => void;
  endTrip: (payload: { amount: number; platform: PlatformName }) => void;
  clearAll: () => void;
  checkActiveTrip: () => Promise<void>;
};

const TripContext = createContext<Store | undefined>(undefined);

export function TripProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, {
    trips: [],
    isActiveTrip: false,
    currentTripStats: undefined,
  });

  const startTrip = useCallback(() => {
    dispatch({ type: 'START_TRIP', id: `trip_${nowInColombia()}`, start: nowInColombia() });
  }, []);

  const updateTripStats = useCallback((stats: CurrentTripStats) => {
    dispatch({ type: 'UPDATE_STATS', stats });
  }, []);

  const endTrip = useCallback((payload: { amount: number; platform: PlatformName }) => {
    dispatch({
      type: 'END_TRIP',
      end: Date.now(),
      amount: payload.amount,
      platform: payload.platform,
    });
  }, []);

  const clearAll = useCallback(() => dispatch({ type: 'CLEAR_ALL' }), []);

  const checkActiveTrip = useCallback(async () => {
    try {
      const activeTrip = await getActiveTrip();
      dispatch({ type: 'SET_ACTIVE_STATUS', isActive: !!activeTrip });
    } catch (error) {
      console.warn('Error checking active trip:', error);
      dispatch({ type: 'SET_ACTIVE_STATUS', isActive: false });
    }
  }, []);

  useEffect(() => {
    checkActiveTrip();
  }, [checkActiveTrip]);

  const value = useMemo<Store>(
    () => ({ ...state, startTrip, updateTripStats, endTrip, clearAll, checkActiveTrip }),
    [state, startTrip, updateTripStats, endTrip, clearAll, checkActiveTrip],
  );

  return <TripContext.Provider value={value}>{children}</TripContext.Provider>;
}

export function useTripStore() {
  const ctx = useContext(TripContext);
  if (!ctx) {
    throw new Error('useTripStore must be used within TripProvider');
  }
  return ctx;
}

// Local computeStats removed in favor of backend-powered statistics endpoint.
