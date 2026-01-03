import React from 'react';
import {ActivityIndicator, Image, StyleSheet, Text, View} from 'react-native';
import Screen from '../components/ui/Screen';
import {useTheme} from '../theme/theme';

const SplashScreen = () => {
  const theme = useTheme();

  return (
    <Screen>
      <View style={styles.container}>
        <View style={[styles.glow, {backgroundColor: theme.colors.accent}]} />
        <Image source={require('../assets/mayaLogo.png')} style={styles.logo} />
        <Text style={[styles.title, {color: theme.colors.text}]}>Maya</Text>
        <Text style={[styles.subtitle, {color: theme.colors.textSecondary}]}>
          Scan • Extract • Organize
        </Text>
        <ActivityIndicator
          style={{marginTop: 18}}
          color={theme.colors.accent}
        />
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  glow: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    opacity: 0.12,
  },
  logo: {
    width: 88,
    height: 88,
    marginBottom: 14,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.6,
  },
  subtitle: {
    marginTop: 6,
    fontSize: 14,
    fontWeight: '600',
  },
});

export default SplashScreen;
