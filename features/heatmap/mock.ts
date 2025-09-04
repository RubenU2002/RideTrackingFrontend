export type Hotspot = { lat: number; lng: number; intensity: number; name?: string };

// Mock hotspots per hour (0..23)
export const mockHotspotsByHour: Record<number, Hotspot[]> = {
  8: [
    { lat: -33.45, lng: -70.67, intensity: 1.0, name: 'Centro' },
    { lat: -33.456, lng: -70.65, intensity: 0.7, name: 'Terminal' },
  ],
  18: [
    { lat: -33.44, lng: -70.66, intensity: 1.0, name: 'Mall' },
    { lat: -33.47, lng: -70.68, intensity: 0.8, name: 'Estadio' },
  ],
};

// Default hour fallback
export const defaultHotspots: Hotspot[] = [
  { lat: -33.4489, lng: -70.6693, intensity: 0.9, name: 'Centro' },
  { lat: -33.44, lng: -70.65, intensity: 0.6, name: 'Parque' },
  { lat: -33.46, lng: -70.68, intensity: 0.5, name: 'Terminal' },
];

