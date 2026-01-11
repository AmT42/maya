import React from 'react';
import {Pressable, StyleSheet, View} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {useTheme} from '../../theme/theme';

const IconButton = ({
  icon,
  onPress,
  disabled,
  size = 20,
  style,
  accessibilityLabel,
}) => {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      disabled={disabled}
      onPress={onPress}
      style={({pressed}) => [
        styles.button,
        {
          backgroundColor: theme.colors.surface2,
          borderColor: theme.colors.border,
          opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
          transform: [{scale: pressed ? 0.99 : 1}],
        },
        style,
      ]}>
      <View>
        <Icon name={icon} size={size} color={theme.colors.text} />
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default IconButton;
