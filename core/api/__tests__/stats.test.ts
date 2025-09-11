import { statsApi } from '@/core/api/stats';

import { api } from '@/core/api/client';

// Mock underlying generic api client
jest.mock('@/core/api/client', () => ({
  api: {
    get: jest.fn(),
  },
}));

describe('statsApi', () => {
  beforeEach(() => {
    (api.get as jest.Mock).mockReset();
    (api.get as jest.Mock).mockResolvedValue({
      success: true,
      message: 'ok',
      data: {
        totalTrips: 0,
        totalDistance: 0,
        totalDuration: 0,
        totalEarnings: 0,
        averageDistance: 0,
        averageSpeed: 0,
        averageEarnings: 0,
        maxSpeed: 0,
      },
    });
  });

  it('calls base endpoint without params', async () => {
    await statsApi.get();
    expect(api.get).toHaveBeenCalledWith('/api/v1/trips/statistics');
  });

  it('appends query params when provided', async () => {
    await statsApi.get({ platform: 'UBER', startDate: '2025-09-01', endDate: '2025-09-30' });
    const called = (api.get as jest.Mock).mock.calls[0][0];
    expect(called).toMatch('/api/v1/trips/statistics?');
    expect(called).toContain('platform=UBER');
    expect(called).toContain('startDate=2025-09-01');
    expect(called).toContain('endDate=2025-09-30');
  });
});
