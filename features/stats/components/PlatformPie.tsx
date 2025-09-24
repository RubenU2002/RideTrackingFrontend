import { ThemedText } from '@/components/ThemedText';
import { Card } from '@/components/ui/Card';
import type { PlatformsDistribution } from '@/core/api/stats';
import { getPlatformColor } from '@/core/theme/platformColors';
import { Box, Pressable } from '@gluestack-ui/themed';
import React, { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';

export function PlatformPie({ data }: { data: PlatformsDistribution[] }) {
  const filtered = data.filter((d) => d.total > 0);
  const total = filtered.reduce((a, d) => a + d.total, 0) || 1;
  const [selected, setSelected] = React.useState<string | null>(null);

  const segments = useMemo(() => {
    let current = -Math.PI / 2;
    return filtered.map((d) => {
      const angle = (d.total / total) * Math.PI * 2;
      const start = current;
      const end = current + angle;
      current = end;
      return { ...d, start, end };
    });
  }, [filtered, total]);

  const donut = segments.map((seg) => (
    <Path
      key={seg.platform}
      d={buildDonutArc(80, 80, 70, 44, seg.start, seg.end)}
      fill={getPlatformColor(seg.platform)}
      onPress={() => setSelected((prev) => (prev === seg.platform ? null : seg.platform))}
    />
  ));

  const selectedSeg = segments.find((s) => s.platform === selected) || null;
  let tooltipPos: { x: number; y: number } | null = null;
  if (selectedSeg) {
    const mid = (selectedSeg.start + selectedSeg.end) / 2;
    const rMid = (70 + 44) / 2; // between outer & inner
    tooltipPos = polar(80, 80, rMid, mid);
  }

  return (
    <Card style={styles.card}>
      <ThemedText type="subtitle" style={styles.title}>
        Ingresos por Plataforma
      </ThemedText>
      <Box flexDirection="row" alignItems="center" justifyContent="space-between">
        <Box style={styles.svgWrap} alignItems="center" justifyContent="center">
          <Svg width={160} height={160} viewBox="0 0 160 160">
            {donut}
            {segments.length === 0 && (
              <Path d={buildDonutArc(80, 80, 70, 44, 0, Math.PI * 2)} fill="#e2e8f0" />
            )}
          </Svg>
          {segments.length > 0 && (
            <Box position="absolute" alignItems="center">
              <ThemedText style={styles.centerAmount}>{currency(total)}</ThemedText>
            </Box>
          )}
          {selectedSeg && tooltipPos && (
            <Pressable
              onPress={() => setSelected(null)}
              accessibilityLabel="Cerrar detalle"
              style={[styles.tooltipPos, { left: tooltipPos.x, top: tooltipPos.y }]}
            >
              <Box
                px="$3"
                py="$2"
                borderRadius={12}
                bg="$backgroundLight0"
                borderWidth={1}
                borderColor="$borderLight200"
                sx={{ _dark: { bg: '$backgroundDark950', borderColor: '$borderDark700' } }}
                minWidth={90}
                alignItems="center"
                gap={2}
              >
                <ThemedText style={styles.tooltipTitle}>{selectedSeg.platform}</ThemedText>
                <ThemedText style={styles.tooltipVal}>{currency(selectedSeg.total)}</ThemedText>
                <ThemedText style={styles.tooltipPct}>{selectedSeg.percentage}%</ThemedText>
              </Box>
            </Pressable>
          )}
        </Box>
        <Box style={styles.legend}>
          {segments.map((s) => (
            <Pressable
              key={s.platform}
              onPress={() => setSelected((prev) => (prev === s.platform ? null : s.platform))}
              style={[styles.legendRow, selected === s.platform && styles.legendRowSel]}
            >
              <Box
                width={12}
                height={12}
                borderRadius={4}
                style={{ backgroundColor: getPlatformColor(s.platform) }}
              />
              <ThemedText numberOfLines={1} style={styles.legendPlatform}>
                {s.platform}
              </ThemedText>
              <ThemedText style={styles.legendVal}>{currency(s.total)}</ThemedText>
              <ThemedText style={styles.legendPct}>{s.percentage}%</ThemedText>
            </Pressable>
          ))}
        </Box>
      </Box>
    </Card>
  );
}

function buildDonutArc(
  cx: number,
  cy: number,
  rOuter: number,
  rInner: number,
  start: number,
  end: number,
) {
  const large = end - start > Math.PI ? 1 : 0;
  const so = polar(cx, cy, rOuter, start);
  const eo = polar(cx, cy, rOuter, end);
  const si = polar(cx, cy, rInner, end);
  const ei = polar(cx, cy, rInner, start);
  return `M ${so.x} ${so.y} A ${rOuter} ${rOuter} 0 ${large} 1 ${eo.x} ${eo.y} L ${si.x} ${si.y} A ${rInner} ${rInner} 0 ${large} 0 ${ei.x} ${ei.y} Z`;
}

function polar(cx: number, cy: number, r: number, angle: number) {
  return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
}

function currency(n: number) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(n);
}

const styles = StyleSheet.create({
  card: { gap: 14 },
  title: { fontSize: 16, opacity: 0.85 },
  svgWrap: { width: 170, height: 170 },
  centerAmount: { fontSize: 12, fontWeight: '600', textAlign: 'center', maxWidth: 100 },
  legend: { paddingLeft: 12, flexGrow: 1, gap: 6, minWidth: 120 },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderRadius: 8,
  },
  legendRowSel: { backgroundColor: 'rgba(148,163,184,0.12)' },
  legendPlatform: { fontSize: 12, flex: 1 },
  legendVal: { fontSize: 12, fontWeight: '600' },
  legendPct: { fontSize: 11, opacity: 0.6 },
  tooltipPos: { position: 'absolute', transform: [{ translateX: -50 }, { translateY: -42 }] },
  tooltipTitle: { fontSize: 11, fontWeight: '600', opacity: 0.8 },
  tooltipVal: { fontSize: 14, fontWeight: '700' },
  tooltipPct: { fontSize: 11, opacity: 0.6 },
});
