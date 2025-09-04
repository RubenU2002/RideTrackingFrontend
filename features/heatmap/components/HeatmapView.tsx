import React from 'react';
import { View, StyleSheet } from 'react-native';
import type { Hotspot } from '../mock';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Palette } from '@/constants/Colors';

// Placeholder heatmap rendering with circles, no map dependency
export function HeatmapView({ hotspots }: { hotspots: Hotspot[] }) {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const bg = isDark ? Palette.dark.surfaceAlt : Palette.light.surface;
  const dot = isDark ? 'rgba(45, 127, 249, 0.25)' : 'rgba(45, 127, 249, 0.2)';
  const core = 'rgba(45, 127, 249, 0.65)';

  return (
    <View style={[styles.map, { backgroundColor: bg }]}> 
      {hotspots.map((h, idx) => (
        <View key={idx} style={[styles.spot, { left: (idx + 1) * 60, top: 50 + idx * 40 }]}> 
          <View style={[styles.spotOuter, { backgroundColor: dot }]} />
          <View style={[styles.spotMid, { backgroundColor: dot }]} />
          <View style={[styles.spotCore, { backgroundColor: core, opacity: h.intensity }]} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  map: {
    height: 260,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(127, 179, 255, 0.25)',
  },
  spot: {
    position: 'absolute',
    width: 0,
    height: 0,
  },
  spotOuter: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
  },
  spotMid: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
  },
  spotCore: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderRadius: 18,
  },
});

