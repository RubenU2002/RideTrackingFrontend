import { ThemedText } from '@/components/ThemedText';
import { Card } from '@/components/ui/Card';
import { Box, Pressable } from '@gluestack-ui/themed';
import React from 'react';
import { StyleSheet } from 'react-native';

export type DateSelectorProps = {
  isoDate: string;
  label: string;
  onPrev: () => void;
  onNext: () => void;
  onOpenCalendar: () => void;
  disableNext?: boolean;
};

export function DateSelector({
  isoDate,
  label,
  onPrev,
  onNext,
  onOpenCalendar,
  disableNext,
}: DateSelectorProps) {
  const d = new Date(isoDate + 'T00:00:00');
  const dayNum = d.getDate();
  const monthNames = [
    'ENE',
    'FEB',
    'MAR',
    'ABR',
    'MAY',
    'JUN',
    'JUL',
    'AGO',
    'SEP',
    'OCT',
    'NOV',
    'DIC',
  ];
  const month = monthNames[d.getMonth()];
  return (
    <Card style={styles.cardMin}>
      <Pressable
        accessibilityLabel="Abrir calendario"
        onPress={onOpenCalendar}
        style={styles.inlineDate}
      >
        <ThemedText style={styles.dayMin}>{dayNum}</ThemedText>
        <ThemedText style={styles.monthMin}>{month}</ThemedText>
      </Pressable>
      <Box flexDirection="row" alignItems="center" gap={4}>
        <Pressable accessibilityLabel="Anterior" style={styles.navBtnSm} onPress={onPrev}>
          <ThemedText style={styles.navTxtSm}>‹</ThemedText>
        </Pressable>
        <Pressable
          accessibilityLabel="Siguiente"
          disabled={disableNext}
          style={[styles.navBtnSm, disableNext && styles.btnDisabled]}
          onPress={onNext}
        >
          <ThemedText style={styles.navTxtSm}>›</ThemedText>
        </Pressable>
      </Box>
      <ThemedText numberOfLines={1} style={styles.labelMin}>
        {label}
      </ThemedText>
    </Card>
  );
}

const styles = StyleSheet.create({
  cardMin: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 14,
    gap: 12,
  },
  inlineDate: { flexDirection: 'row', alignItems: 'flex-end', gap: 4 },
  dayMin: { fontSize: 26, fontWeight: '700', lineHeight: 28 },
  monthMin: { fontSize: 12, fontWeight: '700', opacity: 0.7, marginBottom: 2 },
  navBtnSm: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(148,163,184,0.15)',
    borderRadius: 10,
  },
  navTxtSm: { fontSize: 16, fontWeight: '700' },
  btnDisabled: { opacity: 0.3 },
  labelMin: { flex: 1, textAlign: 'right', fontSize: 11, opacity: 0.6 },
});
