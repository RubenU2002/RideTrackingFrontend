import React from 'react';
import {
  FormControl,
  FormControlError,
  FormControlErrorText,
  FormControlLabel,
  FormControlLabelText,
  Input as GSInput,
  InputField,
  Box,
} from '@gluestack-ui/themed';
import { KeyboardTypeOptions, TextInputProps } from 'react-native';

type Props = {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoComplete?: TextInputProps['autoComplete'];
  errorText?: string;
};

export function Input({
  label,
  placeholder,
  value,
  onChangeText,
  secureTextEntry,
  keyboardType,
  autoCapitalize,
  autoComplete,
  errorText,
}: Props) {
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
            secureTextEntry={secureTextEntry}
            keyboardType={keyboardType}
            autoCapitalize={autoCapitalize}
            autoComplete={autoComplete}
          />
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
