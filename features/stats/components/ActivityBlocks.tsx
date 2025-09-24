import { ThemedText } from '@/components/ThemedText';
import { Card } from '@/components/ui/Card';
import { Box, Pressable } from '@gluestack-ui/themed';
import React, { useState } from 'react';
import { StyleSheet } from 'react-native';

export function ActivityBlocks({ values }: { values: number[] }) {
  const [focus, setFocus] = useState<number | null>(null);
  return (
    <Card style={styles.card}>
      <ThemedText type="subtitle" style={styles.title}>
        Actividad por Hora
      </ThemedText>
      <Box flexDirection="row" alignItems="flex-end" style={styles.line}>
        {values.map((v, i) => {
          const color = v > 70 ? '#22c55e' : v > 40 ? '#7c5cff' : v > 10 ? '#4f7afe' : '#1b2542';
          const sel = i === focus;
          return (
            <Pressable
              key={i}
              onPress={() => setFocus(sel ? null : i)}
              style={[
                styles.block,
                {
                  flex: 1,
                  height: `${Math.max(8, v)}%`,
                  backgroundColor: color,
                  opacity: sel ? 1 : 0.8,
                  borderWidth: sel ? 1 : 0,
                  borderColor: sel ? '#fff' : 'transparent',
                },
              ]}
            />
          );
        })}
      </Box>
      <Box flexDirection="row" justifyContent="space-between" mt={4}>
        <ThemedText style={styles.axisLabel}>12 AM</ThemedText>
        <ThemedText style={styles.axisLabel}>6 AM</ThemedText>
        <ThemedText style={styles.axisLabel}>12 PM</ThemedText>
        <ThemedText style={styles.axisLabel}>6 PM</ThemedText>
        <ThemedText style={styles.axisLabel}>12 AM</ThemedText>
      </Box>
      <ThemedText style={styles.label}>
        {focus === null
          ? 'Toque una barra para detalle'
          : `${formatHour(focus)}: ${values[focus]}% actividad`}
      </ThemedText>
    </Card>
  );
}

function formatHour(h: number) {
  const hour12 = ((h + 11) % 12) + 1;
  const ampm = h < 12 ? 'AM' : 'PM';
  return `${hour12} ${ampm}`;
}

const styles = StyleSheet.create({
  card: { gap: 10 },
  title: { fontSize: 16, opacity: 0.85 },
  line: { height: 130, gap: 2, flex: 1 },
  block: { borderRadius: 4, marginHorizontal: 1 },
  label: { fontSize: 12, opacity: 0.6, marginTop: 8 },
  axisLabel: { fontSize: 10, opacity: 0.45 },
});
