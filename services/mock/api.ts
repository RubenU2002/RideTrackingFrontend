// Mock API layer to swap with real backend later

export type TripPayload = {
  id: string;
  start: number;
  end: number;
  amount: number;
  platform: string;
  points: { lat: number; lng: number; ts: number }[];
};

export async function syncTrips(payload: TripPayload[]) {
  // Simulate latency
  await new Promise((r) => setTimeout(r, 400));
  console.warn('[mock] syncTrips', payload.length);
  return { ok: true } as const;
}

export async function createTrip(payload: TripPayload) {
  await new Promise((r) => setTimeout(r, 300));
  console.warn('[mock] createTrip', payload.id);
  return { id: payload.id } as const;
}
