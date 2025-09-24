import { ThemedText } from '@/components/ThemedText';
import { Card } from '@/components/ui/Card';
import type { DailySummary } from '@/core/api/stats';
import { Box } from '@gluestack-ui/themed';
import React from 'react';
import { StyleSheet } from 'react-native';

export function DailySummaryCards({
  summary,
  prev,
}: {
  summary: DailySummary;
  prev?: DailySummary;
}) {
  const diff = (curr: number, prevVal?: number) => {
    if (prevVal === null || prevVal === undefined || prevVal === 0) {return null;}
    const delta = ((curr - prevVal) / prevVal) * 100;
    return {
      raw: delta,
      label: `${delta > 0 ? '▲' : '▼'} ${Math.abs(delta).toFixed(1)}%`,
      up: delta >= 0,
    };
  };
  const stats = [
    { key: 'total', label: 'Ingresos', value: summary.total, fmt: money },
    { key: 'trips', label: 'Viajes', value: summary.trips, fmt: (n: number) => n.toString() },
    {
      key: 'activeMinutes',
      label: 'Tiempo Activo',
      value: summary.activeMinutes,
      fmt: (n: number) => `${n}m`,
    },
    { key: 'km', label: 'Distancia', value: summary.km, fmt: (n: number) => `${n} km` },
  ];
  return (
    <Card style={styles.cardMin}>
      <Box flexDirection="row" flexWrap="wrap" style={styles.grid}>
        {stats.map((s) => {
          const d = diff(s.value, prev?.[s.key as keyof DailySummary] as any);
          return (
            <Box key={s.key} style={styles.item}>
              <Box flexDirection="row" alignItems="flex-end" gap={6}>
                <ThemedText style={styles.value}>{s.fmt(s.value)}</ThemedText>
                {d && (
                  <ThemedText style={[styles.delta, { color: d.up ? '#16a34a' : '#dc2626' }]}>
                    {d.label}
                  </ThemedText>
                )}
              </Box>
              <ThemedText style={styles.label}>{s.label}</ThemedText>
              {prev && (
                <ThemedText style={styles.prev}>
                  {s.fmt(prev[s.key as keyof DailySummary] as any)}
                </ThemedText>
              )}
            </Box>
          );
        })}
      </Box>
    </Card>
  );
}

function money(n: number) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(n);
}

const styles = StyleSheet.create({
  cardMin: { paddingVertical: 10, gap: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 8, columnGap: 10 },
  item: { width: '47%', padding: 8, borderRadius: 14, backgroundColor: 'rgba(148,163,184,0.08)' },
  value: { fontSize: 18, fontWeight: '700' },
  label: {
    fontSize: 10,
    opacity: 0.55,
    marginTop: 2,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  delta: { fontSize: 11, fontWeight: '600' },
  prev: { fontSize: 9, opacity: 0.4, marginTop: 2 },
});
