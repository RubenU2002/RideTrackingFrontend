import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { Card } from '@/components/ui/Card';
import { computeStats, useTripStore } from '@/core/state/tripStore';

function msToHms(ms: number) {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return `${h}h ${m}m`;
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card style={styles.stat}>
      <ThemedText type="subtitle">{value}</ThemedText>
      <ThemedText style={{ opacity: 0.7 }}>{label}</ThemedText>
    </Card>
  );
}

export default function StatsScreen() {
  const { trips } = useTripStore();
  const { today, earningsPerHour } = computeStats(trips);

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}> 
        <ThemedText type="title">Estadísticas</ThemedText>
        <ThemedText style={{ opacity: 0.7 }}>Tu rendimiento personal</ThemedText>
      </View>

      <View style={styles.grid}>
        <StatCard label="Viajes hoy" value={`${today.trips}`} />
        <StatCard label="Tiempo en carrera" value={msToHms(today.drivingMs)} />
        <StatCard label="Ingresos hoy" value={`$${today.earnings.toFixed(0)}`} />
        <StatCard label="Ingresos/hora" value={`$${earningsPerHour.toFixed(0)}`} />
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 24, paddingHorizontal: 20, paddingBottom: 8 },
  grid: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 12,
  },
  stat: {},
});

