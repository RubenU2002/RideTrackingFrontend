import {
  COLOMBIA_TIMEZONE,
  formatInColombia,
  getCurrentHourInColombia,
  getTodayInColombia,
  nowInColombia,
  toColombiaISO,
  toColombiaTime,
} from '../timezone';

describe('timezone utilities', () => {
  beforeAll(() => {
    // Mock the current time to a known UTC time for consistent tests
    jest.useFakeTimers();
    // January 15, 2024, 15:00:00 UTC (10:00:00 Colombia time)
    jest.setSystemTime(new Date('2024-01-15T15:00:00Z'));
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  describe('nowInColombia', () => {
    it('should return the current timestamp in Colombia timezone', () => {
      const now = nowInColombia();
      const utcNow = Date.now();

      // The timestamp should be the same point in time
      expect(Math.abs(now - utcNow)).toBeLessThan(1000); // within 1 second
    });
  });

  describe('getCurrentHourInColombia', () => {
    it('should return the current hour in Colombia timezone', () => {
      const hour = getCurrentHourInColombia();
      // UTC 15:00 should be 10:00 in Colombia (UTC-5)
      expect(hour).toBe(10);
    });
  });

  describe('getTodayInColombia', () => {
    it('should return today date in Colombia timezone', () => {
      const today = getTodayInColombia();
      // UTC date 2024-01-15 15:00 should still be 2024-01-15 in Colombia (10:00)
      expect(today).toBe('2024-01-15');
    });
  });

  describe('toColombiaTime', () => {
    it('should convert UTC timestamp to Colombia time', () => {
      const utcTimestamp = new Date('2024-01-15T15:00:00Z').getTime();
      const colombiaTime = toColombiaTime(utcTimestamp);

      expect(colombiaTime.getHours()).toBe(10); // 15:00 UTC = 10:00 Colombia
      expect(colombiaTime.getDate()).toBe(15);
      expect(colombiaTime.getMonth()).toBe(0); // January
    });
  });

  describe('toColombiaISO', () => {
    it('should convert timestamp to ISO string in Colombia timezone', () => {
      const utcTimestamp = new Date('2024-01-15T15:00:00Z').getTime();
      const isoString = toColombiaISO(utcTimestamp);

      // Should show Colombia time (10:00) in the ISO string
      expect(isoString).toMatch(/2024-01-15T10:00:00/);
    });
  });

  describe('formatInColombia', () => {
    it('should format dates in Colombia timezone', () => {
      const utcTimestamp = new Date('2024-01-15T15:00:00Z').getTime();
      const formatted = formatInColombia(utcTimestamp, 'yyyy-MM-dd HH:mm');

      expect(formatted).toBe('2024-01-15 10:00');
    });
  });

  describe('timezone constant', () => {
    it('should have correct Colombia timezone', () => {
      expect(COLOMBIA_TIMEZONE).toBe('America/Bogota');
    });
  });
});
