import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/core/auth/AuthContext';
import { router } from 'expo-router';
import { ApiError } from '@/core/api/types';
import { Input } from '@/components/ui/Input';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { Card } from '@/components/ui/Card';
import { FormError } from '@/components/ui/FormError';

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const onSubmit = async () => {
    if (!email || !password) {
      setFormError('Ingresa email y contraseña');
      return;
    }
    setLoading(true);
    try {
      setFormError(null);
      setFieldErrors({});
      await login(email.trim(), password);
      router.replace('/(tabs)');
    } catch (e: unknown) {
      if (e instanceof ApiError) {
        setFormError(e.message);
        const map: Record<string, string> = {};
        e.body?.errors?.forEach((err) => {
          map[err.field] = err.message;
        });
        setFieldErrors(map);
      } else if (e && typeof e === 'object' && 'message' in e) {
        setFormError(String((e as { message: string }).message));
      } else {
        setFormError('No se pudo iniciar sesión');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1 }}
    >
      <ThemedView style={styles.container}>
        <ThemedText type="title" style={{ marginBottom: 12 }}>
          RideTracking
        </ThemedText>
        <ThemedText style={{ opacity: 0.7, marginBottom: 24 }}>
          Inicia sesión para continuar
        </ThemedText>

        <Card style={{ gap: 12 }}>
          <FormError message={formError} />
          <Input
            label="Email"
            placeholder="ejemplo@email.com"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            errorText={fieldErrors.email}
          />
          <PasswordInput
            label="Contraseña"
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            errorText={fieldErrors.password}
          />
          <Button
            title={loading ? 'Ingresando...' : 'Ingresar'}
            onPress={onSubmit}
            disabled={loading}
          />
          <View style={{ height: 4 }} />
          <Button
            title="Crear cuenta"
            variant="secondary"
            onPress={() => router.replace('/register')}
          />
        </Card>
      </ThemedView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  input: {},
  errorText: {},
});
