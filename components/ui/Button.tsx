import React from 'react';
import { ViewStyle } from 'react-native';
import { Button as GSButton, ButtonText } from '@gluestack-ui/themed';

type Props = {
  title: string;
  onPress?: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'md' | 'lg';
  style?: ViewStyle;
};

export function Button({ title, onPress, disabled, variant = 'primary', size = 'md', style }: Props) {
  // Map to gluestack variants
  const gsVariant = variant === 'ghost' ? 'link' : variant === 'secondary' ? 'outline' : 'solid';
  const action = variant === 'danger' ? 'primary' : 'primary';
  const sxDanger = variant === 'danger' ? { bg: '$red600', _dark: { bg: '$red600' } } : {};
  const gsSize = size === 'lg' ? 'lg' : 'md';
  return (
    <GSButton
      size={gsSize as any}
      variant={gsVariant as any}
      action={action as any}
      isDisabled={disabled}
      onPress={onPress}
      sx={{ width: style?.width, alignSelf: (style as any)?.alignSelf, ...sxDanger }}
      accessibilityLabel={title}>
      <ButtonText>{title}</ButtonText>
    </GSButton>
  );
}
