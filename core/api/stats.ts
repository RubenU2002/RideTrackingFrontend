import { api } from '@/core/api/client';

export type TripStatistics = {
  totalTrips: number;
  totalDistance: number;
  totalDuration: number;
  totalEarnings: number;
  averageDistance: number;
  averageSpeed: number;
  averageEarnings: number;
  maxSpeed: number;
};

export type DailySummary = {
  isoDate: string;
  total: number;
  trips: number;
  km: number;
  activeMinutes: number;
  platforms: Record<string, number>;
  earningsPerTrip: { id: string; order: number; amount: number; platform: string }[];
  activityBlocks: number[]; // values 0-100 representing relative activity intensity
};

export type CalendarHeatCell = {
  isoDate: string;
  total: number; // daily total earnings used for heat color
};

export type PlatformsDistribution = {
  platform: string;
  total: number;
  percentage: number;
};

export type ExtendedStatsPayload = {
  summary: DailySummary; // current selected date summary
  prevDaySummary?: DailySummary; // previous day (for delta comparisons)
  byPlatform: PlatformsDistribution[]; // distribution for pie
  calendar: CalendarHeatCell[]; // optional: fill from backend dates
  base: TripStatistics; // aggregated stats across returned range
};

export type ExtendedStatsResponse = {
  success: true;
  message: string;
  data: ExtendedStatsPayload;
};

type BackendStatsResponse = {
  success: boolean;
  message: string;
  data: Record<string, DailySummary>; // keyed by iso date
};

function toPlatformsDistribution(summary: DailySummary): PlatformsDistribution[] {
  return Object.entries(summary.platforms).map(([platform, value]) => ({
    platform,
    total: value,
    percentage: Math.round((value / Math.max(1, summary.total)) * 100),
  }));
}

function aggregateBase(dataset: DailySummary[], selected: DailySummary): TripStatistics {
  const totalTrips = dataset.reduce((a, d) => a + d.trips, 0);
  const totalDistance = Math.round(dataset.reduce((a, d) => a + d.km * 1000, 0));
  const totalDuration = Math.round(dataset.reduce((a, d) => a + d.activeMinutes * 60, 0));
  const totalEarnings = dataset.reduce((a, d) => a + d.total, 0);
  const averageDistance = Math.round(
    (dataset.reduce((a, d) => a + d.km, 0) / Math.max(1, dataset.length)) * 1000,
  );
  const averageSpeed = totalDuration > 0 ? totalDistance / 1000 / (totalDuration / 3600) : 0; // km/h
  const averageEarnings = Math.round(selected.total / Math.max(1, selected.trips));
  const maxSpeed = 0; // not provided by backend
  return {
    totalTrips,
    totalDistance,
    totalDuration,
    totalEarnings,
    averageDistance,
    averageSpeed: Number(averageSpeed.toFixed(1)),
    averageEarnings,
    maxSpeed,
  };
}

function getPrevIso(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

function pickSummary(
  map: Record<string, DailySummary>,
  requestedIso?: string,
): DailySummary | null {
  if (requestedIso && map[requestedIso]) {return map[requestedIso];}
  // fallback: pick the most recent date (max iso)
  const keys = Object.keys(map);
  if (keys.length === 0) {return null;}
  const mostRecent = keys.sort().at(-1)!; // ISO dates sort lexicographically by time
  return map[mostRecent];
}

export const statsApi = {
  // Mantener getRaw por compatibilidad (si aún se usa en otras vistas)
  getRaw: (params?: { platform?: string; startDate?: string; endDate?: string }) => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v) {searchParams.set(k, v);}
      });
    }
    const qs = searchParams.toString();
    return api.get<{ success: true; message: string; data: TripStatistics }>(
      `/api/v1/trips/statistics${qs ? `?${qs}` : ''}`,
    );
  },

  get: (params?: { platform?: string; startDate?: string; endDate?: string }) => {
    return statsApi.getRaw(params);
  },

  // Consume el nuevo backend y transforma al contrato del front
  getExtended: async (isoDate?: string): Promise<ExtendedStatsResponse> => {
    const date = isoDate || new Date().toISOString().slice(0, 10);
    const res = await api.get<BackendStatsResponse>(
      `/api/v1/statistics?date=${encodeURIComponent(date)}`,
    );
    const map = res?.data || {};
    const dataset: DailySummary[] = Object.values(map);
    const summary = pickSummary(map, date);

    // Fallback vacío si backend no trae datos
    const empty: DailySummary = {
      isoDate: date,
      total: 0,
      trips: 0,
      km: 0,
      activeMinutes: 0,
      platforms: {},
      earningsPerTrip: [],
      activityBlocks: new Array(24).fill(0),
    };

    const effectiveSummary = summary ?? empty;
    const prevIso = getPrevIso(effectiveSummary.isoDate);
    const prevDaySummary = map[prevIso];

    const byPlatform = toPlatformsDistribution(effectiveSummary);
    const calendar: CalendarHeatCell[] = dataset
      .map((d) => ({ isoDate: d.isoDate, total: d.total }))
      .sort((a, b) => (a.isoDate < b.isoDate ? -1 : 1));

    const base = aggregateBase(dataset.length > 0 ? dataset : [effectiveSummary], effectiveSummary);

    return {
      success: true as const,
      message: res.message || 'ok',
      data: { summary: effectiveSummary, prevDaySummary, byPlatform, calendar, base },
    };
  },
};
