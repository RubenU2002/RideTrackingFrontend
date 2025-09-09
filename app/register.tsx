import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { Button } from '@/components/ui/Button';
import { authService } from '@/core/auth/authService';
import { router } from 'expo-router';
import { ApiError } from '@/core/api/types';
import { Input } from '@/components/ui/Input';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { Card } from '@/components/ui/Card';
import { FormError } from '@/components/ui/FormError';

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const onSubmit = async () => {
    if (!name || !email || !phone || !password) {
      setFormError('Completa todos los campos');
      return;
    }
    setLoading(true);
    try {
      setFormError(null);
      setFieldErrors({});
      await authService.register(name.trim(), email.trim(), phone.trim(), password);
      router.replace('/login');
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
        setFormError('No se pudo registrar');
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
          Crear cuenta
        </ThemedText>
        <ThemedText style={{ opacity: 0.7, marginBottom: 24 }}>Regístrate para comenzar</ThemedText>

        <Card style={{ gap: 12 }}>
          <FormError message={formError} />
          <Input
            label="Nombre"
            placeholder="Tu nombre"
            value={name}
            onChangeText={setName}
            errorText={fieldErrors.name}
          />
          <Input
            label="Email"
            placeholder="tu@email.com"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            errorText={fieldErrors.email}
          />
          <Input
            label="Teléfono"
            placeholder="Tu número"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            errorText={fieldErrors.phone}
          />
          <PasswordInput
            label="Contraseña"
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            errorText={fieldErrors.password}
          />
          <Button
            title={loading ? 'Creando...' : 'Crear cuenta'}
            onPress={onSubmit}
            disabled={loading}
          />
          <View style={{ height: 4 }} />
          <Button
            title="Ya tengo cuenta"
            variant="secondary"
            onPress={() => router.replace('/login')}
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
