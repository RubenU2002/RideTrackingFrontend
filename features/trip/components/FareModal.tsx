import React, { useState } from 'react';
import { Modal, View, StyleSheet, Text } from 'react-native';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PlatformPicker } from './PlatformPicker';
import { Platform } from '@/core/api/Platform';
import type { PlatformName } from '@/core/state/tripStore';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Input, InputField } from '@gluestack-ui/themed';

type Props = {
  visible: boolean;
  onCancel: () => void;
  onSave: (p: { amount: number; platform: PlatformName }) => void;
};

export function FareModal({ visible, onCancel, onSave }: Props) {
  const [amount, setAmount] = useState('');
  const [platform, setPlatform] = useState<PlatformName>(Platform.UBER);
  const textColor = useThemeColor({}, 'text');

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <Card style={styles.sheet}>
          <Text style={[styles.title, { color: textColor }]}>Finaliza carrera</Text>
          <Text style={[styles.label, { color: textColor }]}>Monto</Text>
          <Input>
            <InputField
              keyboardType="decimal-pad"
              placeholder="$0.00"
              value={amount}
              onChangeText={setAmount}
              returnKeyType="done"
            />
          </Input>
          <Text style={[styles.label, { color: textColor }]}>Plataforma</Text>
          <PlatformPicker value={platform} onChange={setPlatform} />
          <View style={{ height: 12 }} />
          <Button
            title="Guardar"
            onPress={() => onSave({ amount: Number(amount) || 0, platform })}
          />
          <View style={{ height: 8 }} />
          <Button title="Cancelar" variant="secondary" onPress={onCancel} />
        </Card>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  sheet: {
    width: '100%',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  label: {
    marginTop: 8,
    marginBottom: 6,
    fontWeight: '600',
  },
  input: {},
});
