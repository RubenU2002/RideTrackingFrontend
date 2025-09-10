import { computeStats, Trip } from '@/core/state/tripStore';

// Mock the tripRepo module
jest.mock('@/core/storage/tripRepo', () => ({
  getActiveTrip: jest.fn(),
}));

function trip(startOffsetMin: number, durationMin: number, amount: number): Trip {
  const start = Date.now() - startOffsetMin * 60000;
  const end = start + durationMin * 60000;
  return {
    id: `t_${start}`,
    start,
    end,
    amount,
    platform: 'Uber',
    points: [],
  };
}

describe('tripStore', () => {
  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2025-09-08T12:00:00.000Z'));
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  describe('computeStats', () => {
    it('computes today stats correctly', () => {
      const trips: Trip[] = [trip(60, 30, 5000), trip(120, 20, 3000)];
      const { today, earningsPerHour } = computeStats(trips);

      expect(today.trips).toBe(2);
      expect(today.earnings).toBe(8000);
      expect(today.drivingMs).toBe(50 * 60000);
      expect(earningsPerHour).toBeGreaterThan(0);
    });

    it('handles empty trips array', () => {
      const { today, last7 } = computeStats([]);

      expect(today.trips).toBe(0);
      expect(today.earnings).toBe(0);
      expect(today.drivingMs).toBe(0);
      expect(last7).toHaveLength(7);
    });

    it('calculates per hour stats correctly', () => {
      const now = new Date();
      const currentHour = now.getHours();

      const tripThisHour = {
        ...trip(60, 30, 5000),
        start: now.getTime(),
      };

      const anotherHour = currentHour === 23 ? 0 : currentHour + 1;
      const tripNextHour = {
        ...trip(60, 30, 3000),
        start: new Date(now.getFullYear(), now.getMonth(), now.getDate(), anotherHour).getTime(),
      };

      const { perHourStarts } = computeStats([tripThisHour, tripNextHour]);

      expect(perHourStarts[currentHour.toString()]).toBe(1);
      expect(perHourStarts[anotherHour.toString()]).toBe(1);

      // Test that an hour with no trips returns 0
      const emptyHour = currentHour === 0 ? 1 : currentHour - 1;
      expect(perHourStarts[emptyHour.toString()] || 0).toBe(0);
    });
  });
});
