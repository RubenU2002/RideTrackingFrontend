import { Platform } from '@/core/api/Platform';

/**
 * Map legacy platform names to new Platform enum values
 */
export function mapLegacyPlatform(value: string | null | undefined): Platform {
  if (!value) {return Platform.OTHER;}

  const normalized = value.toUpperCase().trim();

  switch (normalized) {
    case 'UBER':
      return Platform.UBER;
    case 'DIDI':
    case 'DI DI':
      return Platform.DIDI;
    case 'INDRIVE':
    case 'IN DRIVE':
      return Platform.INDRIVE;
    case 'TAXI':
      return Platform.TAXI;
    case 'BEAT':
      return Platform.BEAT;
    case 'CABIFY':
      return Platform.CABIFY;
    case 'PERSONAL':
      return Platform.PERSONAL;
    default:
      return Platform.OTHER;
  }
}

/**
 * Check if a string is a valid Platform value
 */
export function isValidPlatform(value: string): value is Platform {
  return Object.values(Platform).includes(value as Platform);
}

/**
 * Get display name for platform
 */
export function getPlatformDisplayName(platform: Platform): string {
  switch (platform) {
    case Platform.UBER:
      return 'Uber';
    case Platform.DIDI:
      return 'DiDi';
    case Platform.INDRIVE:
      return 'inDrive';
    case Platform.TAXI:
      return 'Taxi';
    case Platform.BEAT:
      return 'Beat';
    case Platform.CABIFY:
      return 'Cabify';
    case Platform.PERSONAL:
      return 'Personal';
    case Platform.OTHER:
      return 'Otro';
    default:
      return 'Desconocido';
  }
}
