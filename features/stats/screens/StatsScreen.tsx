import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { ExtendedStatsResponse, statsApi } from '@/core/api/stats';
import { createLogger } from '@/core/utils/logger';
import { Box } from '@gluestack-ui/themed';
import React, { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet } from 'react-native';
import { ActivityBlocks } from '../components/ActivityBlocks';
import { CalendarModal } from '../components/CalendarModal';
import { DailySummaryCards } from '../components/DailySummaryCards';
import { DateSelector } from '../components/DateSelector';
import { EarningsPerTripBars } from '../components/EarningsPerTripBars';
import { PlatformPie } from '../components/PlatformPie';

const log = createLogger('StatsScreen');

export default function StatsScreen() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ExtendedStatsResponse['data'] | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [calendarOpen, setCalendarOpen] = useState(false);

  const fetchData = useCallback(async (iso?: string) => {
    try {
      setError(null);
      setLoading(true);
      const res = await statsApi.getExtended(iso);
      setData(res.data);
    } catch (e: any) {
      log.error('Failed to load extended stats', e);
      setError(e?.message || 'Error cargando estadísticas');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(selectedDate);
  }, [fetchData, selectedDate]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData(selectedDate);
    setRefreshing(false);
  }, [fetchData, selectedDate]);

  const prevDay = () => {
    const d = new Date(selectedDate + 'T00:00:00');
    d.setDate(d.getDate() - 1);
    setSelectedDate(d.toISOString().slice(0, 10));
  };
  const nextDay = () => {
    const d = new Date(selectedDate + 'T00:00:00');
    const today = new Date();
    d.setDate(d.getDate() + 1);
    if (d > today) {return;}
    setSelectedDate(d.toISOString().slice(0, 10));
  };

  const humanLabel = () => {
    const sel = new Date(selectedDate + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (sel.getTime() === today.getTime()) {return 'Hoy';}
    const ayer = new Date(today);
    ayer.setDate(today.getDate() - 1);
    if (sel.getTime() === ayer.getTime()) {return 'Ayer';}
    const meses = [
      'enero',
      'febrero',
      'marzo',
      'abril',
      'mayo',
      'junio',
      'julio',
      'agosto',
      'septiembre',
      'octubre',
      'noviembre',
      'diciembre',
    ];
    return `${sel.getDate()} ${meses[sel.getMonth()]} ${sel.getFullYear()}`;
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <Box style={styles.stack}>
          <DateSelector
            isoDate={selectedDate}
            label={humanLabel()}
            onPrev={prevDay}
            onNext={nextDay}
            onOpenCalendar={() => setCalendarOpen(true)}
            disableNext={selectedDate === new Date().toISOString().slice(0, 10)}
          />
          {loading && <ThemedText style={styles.loading}>Cargando…</ThemedText>}
          {error && !loading && <ThemedText style={styles.error}>{error}</ThemedText>}
          {!loading && !error && data && (
            <>
              <DailySummaryCards summary={data.summary} prev={data.prevDaySummary} />
              <EarningsPerTripBars values={data.summary.earningsPerTrip} />
              <PlatformPie data={data.byPlatform} />
              <ActivityBlocks values={data.summary.activityBlocks} />
            </>
          )}
        </Box>
      </ScrollView>
      <CalendarModal
        visible={calendarOpen}
        onClose={() => setCalendarOpen(false)}
        selected={selectedDate}
        onSelect={(iso) => {
          setSelectedDate(iso);
          setCalendarOpen(false);
        }}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingBottom: 48 },
  stack: { padding: 16, gap: 18 },
  loading: { padding: 8, opacity: 0.7 },
  error: { padding: 8, color: '#ef4444' },
});
