import { api } from '@/core/api/client';
import { Platform } from './Platform';

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
  platform: Platform;
  startTime: string;
  endTime: string;
  startLatitude: number;
  startLongitude: number;
  endLatitude?: number;
  endLongitude?: number;
  fare?: number;
  currency?: string;
  notes?: string;
  points: CreateTripPointDto[];
};

export const tripsApi = {
  createTrip: (body: CreateTripDto) =>
    api.post<{ success: boolean; data?: unknown }>(`/api/v1/trips`, body),
};
