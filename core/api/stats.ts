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

export type StatsResponse = {
  success: true;
  message: string;
  data: TripStatistics;
};

export const statsApi = {
  get: (params?: { platform?: string; startDate?: string; endDate?: string }) => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v) {searchParams.set(k, v);}
      });
    }
    const qs = searchParams.toString();
    return api.get<StatsResponse>(`/api/v1/trips/statistics${qs ? `?${qs}` : ''}`);
  },
};
