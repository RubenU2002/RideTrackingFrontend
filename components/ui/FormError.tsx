import React from 'react';
import { Box, Text } from '@gluestack-ui/themed';

export function FormError({ message }: { message?: string | null }) {
  if (!message) {
    return null;
  }
  return (
    <Box
      borderWidth={1}
      borderColor="$red600"
      bg="$red100"
      p="$3"
      mb="$2"
      sx={{ _dark: { bg: '$red900', borderColor: '$red700' } }}
      borderRadius="$sm"
    >
      <Text color="$red700" sx={{ _dark: { color: '$red100' } }}>
        {message}
      </Text>
    </Box>
  );
}
