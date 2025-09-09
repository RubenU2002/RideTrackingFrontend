import React, { useState } from 'react';
import { StyleSheet, View, Switch, Alert } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useThemeController } from '@/core/theme/ThemeProvider';
import { useTripStore } from '@/core/state/tripStore';
import { useAuth } from '@/core/auth/AuthContext';
import { router } from 'expo-router';

export default function SettingsScreen() {
  const [trackingOnlyDuringTrip, setTrackingOnlyDuringTrip] = useState(true);
  const { mode, setMode } = useThemeController();
  const { clearAll, trips } = useTripStore();
  const { logout, user } = useAuth();

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
            <Switch value={trackingOnlyDuringTrip} onValueChange={setTrackingOnlyDuringTrip} />
          </View>
          <ThemedText style={{ opacity: 0.7 }}>
            Tus datos se guardan localmente. Próximamente podrás sincronizar con la nube.
          </ThemedText>
        </Card>

        <Card>
          <ThemedText type="subtitle">Datos</ThemedText>
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
              title="Borrar todo"
              variant="secondary"
              onPress={() =>
                Alert.alert('Borrar datos', '¿Seguro que quieres borrar todo?', [
                  { text: 'Cancelar', style: 'cancel' },
                  { text: 'Borrar', style: 'destructive', onPress: clearAll },
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
