import React, { useState } from 'react';
import {
  FormControl,
  FormControlError,
  FormControlErrorText,
  FormControlLabel,
  FormControlLabelText,
  Input as GSInput,
  InputField,
  InputSlot,
  Box,
} from '@gluestack-ui/themed';
import { Pressable } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

type Props = {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  errorText?: string;
};

export function PasswordInput({ label, placeholder, value, onChangeText, errorText }: Props) {
  const [show, setShow] = useState(false);
  const isInvalid = !!errorText;

  return (
    <Box mb="$2">
      <FormControl isInvalid={isInvalid} size="md">
        {label ? (
          <FormControlLabel>
            <FormControlLabelText>{label}</FormControlLabelText>
          </FormControlLabel>
        ) : null}
        <GSInput>
          <InputField
            placeholder={placeholder}
            value={value}
            onChangeText={onChangeText}
            secureTextEntry={!show}
            testID="password-field"
          />
          <InputSlot pr="$3">
            <Pressable
              onPress={() => setShow((s) => !s)}
              accessibilityRole="button"
              accessibilityLabel="Mostrar u ocultar contraseña"
              testID="toggle-visibility"
            >
              <Ionicons name={show ? 'eye-off' : 'eye'} size={16} />
            </Pressable>
          </InputSlot>
        </GSInput>
        {isInvalid ? (
          <FormControlError>
            <FormControlErrorText>{errorText}</FormControlErrorText>
          </FormControlError>
        ) : null}
      </FormControl>
    </Box>
  );
}
