import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Card } from '@/components/ui/Card';
import { statsApi, TripStatistics } from '@/core/api/stats';
import { createLogger } from '@/core/utils/logger';
import React, { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
// (Chart imports removed — placeholder visualization eliminated)

const log = createLogger('StatsScreen');

type UiStat = { label: string; value: string; accent?: string };

function StatCard({ label, value, accent }: UiStat) {
  return (
    <Card style={[styles.stat, accent ? { borderColor: accent, borderWidth: 1 } : null]}>
      <ThemedText type="subtitle" style={styles.statValue}>
        {value}
      </ThemedText>
      <ThemedText style={styles.statLabel}>{label}</ThemedText>
    </Card>
  );
}

export default function StatsScreen() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<TripStatistics | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      const res = await statsApi.get();
      setStats(res.data);
    } catch (e: any) {
      log.error('Failed to load stats', e);
      setError(e?.message || 'Error cargando estadísticas');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchStats();
    setRefreshing(false);
  }, [fetchStats]);

  const cards: UiStat[] = stats
    ? [
        { label: 'Viajes', value: stats.totalTrips.toString(), accent: '#6366F1' },
        { label: 'Distancia', value: formatDistance(stats.totalDistance), accent: '#EC4899' },
        { label: 'Duración', value: formatDuration(stats.totalDuration), accent: '#10B981' },
        { label: 'Ingresos', value: formatCurrency(stats.totalEarnings), accent: '#F59E0B' },
        { label: 'Prom. Distancia', value: formatDistance(stats.averageDistance) },
        { label: 'Vel. Media', value: `${stats.averageSpeed.toFixed(1)} km/h` },
        { label: 'Máx Vel.', value: `${stats.maxSpeed.toFixed(1)} km/h` },
        { label: 'Prom. Ingresos', value: formatCurrency(stats.averageEarnings) },
      ]
    : [];

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.header}>
          <ThemedText type="title" style={styles.title}>
            Panel de Rendimiento
          </ThemedText>
          <ThemedText style={styles.subtitle}>Resumen detallado de tu actividad</ThemedText>
        </View>

        {loading && <ThemedText style={styles.loading}>Cargando…</ThemedText>}
        {error && !loading && <ThemedText style={styles.error}>{error}</ThemedText>}

        {!loading && !error && stats && (
          <>
            <View style={styles.grid}>
              {cards.map((c) => (
                <StatCard key={c.label} {...c} />
              ))}
            </View>

            <ThemedText style={styles.note}>
              Próximamente: gráficos históricos cuando el backend entregue series diarias /
              horarias.
            </ThemedText>
          </>
        )}
      </ScrollView>
    </ThemedView>
  );
}

function formatDistance(meters: number): string {
  if (!isFinite(meters)) {return '0 km';}
  const km = meters / 1000;
  return `${km.toFixed(km < 10 ? 2 : 1)} km`;
}

function formatDuration(secOrMs: number): string {
  // Heuristic: if value is very large assume ms. If < 100000 assume seconds.
  const seconds = secOrMs > 100000 ? Math.round(secOrMs / 1000) : Math.round(secOrMs);
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
}

function formatCurrency(value: number): string {
  if (!isFinite(value)) {return '$0';}
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(value);
}

// Removed dummy distribution builder.

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingBottom: 48 },
  header: { paddingTop: 32, paddingHorizontal: 20, paddingBottom: 8 },
  title: { fontSize: 28, fontWeight: '600' },
  subtitle: { opacity: 0.7, marginTop: 4 },
  loading: { padding: 20, opacity: 0.7 },
  error: { padding: 20, color: '#ef4444' },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 14,
    columnGap: 14,
    paddingHorizontal: 20,
    marginTop: 8,
  },
  stat: {
    width: '47%',
    padding: 16,
    borderRadius: 16,
  },
  statValue: { marginBottom: 4 },
  statLabel: { opacity: 0.7, fontSize: 12, letterSpacing: 0.3 },
  note: { marginTop: 32, marginHorizontal: 20, opacity: 0.6, fontSize: 12 },
});
