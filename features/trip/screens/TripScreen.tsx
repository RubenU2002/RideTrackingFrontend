import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { useAuth } from '@/core/auth/AuthContext';
import { cancelTripTracking, startTripTracking, stopTripTracking } from '@/core/location/tracking';
import { useTripStore } from '@/core/state/tripStore';
import { useTripStats } from '@/core/state/useTripStats';
import { getTripWithPoints } from '@/core/storage/tripRepo';
import { getCurrentHourInColombia, nowInColombia } from '@/core/utils/timezone';
import { HeatmapView } from '@/features/heatmap/components/HeatmapView';
import { getHotspotsForHour, topRecommendations } from '@/features/heatmap/recommendation';
import { TripMapView } from '@/features/trip/components/TripMapView';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Ionicons } from '@expo/vector-icons';
import { ButtonText, Button as GSButton } from '@gluestack-ui/themed';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { FareModal } from '../components/FareModal';

function formatElapsed(ms: number) {
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  return [h, m, ss].map((v) => String(v).padStart(2, '0')).join(':');
}

export default function TripScreen() {
  const tabBarHeight = useBottomTabBarHeight();
  const { isActiveTrip, startTrip, endTrip, cancelTrip, checkActiveTrip } = useTripStore();
  const { currentStats, refreshStats } = useTripStats();
  const { user } = useAuth();
  const textColor = useThemeColor({}, 'text');
  const bg = useThemeColor({}, 'background');
  const [elapsed, setElapsed] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [selectedRec, setSelectedRec] = useState<string | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [route, setRoute] = useState<[number, number][]>([]); // [lng, lat]
  const [startCoord, setStartCoord] = useState<[number, number] | null>(null);
  const [currentCoord, setCurrentCoord] = useState<[number, number] | null>(null);

  // Animaciones suaves
  const mapProg = useSharedValue(0);
  const detailsProg = useSharedValue(0);

  useEffect(() => {
    mapProg.value = withTiming(isActiveTrip ? 1 : 0, {
      duration: 420,
      easing: Easing.out(Easing.cubic),
    });
  }, [isActiveTrip, mapProg]);

  useEffect(() => {
    detailsProg.value = withTiming(detailsOpen ? 1 : 0, {
      duration: 320,
      easing: Easing.out(Easing.cubic),
    });
  }, [detailsOpen, detailsProg]);

  const mapWrapAnimated = useAnimatedStyle(() => ({
    transform: [
      { scale: interpolate(mapProg.value, [0, 1], [0.96, 1], Extrapolation.CLAMP) },
      { translateY: interpolate(mapProg.value, [0, 1], [24, 0], Extrapolation.CLAMP) },
    ],
    opacity: interpolate(mapProg.value, [0, 1], [0, 1], Extrapolation.CLAMP),
    borderRadius: interpolate(mapProg.value, [0, 1], [16, 0], Extrapolation.CLAMP),
    overflow: 'hidden',
  }));

  const fabAnimated = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(detailsProg.value, [0, 1], [0, 30], Extrapolation.CLAMP) },
      { scale: interpolate(detailsProg.value, [0, 1], [1, 0.92], Extrapolation.CLAMP) },
    ],
    opacity: interpolate(detailsProg.value, [0, 1], [1, 0], Extrapolation.CLAMP),
  }));

  const sheetAnimated = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(detailsProg.value, [0, 1], [40, 0], Extrapolation.CLAMP) },
    ],
    opacity: interpolate(detailsProg.value, [0, 1], [0, 1], Extrapolation.CLAMP),
  }));

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

  useEffect(() => {
    if (!isActiveTrip) {
      setDetailsOpen(false);
      setRoute([]);
      setStartCoord(null);
      setCurrentCoord(null);
    }
  }, [isActiveTrip]);

  // Refresh route path points whenever the count updates (during active trip)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!isActiveTrip || !currentStats?.id) {
        return;
      }
      try {
        const res = await getTripWithPoints(currentStats.id);
        if (!res || cancelled) {
          return;
        }
        const coords = res.points.map((p) => [p.lng, p.lat] as [number, number]);
        setRoute(coords);
        setStartCoord(coords.length > 0 ? coords[0] : null);
        setCurrentCoord(coords.length > 0 ? coords[coords.length - 1] : null);
      } catch (e) {
        console.warn('No se pudo cargar puntos de la ruta', e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isActiveTrip, currentStats?.id, currentStats?.pointsCount]);

  const ActiveTripDetails = (
    <Card style={[styles.card, { paddingBottom: 8 }]}>
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
        <View style={{ flex: 1 }}>
          <Button title="Terminar" variant="danger" size="lg" onPress={() => setShowModal(true)} />
        </View>
        <View style={{ flex: 1 }}>
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
          />
        </View>
      </View>
    </Card>
  );

  return (
    <ThemedView style={styles.container}>
      {!isActiveTrip && (
        <>
          <View style={[styles.header, headerAccent]}>
            <ThemedText type="title">Empezar carrera</ThemedText>
            <ThemedText type="subtitle" style={styles.subtitle}>
              Listo para iniciar
            </ThemedText>
          </View>
          <ScrollView
            contentContainerStyle={[styles.content, { paddingBottom: tabBarHeight + 16 }]}
            showsVerticalScrollIndicator={false}
          >
            <Card style={styles.card}>
              <View style={styles.startHero}>
                <View style={styles.startIconWrap}>
                  <Ionicons name="navigate" size={28} color="#0a84ff" />
                </View>
                <ThemedText type="title">Listo para empezar</ThemedText>
                <ThemedText style={{ opacity: 0.7, textAlign: 'center' }}>
                  Presiona el botón cuando estés listo para iniciar tu carrera.
                </ThemedText>
                <GSButton
                  size="lg"
                  variant="solid"
                  action="primary"
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
                  accessibilityLabel="Empezar carrera"
                  sx={{ alignSelf: 'stretch', mt: 16 }}
                >
                  <Ionicons name="play" size={18} color="#fff" />
                  <ButtonText style={{ marginLeft: 8 }}>Empezar carrera</ButtonText>
                </GSButton>
              </View>
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
          </ScrollView>
        </>
      )}

      {isActiveTrip && (
        <Animated.View style={[{ flex: 1 }, mapWrapAnimated]}>
          <TripMapView path={route} start={startCoord} current={currentCoord} />

          {!detailsOpen && (
            <Animated.View style={[styles.fab, { bottom: tabBarHeight + 12 }, fabAnimated]}>
              <Pressable
                style={{ flexDirection: 'row', alignItems: 'center' }}
                onPress={() => setDetailsOpen(true)}
                accessibilityLabel="Mostrar detalles de la carrera"
              >
                <Ionicons name="chevron-up" size={22} color="#fff" />
                <Text style={{ color: '#fff', fontWeight: '600', marginLeft: 6 }}>Detalles</Text>
              </Pressable>
            </Animated.View>
          )}

          {detailsOpen && (
            <Animated.View
              style={[styles.bottomSheet, { bottom: tabBarHeight + 4 }, sheetAnimated]}
            >
              <Pressable
                style={styles.sheetHandle}
                onPress={() => setDetailsOpen(false)}
                accessibilityLabel="Ocultar detalles"
              >
                <Ionicons name="chevron-down" size={20} color="#6b7280" />
              </Pressable>
              {ActiveTripDetails}
            </Animated.View>
          )}
        </Animated.View>
      )}

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
  startHero: {
    alignSelf: 'stretch',
    alignItems: 'center',
    gap: 10,
  },
  startIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(10,132,255,0.12)',
    marginBottom: 4,
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
  fab: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 24,
    height: 44,
    backgroundColor: '#2D7FF9',
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  bottomSheet: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 8,
    paddingBottom: 8,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 44,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
});

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flex: 1 }}>
      <ThemedText type="defaultSemiBold">{value}</ThemedText>
      <ThemedText style={{ opacity: 0.7 }}>{label}</ThemedText>
    </View>
  );
}
