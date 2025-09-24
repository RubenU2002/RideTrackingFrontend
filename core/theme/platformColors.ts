import { Platform } from '@/core/api/Platform';

export const PLATFORM_COLORS: Record<Platform, string> = {
  [Platform.UBER]: '#4f7afe',
  [Platform.DIDI]: '#7c5cff',
  [Platform.INDRIVE]: '#10b981',
  [Platform.TAXI]: '#22c55e',
  [Platform.BEAT]: '#ec4899',
  [Platform.CABIFY]: '#f59e0b',
  [Platform.PERSONAL]: '#94a3b8',
  [Platform.OTHER]: '#64748b',
};

export function getPlatformColor(p: string): string {
  const key = p.toUpperCase() as Platform;
  return (PLATFORM_COLORS[key] as string) || '#94a3b8';
}

export const PLATFORM_ORDER: Platform[] = [
  Platform.UBER,
  Platform.DIDI,
  Platform.INDRIVE,
  Platform.TAXI,
  Platform.BEAT,
  Platform.CABIFY,
  Platform.PERSONAL,
  Platform.OTHER,
];
