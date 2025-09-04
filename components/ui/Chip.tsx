import React from 'react';
import { ViewStyle } from 'react-native';
import { Button as GSButton, ButtonText } from '@gluestack-ui/themed';

type Props = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
};

export function Chip({ label, selected, onPress, style }: Props) {
  return (
    <GSButton
      size="sm"
      variant={selected ? 'solid' : 'outline'}
      action="primary"
      onPress={onPress}
      sx={{ borderRadius: '$full', height: 36, px: '$3', ...(style as any) }}
      accessibilityState={{ selected }}>
      <ButtonText>{label}</ButtonText>
    </GSButton>
  );
}
