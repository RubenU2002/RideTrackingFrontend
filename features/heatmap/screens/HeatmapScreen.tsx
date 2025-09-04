import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { Card } from '@/components/ui/Card';
import { HeatmapView } from '../components/HeatmapView';
import { defaultHotspots, mockHotspotsByHour } from '../mock';
import { Button } from '@/components/ui/Button';
import { quickRecommendation } from '../recommendation';
import { useTripStore } from '@/core/state/tripStore';

export default function HeatmapScreen() {
  const hour = new Date().getHours();
  const hotspots = useMemo(() => mockHotspotsByHour[hour] ?? defaultHotspots, [hour]);
  const { current, trips } = useTripStore();
  const origin = current?.points[current.points.length - 1] ?? trips[trips.length - 1]?.points?.[0] ?? {
    lat: -33.4489,
    lng: -70.6693,
  };

  const [rec, setRec] = useState<null | { name: string; etaMin: number; distKm: number }>(null);

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}> 
        <ThemedText type="title">Mapa de calor</ThemedText>
        <ThemedText style={{ opacity: 0.7 }}>Tus zonas calientes</ThemedText>
      </View>

      <View style={styles.content}>
        <HeatmapView hotspots={hotspots} />
        <Card>
          <ThemedText type="subtitle">¿A dónde voy?</ThemedText>
          <ThemedText style={{ marginBottom: 8 }}>Recomendación rápida según tu histórico y hora actual.</ThemedText>
          <Button
            title="Obtener recomendación"
            onPress={() => setRec(quickRecommendation(origin, hour))}
          />
          {rec && (
            <View style={{ marginTop: 12 }}>
              <ThemedText type="defaultSemiBold">{rec.name}</ThemedText>
              <ThemedText>~{rec.etaMin} min · {rec.distKm.toFixed(1)} km</ThemedText>
            </View>
          )}
        </Card>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 24, paddingHorizontal: 20, paddingBottom: 8 },
  content: { padding: 20, gap: 16 },
});

