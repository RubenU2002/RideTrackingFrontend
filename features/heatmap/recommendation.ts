import { defaultHotspots, mockHotspotsByHour, type Hotspot } from './mock';

export function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  return R * c;
}

export function getHotspotsForHour(hour: number): Hotspot[] {
  return mockHotspotsByHour[hour] ?? defaultHotspots;
}

export function quickRecommendation(origin: { lat: number; lng: number }, hour: number) {
  const hs = getHotspotsForHour(hour);
  // Assume 30 km/h average city speed => 0.5 km/min; constraint 15 min => 7.5 km
  const maxKm = 7.5;
  const candidates = hs
    .map((h) => ({
      hotspot: h,
      distKm: haversineKm(origin, h),
    }))
    .filter((c) => c.distKm <= maxKm)
    .sort((a, b) => b.hotspot.intensity - a.hotspot.intensity || a.distKm - b.distKm);

  const best = candidates[0] ?? { hotspot: hs[0], distKm: haversineKm(origin, hs[0]) };
  const etaMin = Math.round((best.distKm / 0.5));
  return {
    name: best.hotspot.name ?? 'Zona sugerida',
    lat: best.hotspot.lat,
    lng: best.hotspot.lng,
    etaMin,
    distKm: best.distKm,
  };
}

export function topRecommendations(origin: { lat: number; lng: number }, hour: number, max: number = 3) {
  const hs = getHotspotsForHour(hour);
  const maxKm = 7.5;
  const ranked = hs
    .map((h) => ({ hotspot: h, distKm: haversineKm(origin, h) }))
    .filter((c) => c.distKm <= maxKm)
    .sort((a, b) => b.hotspot.intensity - a.hotspot.intensity || a.distKm - b.distKm)
    .slice(0, max)
    .map((c) => ({
      name: c.hotspot.name ?? 'Zona sugerida',
      distKm: c.distKm,
      etaMin: Math.round(c.distKm / 0.5),
    }));
  return ranked;
}
