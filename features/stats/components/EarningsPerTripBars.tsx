import { ThemedText } from '@/components/ThemedText';
import { Card } from '@/components/ui/Card';
import { getPlatformColor } from '@/core/theme/platformColors';
import { Box, Pressable } from '@gluestack-ui/themed';
import React, { useState } from 'react';
import { StyleSheet } from 'react-native';

type TripBar = { id: string; order: number; amount: number; platform: string };
export function EarningsPerTripBars({ values }: { values: TripBar[] }) {
  const [active, setActive] = useState<number | null>(null);
  if (!values.length) {return null;}
  const max = Math.max(...values.map((v) => v.amount));
  return (
    <Card style={styles.card}>
      <ThemedText type="subtitle" style={styles.title}>
        Ingresos por Viaje
      </ThemedText>
      <Box style={styles.chart}>
        {values.map((v, idx) => {
          const h = Math.max(18, Math.round((v.amount / max) * 92));
          const bg = getPlatformColor(v.platform);
          const selected = active === idx;
          return (
            <Pressable
              key={v.id}
              onPress={() => setActive(idx === active ? null : idx)}
              style={[
                styles.bar,
                {
                  height: `${h}%`,
                  backgroundColor: bg,
                  opacity: selected ? 1 : 0.85,
                  borderWidth: selected ? 2 : 0,
                  borderColor: selected ? '#fff' : 'transparent',
                },
              ]}
            />
          );
        })}
      </Box>
      {active !== null && (
        <ThemedText style={styles.detail}>
          Viaje {values[active].order} · {values[active].platform}: {money(values[active].amount)}
        </ThemedText>
      )}
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
  card: { gap: 10 },
  title: { fontSize: 16, opacity: 0.85 },
  chart: {
    height: 140,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
    paddingHorizontal: 4,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 14,
    paddingBottom: 12,
    paddingTop: 12,
  },
  bar: { flex: 1, borderRadius: 6 },
  detail: { marginTop: 8, fontSize: 12, opacity: 0.7 },
});
