import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Chip } from '@/components/ui/Chip';
import { Platform } from '@/core/api/Platform';
import { getPlatformDisplayName } from '@/core/utils/platform';
import type { PlatformName } from '@/core/state/tripStore';

const OPTIONS: PlatformName[] = [
  Platform.UBER,
  Platform.DIDI,
  Platform.INDRIVE,
  Platform.TAXI,
  Platform.BEAT,
  Platform.CABIFY,
  Platform.PERSONAL,
  Platform.OTHER,
];

export function PlatformPicker({
  value,
  onChange,
}: {
  value: PlatformName;
  onChange: (v: PlatformName) => void;
}) {
  return (
    <View style={styles.row}>
      {OPTIONS.map((opt) => (
        <Chip
          key={opt}
          label={getPlatformDisplayName(opt)}
          selected={value === opt}
          onPress={() => onChange(opt)}
        />
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
