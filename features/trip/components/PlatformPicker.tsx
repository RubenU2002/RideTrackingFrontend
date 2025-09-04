import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Chip } from '@/components/ui/Chip';
import type { PlatformName } from '@/core/state/tripStore';

const OPTIONS: PlatformName[] = ['Uber', 'DiDi', 'inDrive', 'Taxi'];

export function PlatformPicker({ value, onChange }: { value: PlatformName; onChange: (v: PlatformName) => void }) {
  return (
    <View style={styles.row}>
      {OPTIONS.map((opt) => (
        <Chip key={opt} label={opt} selected={value === opt} onPress={() => onChange(opt)} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
});
