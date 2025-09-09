import { api } from '@/core/api/client';

export type CreateTripPointDto = {
  latitude: number;
  longitude: number;
  timestamp: string; // ISO
  speed?: number;
  heading?: number;
  altitude?: number;
  accuracy?: number;
};

export type CreateTripDto = {
  userId: string;
  startLatitude: number;
  startLongitude: number;
  endLatitude?: number;
  endLongitude?: number;
  distance?: number;
  fare?: number;
  status?: 'STARTED' | 'PAUSED' | 'COMPLETED' | 'CANCELLED';
  notes?: string;
  points: CreateTripPointDto[];
};

export const tripsApi = {
  createTrip: (body: CreateTripDto) =>
    api.post<{ success: boolean; data?: unknown }>(`/trips`, body),
};
