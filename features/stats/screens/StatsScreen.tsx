import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { ExtendedStatsResponse, statsApi } from '@/core/api/stats';
import { createLogger } from '@/core/utils/logger';
import { getTodayInColombia } from '@/core/utils/timezone';
import { Box } from '@gluestack-ui/themed';
import React, { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet } from 'react-native';
import { ActivityBlocks } from '../components/ActivityBlocks';
import { CalendarModal } from '../components/CalendarModal';
import { DailySummaryCards } from '../components/DailySummaryCards';
import { DateSelector } from '../components/DateSelector';
import { EarningsPerTripBars } from '../components/EarningsPerTripBars';
import { EmptyStatsView } from '../components/EmptyStatsView';
import { PlatformPie } from '../components/PlatformPie';
import {
  ActivityBlocksSkeleton,
  DailySummaryCardsSkeleton,
  EarningsPerTripBarsSkeleton,
  PlatformPieSkeleton,
} from '../components/StatsSkeleton';

const log = createLogger('StatsScreen');

export default function StatsScreen() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ExtendedStatsResponse['data'] | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => getTodayInColombia());
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
    const todayString = getTodayInColombia();
    d.setDate(d.getDate() + 1);
    const nextDayString = d.toISOString().slice(0, 10);
    if (nextDayString > todayString) {
      return;
    }
    setSelectedDate(nextDayString);
  };

  const humanLabel = () => {
    const todayString = getTodayInColombia();
    if (selectedDate === todayString) {
      return 'Hoy';
    }

    const today = new Date(todayString + 'T00:00:00');
    const ayer = new Date(today);
    ayer.setDate(today.getDate() - 1);
    if (selectedDate === ayer.toISOString().slice(0, 10)) {
      return 'Ayer';
    }
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
    const sel = new Date(selectedDate + 'T00:00:00');
    return `${sel.getDate()} ${meses[sel.getMonth()]} ${sel.getFullYear()}`;
  };
  const hasData =
    data &&
    (data.summary.trips > 0 ||
      data.summary.total > 0 ||
      data.summary.activityBlocks.some((value) => value > 0));

  const isToday = selectedDate === getTodayInColombia();

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
            disableNext={selectedDate === getTodayInColombia()}
          />

          {/* Estado de carga con skeletons */}
          {loading && (
            <>
              <DailySummaryCardsSkeleton />
              <EarningsPerTripBarsSkeleton />
              <PlatformPieSkeleton />
              <ActivityBlocksSkeleton />
            </>
          )}

          {/* Estado de error */}
          {error && !loading && <ThemedText style={styles.error}>{error}</ThemedText>}

          {/* Vista vacía cuando no hay datos */}
          {!loading && !error && data && !hasData && (
            <EmptyStatsView onRefresh={onRefresh} selectedDate={selectedDate} isToday={isToday} />
          )}

          {/* Datos reales cuando hay información */}
          {!loading && !error && data && hasData && (
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
  error: { padding: 8, color: '#ef4444' },
});
