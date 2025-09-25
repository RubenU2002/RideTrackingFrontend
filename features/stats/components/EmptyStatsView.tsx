import { ThemedText } from '@/components/ThemedText';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Box, VStack } from '@gluestack-ui/themed';
import React from 'react';
import { StyleSheet } from 'react-native';

interface EmptyStatsViewProps {
  onRefresh: () => void;
  selectedDate: string;
  isToday: boolean;
}

export function EmptyStatsView({ onRefresh, selectedDate, isToday }: EmptyStatsViewProps) {
  const formatDate = (isoDate: string) => {
    const date = new Date(isoDate + 'T00:00:00');
    return date.toLocaleDateString('es-CO', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <Card style={styles.emptyCard}>
      <VStack space="lg" alignItems="center" py="$6">
        {/* Icono */}
        <Box
          width={80}
          height={80}
          borderRadius={40}
          bg="$backgroundLight100"
          sx={{ _dark: { bg: '$backgroundDark900' } }}
          alignItems="center"
          justifyContent="center"
        >
          <IconSymbol name="chart.bar.fill" size={40} color="$textLight500" />
        </Box>

        {/* Título y descripción */}
        <VStack space="sm" alignItems="center">
          <ThemedText type="title" style={styles.emptyTitle}>
            Sin datos disponibles
          </ThemedText>

          <ThemedText style={styles.emptyDescription}>
            {isToday
              ? 'Aún no tienes viajes registrados hoy. ¡Comienza tu primer viaje!'
              : `No hay viajes registrados para ${formatDate(selectedDate)}.`}
          </ThemedText>
        </VStack>

        {/* Sugerencias */}
        <VStack space="xs" alignItems="center" px="$4">
          <ThemedText style={styles.suggestions}>💡 Sugerencias:</ThemedText>
          <ThemedText style={styles.suggestionItem}>
            • Ve a la pestaña &quot;Viajes&quot; para registrar uno nuevo
          </ThemedText>
          <ThemedText style={styles.suggestionItem}>
            • Verifica que tengas viajes sincronizados
          </ThemedText>
          {!isToday && (
            <ThemedText style={styles.suggestionItem}>• Selecciona una fecha diferente</ThemedText>
          )}
        </VStack>

        {/* Botón de refrescar */}
        <Button title="Actualizar datos" onPress={onRefresh} style={styles.refreshButton} />
      </VStack>
    </Card>
  );
}

const styles = StyleSheet.create({
  emptyCard: {
    marginTop: 20,
    padding: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.7,
    lineHeight: 22,
    maxWidth: 280,
  },
  suggestions: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
    marginBottom: 4,
    opacity: 0.8,
  },
  suggestionItem: {
    fontSize: 13,
    opacity: 0.6,
    textAlign: 'center',
    lineHeight: 18,
  },
  refreshButton: {
    marginTop: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
});
