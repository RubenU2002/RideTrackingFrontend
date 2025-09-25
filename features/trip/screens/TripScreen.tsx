import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { useAuth } from '@/core/auth/AuthContext';
import { startTripTracking, stopTripTracking, cancelTripTracking } from '@/core/location/tracking';
import { useTripStore } from '@/core/state/tripStore';
import { useTripStats } from '@/core/state/useTripStats';
import { getCurrentHourInColombia, nowInColombia } from '@/core/utils/timezone';
import { HeatmapView } from '@/features/heatmap/components/HeatmapView';
import { getHotspotsForHour, topRecommendations } from '@/features/heatmap/recommendation';
import { useThemeColor } from '@/hooks/useThemeColor';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { FareModal } from '../components/FareModal';

function formatElapsed(ms: number) {
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  return [h, m, ss].map((v) => String(v).padStart(2, '0')).join(':');
}

export default function TripScreen() {
  const { isActiveTrip, startTrip, endTrip, cancelTrip, checkActiveTrip } = useTripStore();
  const { currentStats, refreshStats } = useTripStats();
  const { user } = useAuth();
  const textColor = useThemeColor({}, 'text');
  const bg = useThemeColor({}, 'background');
  const [elapsed, setElapsed] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [selectedRec, setSelectedRec] = useState<string | null>(null);

  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (isActiveTrip && currentStats?.startTime) {
      startTimeRef.current = currentStats.startTime;

      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }

      const updateElapsed = () => {
        if (startTimeRef.current) {
          setElapsed(nowInColombia() - startTimeRef.current);
        }
      };

      updateElapsed();
      timerIntervalRef.current = setInterval(updateElapsed, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      startTimeRef.current = null;
      setElapsed(0);
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [isActiveTrip, currentStats?.startTime]);

  const pointsCount = currentStats?.pointsCount ?? 0;
  const distanceKm = currentStats?.distanceKm ?? 0;

  const avgSpeedKmh = useMemo(() => {
    if (!isActiveTrip || !currentStats || elapsed === 0) {
      return 0;
    }
    const hours = elapsed / 3600000;
    return distanceKm / hours;
  }, [elapsed, isActiveTrip, currentStats, distanceKm]);

  const headerAccent = useMemo(
    () => ({
      backgroundColor: bg,
    }),
    [bg],
  );

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, headerAccent]}>
        <ThemedText type="title">
          {isActiveTrip ? 'Carrera en progreso' : 'Empezar carrera'}
        </ThemedText>
        <ThemedText type="subtitle" style={styles.subtitle}>
          {isActiveTrip ? 'Tracking activo' : 'Listo para iniciar'}
        </ThemedText>
      </View>
      <View style={styles.content}>
        <Card style={styles.card}>
          {isActiveTrip ? (
            <>
              <Text style={[styles.timer, { color: textColor }]}>{formatElapsed(elapsed)}</Text>
              <View style={styles.metricsRow}>
                <Metric label="Distancia" value={`${distanceKm.toFixed(2)} km`} />
                <Metric
                  label="Velocidad"
                  value={`${(currentStats?.currentSpeedKmh ?? avgSpeedKmh).toFixed(1)} km/h`}
                />
                <Metric label="Puntos" value={`${pointsCount}`} />
              </View>
              <View style={styles.actionsRow}>
                <Button
                  title="Terminar"
                  variant="danger"
                  size="lg"
                  onPress={() => setShowModal(true)}
                  style={{ alignSelf: 'stretch', flex: 1 }}
                />
                <Button
                  title="Cancelar"
                  variant="secondary"
                  size="lg"
                  onPress={async () => {
                    try {
                      await cancelTripTracking();
                      cancelTrip();
                      await checkActiveTrip();
                      await refreshStats();
                    } catch (e) {
                      console.warn('No se pudo cancelar el viaje', e);
                    }
                  }}
                  style={{ alignSelf: 'stretch', flex: 1 }}
                />
              </View>
            </>
          ) : (
            <>
              <ThemedText>Presiona para iniciar el seguimiento de tu carrera</ThemedText>
              <Button
                title="Empezar carrera"
                size="lg"
                onPress={async () => {
                  if (!user) {
                    return;
                  }
                  try {
                    await startTripTracking({ userId: user.id });
                    startTrip();
                    await checkActiveTrip();
                    await refreshStats();
                  } catch (e) {
                    console.warn('No se pudo iniciar tracking', e);
                  }
                }}
                style={{ marginTop: 16, alignSelf: 'stretch' }}
              />
            </>
          )}
        </Card>

        <Card>
          <ThemedText type="subtitle">Mapa de calor</ThemedText>
          <HeatmapView hotspots={getHotspotsForHour(getCurrentHourInColombia())} />
          <View style={{ height: 12 }} />
          <ThemedText type="subtitle">Recomendaciones</ThemedText>
          <View style={styles.chipsRow}>
            {topRecommendations(
              currentStats?.lastPoint ?? { lat: -33.4489, lng: -70.6693 },
              getCurrentHourInColombia(),
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
        onSave={async (p) => {
          endTrip(p);
          setShowModal(false);
          try {
            await stopTripTracking({ amount: p.amount, platform: p.platform });
            await checkActiveTrip();
            await refreshStats();
          } catch (e) {
            console.warn('No se pudo finalizar tracking', e);
          }
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
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    alignSelf: 'stretch',
    marginTop: 12,
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
