import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/core/auth/AuthContext';
import { loadSettings, saveSettings } from '@/core/settings/settingsStorage';
import { useTripStore } from '@/core/state/tripStore';
import { useSync } from '@/core/sync/SyncProvider';
import { useThemeController } from '@/core/theme/ThemeProvider';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Switch, View } from 'react-native';

export default function SettingsScreen() {
  const [trackingOnlyDuringTrip, setTrackingOnlyDuringTrip] = useState(true);
  useEffect(() => {
    (async () => {
      const s = await loadSettings();
      setTrackingOnlyDuringTrip(s.trackingOnlyDuringTrip);
    })();
  }, []);
  const { mode, setMode } = useThemeController();
  const { clearAll, trips } = useTripStore();
  const { logout, user } = useAuth();
  const { pending, flush } = useSync();

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="title">Ajustes</ThemedText>
        <ThemedText style={{ opacity: 0.7 }}>Privacidad y apariencia</ThemedText>
      </View>

      <View style={styles.content}>
        <Card>
          <ThemedText type="subtitle">Apariencia</ThemedText>
          <View style={styles.row}>
            <Button
              title="Sistema"
              variant={mode === 'system' ? 'primary' : 'secondary'}
              onPress={() => setMode('system')}
              style={styles.rowBtn}
            />
            <Button
              title="Claro"
              variant={mode === 'light' ? 'primary' : 'secondary'}
              onPress={() => setMode('light')}
              style={styles.rowBtn}
            />
            <Button
              title="Oscuro"
              variant={mode === 'dark' ? 'primary' : 'secondary'}
              onPress={() => setMode('dark')}
              style={styles.rowBtn}
            />
          </View>
        </Card>

        <Card>
          <ThemedText type="subtitle">Privacidad</ThemedText>
          <View style={[styles.row, { alignItems: 'center' }]}>
            <ThemedText style={{ flex: 1 }}>Tracking solo durante la carrera</ThemedText>
            <Switch
              value={trackingOnlyDuringTrip}
              onValueChange={async (v) => {
                setTrackingOnlyDuringTrip(v);
                await saveSettings({ trackingOnlyDuringTrip: v });
              }}
            />
          </View>
          <ThemedText style={{ opacity: 0.7 }}>
            Tus datos se guardan localmente. Próximamente podrás sincronizar con la nube.
          </ThemedText>
        </Card>

        <Card>
          <ThemedText type="subtitle">Datos</ThemedText>
          <ThemedText style={{ opacity: 0.7 }}>Pendientes por enviar: {pending}</ThemedText>
          <View style={styles.row}>
            <Button
              title="Exportar CSV"
              variant="secondary"
              onPress={() =>
                Alert.alert('Exportar', 'Mock: exportar CSV de ' + trips.length + ' viajes')
              }
              style={styles.rowBtn}
            />
            <Button
              title="Reintentar sync"
              variant="secondary"
              onPress={flush}
              style={styles.rowBtn}
            />
            <Button
              title="Borrar todo"
              variant="secondary"
              onPress={() =>
                Alert.alert('Borrar datos', '¿Seguro que quieres borrar todo?', [
                  { text: 'Cancelar', style: 'cancel' },
                  {
                    text: 'Borrar',
                    style: 'destructive',
                    onPress: async () => {
                      const { clearAllLocalData } = await import('@/core/storage/tripRepo');
                      await clearAllLocalData();
                      clearAll();
                    },
                  },
                ])
              }
              style={styles.rowBtn}
            />
          </View>
        </Card>

        <Card>
          <ThemedText type="subtitle">Cuenta</ThemedText>
          <ThemedText style={{ opacity: 0.7, marginBottom: 8 }}>
            {user ? `Sesión: ${user.name} (${user.email})` : 'No autenticado'}
          </ThemedText>
          <View style={styles.row}>
            <Button
              title="Cerrar sesión"
              variant="secondary"
              onPress={async () => {
                await logout();
                router.replace('/login');
              }}
              style={styles.rowBtn}
            />
          </View>
        </Card>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 24, paddingHorizontal: 20, paddingBottom: 8 },
  content: { padding: 20, gap: 16 },
  row: { flexDirection: 'row', gap: 8, marginTop: 8 },
  rowBtn: { flex: 1 },
});
