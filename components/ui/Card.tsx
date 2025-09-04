import React from 'react';
import { ViewProps } from 'react-native';
import { Box } from '@gluestack-ui/themed';

export function Card({ style, children, ...rest }: ViewProps) {
  return (
    <Box
      borderWidth={1}
      borderRadius="$lg"
      p="$4"
      borderColor="$borderLight200"
      sx={{
        _dark: { borderColor: '$borderDark700', bg: '$backgroundDark950' },
        _light: { borderColor: '$borderLight200', bg: '$backgroundLight0' },
      }}
      style={style}
      {...(rest as any)}>
      {children}
    </Box>
  );
}
