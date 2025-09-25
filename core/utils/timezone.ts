import { formatISO } from 'date-fns';
import { format, fromZonedTime, toZonedTime } from 'date-fns-tz';

// Zona horaria de Colombia
export const COLOMBIA_TIMEZONE = 'America/Bogota';

/**
 * Obtiene el timestamp actual en la zona horaria de Colombia
 */
export function nowInColombia(): number {
  const now = new Date();
  const colombiaTime = toZonedTime(now, COLOMBIA_TIMEZONE);
  return colombiaTime.getTime();
}

/**
 * Convierte un timestamp UTC a la zona horaria de Colombia
 */
export function toColombiaTime(timestamp: number): Date {
  return toZonedTime(new Date(timestamp), COLOMBIA_TIMEZONE);
}

/**
 * Convierte una fecha de Colombia a UTC para enviar al servidor
 */
export function toUTCTime(colombiaDate: Date): Date {
  return fromZonedTime(colombiaDate, COLOMBIA_TIMEZONE);
}

/**
 * Obtiene la fecha actual en Colombia como string ISO
 */
export function nowInColombiaISO(): string {
  const now = new Date();
  const colombiaTime = toZonedTime(now, COLOMBIA_TIMEZONE);
  return formatISO(colombiaTime);
}

/**
 * Convierte un timestamp a string ISO en zona horaria de Colombia
 */
export function toColombiaISO(timestamp: number): string {
  const colombiaTime = toColombiaTime(timestamp);
  return formatISO(colombiaTime);
}

/**
 * Obtiene la hora actual en Colombia (0-23)
 */
export function getCurrentHourInColombia(): number {
  const now = new Date();
  const colombiaTime = toZonedTime(now, COLOMBIA_TIMEZONE);
  return colombiaTime.getHours();
}

/**
 * Obtiene la fecha actual en Colombia en formato YYYY-MM-DD
 */
export function getTodayInColombia(): string {
  const now = new Date();
  const colombiaTime = toZonedTime(now, COLOMBIA_TIMEZONE);
  return format(colombiaTime, 'yyyy-MM-dd');
}

/**
 * Formatea una fecha en zona horaria de Colombia
 */
export function formatInColombia(date: Date | number, formatString: string): string {
  const colombiaTime =
    typeof date === 'number' ? toColombiaTime(date) : toZonedTime(date, COLOMBIA_TIMEZONE);
  return format(colombiaTime, formatString, { timeZone: COLOMBIA_TIMEZONE });
}
