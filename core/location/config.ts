const getNumber = (raw: string | undefined, fallback: number): number => {
  if (raw === undefined || raw === '') {return fallback;}
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
};

const FALLBACK_TIME_INTERVAL_MS = 10000; // 10s
const FALLBACK_DISTANCE_INTERVAL_M = 40; // 40m

export const DEFAULT_TIME_INTERVAL_MS = getNumber(
  process.env.EXPO_PUBLIC_LOCATION_TIME_INTERVAL_MS,
  FALLBACK_TIME_INTERVAL_MS,
);

export const DEFAULT_DISTANCE_INTERVAL_M = getNumber(
  process.env.EXPO_PUBLIC_LOCATION_DISTANCE_INTERVAL_M,
  FALLBACK_DISTANCE_INTERVAL_M,
);
