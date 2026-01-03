import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {useTheme} from '../../theme/theme';

const getVariantStyle = (theme, variant) => {
  if (variant === 'secondary') {
    return {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border,
      textColor: theme.colors.text,
      iconColor: theme.colors.text,
    };
  }

  if (variant === 'ghost') {
    return {
      backgroundColor: 'transparent',
      borderColor: 'transparent',
      textColor: theme.colors.textSecondary,
      iconColor: theme.colors.textSecondary,
    };
  }

  return {
    backgroundColor: theme.colors.accent,
    borderColor: 'transparent',
    textColor: '#001018',
    iconColor: '#001018',
  };
};

const Button = ({
  title,
  onPress,
  style,
  variant = 'primary',
  icon,
  disabled,
  loading,
}) => {
  const theme = useTheme();
  const variantStyle = getVariantStyle(theme, variant);

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({pressed}) => [
        styles.button,
        {
          backgroundColor: variantStyle.backgroundColor,
          borderColor: variantStyle.borderColor,
          opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
        },
        style,
      ]}>
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator color={variantStyle.iconColor} />
        ) : (
          <>
            {icon ? (
              <Icon
                name={icon}
                size={18}
                color={variantStyle.iconColor}
                style={styles.icon}
              />
            ) : null}
            <Text
              style={[styles.text, {color: variantStyle.textColor}]}
              numberOfLines={1}>
              {title}
            </Text>
          </>
        )}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    height: 52,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginRight: 10,
  },
  text: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});

export default Button;
