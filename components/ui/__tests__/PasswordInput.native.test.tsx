import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import { PasswordInput } from '@/components/ui/PasswordInput';

// Mock gluestack components without referencing out-of-scope vars in the factory
jest.mock('@gluestack-ui/themed', () => {
  const React = jest.requireActual('react');
  const { View, Text, TextInput } = jest.requireActual('react-native');

  const PassThrough = ({ children, ...props }: any) => React.createElement(View, props, children);
  const Label = ({ children }: any) => React.createElement(Text, null, children);
  const Input = ({ children, ...props }: any) => React.createElement(View, props, children);
  const InputField = (props: any) => React.createElement(TextInput, props);

  return {
    FormControl: PassThrough,
    FormControlError: PassThrough,
    FormControlErrorText: Label,
    FormControlLabel: PassThrough,
    FormControlLabelText: Label,
    Input,
    InputField,
    InputSlot: PassThrough,
    Box: PassThrough,
    Icon: PassThrough,
  };
});

const isRN = typeof navigator !== 'undefined' && (navigator as any).product === 'ReactNative';

(isRN ? describe : describe.skip)('PasswordInput (native)', () => {
  it('toggles secureTextEntry when pressing the eye icon', () => {
    const onChangeText = jest.fn();
    const { getByTestId } = render(
      <PasswordInput label="Contraseña" value="secret" onChangeText={onChangeText} />,
    );

    const field = getByTestId('password-field');
    // initial should be secure
    expect(field.props.secureTextEntry).toBe(true);

    act(() => {
      fireEvent.press(getByTestId('toggle-visibility'));
    });
    expect(field.props.secureTextEntry).toBe(false);

    act(() => {
      fireEvent.press(getByTestId('toggle-visibility'));
    });
    expect(field.props.secureTextEntry).toBe(true);
  });
});
