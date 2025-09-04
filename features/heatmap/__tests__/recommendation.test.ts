import { haversineKm, quickRecommendation } from '@/features/heatmap/recommendation';

describe('haversineKm', () => {
  it('returns ~0 for same point', () => {
    const a = { lat: 0, lng: 0 };
    expect(haversineKm(a, a)).toBeCloseTo(0, 5);
  });

  it('computes distance roughly between two points', () => {
    const santiago = { lat: -33.4489, lng: -70.6693 };
    const valparaiso = { lat: -33.0472, lng: -71.6127 };
    const d = haversineKm(santiago, valparaiso);
    expect(d).toBeGreaterThan(90);
    expect(d).toBeLessThan(150);
  });
});

describe('quickRecommendation', () => {
  it('returns a hotspot result with ETA and distance', () => {
    const origin = { lat: -33.4489, lng: -70.6693 };
    const hour = new Date().getHours();
    const rec = quickRecommendation(origin, hour);
    expect(rec.name).toBeTruthy();
    expect(rec.etaMin).toBeGreaterThanOrEqual(0);
    expect(rec.distKm).toBeGreaterThanOrEqual(0);
  });
});
