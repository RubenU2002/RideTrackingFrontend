import { computeStats, Trip } from '@/core/state/tripStore';

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

describe('computeStats', () => {
  it('computes today stats correctly', () => {
    const trips: Trip[] = [trip(60, 30, 5000), trip(120, 20, 3000)];
    const { today, earningsPerHour } = computeStats(trips);

    expect(today.trips).toBe(2);
    expect(today.earnings).toBe(8000);
    expect(today.drivingMs).toBe(50 * 60000);
    expect(earningsPerHour).toBeGreaterThan(0);
  });
});
