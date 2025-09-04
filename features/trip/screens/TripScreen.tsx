import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useTripStore, startMockTracking, stopMockTracking } from '@/core/state/tripStore';
import { useThemeColor } from '@/hooks/useThemeColor';
import { FareModal } from '../components/FareModal';
import { HeatmapView } from '@/features/heatmap/components/HeatmapView';
import {
  getHotspotsForHour,
  haversineKm,
  topRecommendations,
} from '@/features/heatmap/recommendation';
import { Chip } from '@/components/ui/Chip';

function formatElapsed(ms: number) {
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  return [h, m, ss].map((v) => String(v).padStart(2, '0')).join(':');
}

export default function TripScreen() {
  const { current, startTrip, endTrip, addPoint } = useTripStore();
  const textColor = useThemeColor({}, 'text');
  const bg = useThemeColor({}, 'background');
  const [elapsed, setElapsed] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [selectedRec, setSelectedRec] = useState<string | null>(null);

  const isActive = !!current;

  useEffect(() => {
    let t: ReturnType<typeof setInterval> | null = null;
    if (current) {
      t = setInterval(() => setElapsed(Date.now() - current.start), 1000);
      startMockTracking(addPoint, { lat: -33.4489, lng: -70.6693 });
    } else {
      setElapsed(0);
      stopMockTracking();
    }
    return () => {
      if (t) {
        clearInterval(t);
      }
      stopMockTracking();
    };
  }, [current, addPoint]);

  const pointsCount = current?.points.length ?? 0;
  const distanceKm = useMemo(() => {
    if (!current || current.points.length < 2) {
      return 0;
    }
    let d = 0;
    for (let i = 1; i < current.points.length; i++) {
      d += haversineKm(current.points[i - 1], current.points[i]);
    }
    return d;
  }, [current]);

  const avgSpeedKmh = useMemo(() => {
    if (!current) {
      return 0;
    }
    const hours = Math.max(1, elapsed) / 3600000;
    return distanceKm / hours;
  }, [elapsed, current, distanceKm]);

  const headerAccent = useMemo(
    () => ({
      backgroundColor: bg,
    }),
    [bg],
  );

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, headerAccent]}>
        <ThemedText type="title">{isActive ? 'Carrera en progreso' : 'Empezar carrera'}</ThemedText>
        <ThemedText type="subtitle" style={styles.subtitle}>
          {isActive ? 'Tracking activo' : 'Listo para iniciar'}
        </ThemedText>
      </View>
      <View style={styles.content}>
        <Card style={styles.card}>
          {isActive ? (
            <>
              <Text style={[styles.timer, { color: textColor }]}>{formatElapsed(elapsed)}</Text>
              <View style={styles.metricsRow}>
                <Metric label="Distancia" value={`${distanceKm.toFixed(2)} km`} />
                <Metric label="Velocidad" value={`${avgSpeedKmh.toFixed(1)} km/h`} />
                <Metric label="Puntos" value={`${pointsCount}`} />
              </View>
              <Button
                title="Terminar"
                variant="danger"
                size="lg"
                onPress={() => setShowModal(true)}
                style={{ marginTop: 12, alignSelf: 'stretch' }}
              />
            </>
          ) : (
            <>
              <ThemedText>Presiona para iniciar el seguimiento de tu carrera</ThemedText>
              <Button
                title="Empezar carrera"
                size="lg"
                onPress={startTrip}
                style={{ marginTop: 16, alignSelf: 'stretch' }}
              />
            </>
          )}
        </Card>

        <Card>
          <ThemedText type="subtitle">Mapa de calor</ThemedText>
          <HeatmapView hotspots={getHotspotsForHour(new Date().getHours())} />
          <View style={{ height: 12 }} />
          <ThemedText type="subtitle">Recomendaciones</ThemedText>
          <View style={styles.chipsRow}>
            {topRecommendations(
              current?.points[current.points.length - 1] ?? { lat: -33.4489, lng: -70.6693 },
              new Date().getHours(),
              4,
            ).map((r) => (
              <Chip
                key={r.name}
                label={`${r.name} · ${r.etaMin}m`}
                selected={selectedRec === r.name}
                onPress={() => setSelectedRec(r.name)}
              />
            ))}
          </View>
        </Card>
      </View>

      <FareModal
        visible={showModal}
        onCancel={() => setShowModal(false)}
        onSave={(p) => {
          endTrip(p);
          setShowModal(false);
        }}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingTop: 24,
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  subtitle: { opacity: 0.7 },
  content: {
    padding: 20,
    gap: 16,
  },
  card: {
    alignItems: 'center',
    gap: 8,
  },
  timer: {
    fontSize: 42,
    fontWeight: '800',
    letterSpacing: 1,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 12,
    alignSelf: 'stretch',
    justifyContent: 'space-between',
  },
  chipsRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginTop: 8 },
});

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flex: 1 }}>
      <ThemedText type="defaultSemiBold">{value}</ThemedText>
      <ThemedText style={{ opacity: 0.7 }}>{label}</ThemedText>
    </View>
  );
}
