import React from 'react';
import {StyleSheet, Text, TextInput, View} from 'react-native';
import {useTheme} from '../../theme/theme';

const TextField = ({
  label,
  value,
  onChangeText,
  placeholder,
  autoFocus,
  secureTextEntry,
  keyboardType,
  autoCapitalize,
  returnKeyType,
  onSubmitEditing,
  multiline,
  numberOfLines,
  style,
  inputStyle,
}) => {
  const theme = useTheme();

  return (
    <View style={style}>
      {label ? (
        <Text style={[styles.label, {color: theme.colors.textSecondary}]}>
          {label}
        </Text>
      ) : null}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.muted}
        autoFocus={autoFocus}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        returnKeyType={returnKeyType}
        onSubmitEditing={onSubmitEditing}
        multiline={multiline}
        numberOfLines={numberOfLines}
        style={[
          styles.input,
          {
            backgroundColor: theme.colors.surface2,
            borderColor: theme.colors.border,
            color: theme.colors.text,
          },
          inputStyle,
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  label: {
    marginBottom: 8,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  input: {
    minHeight: 52,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default TextField;
