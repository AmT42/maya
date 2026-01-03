import React from 'react';
import {Image, StyleSheet, Text, View} from 'react-native';
import Screen from '../components/ui/Screen';
import Button from '../components/ui/Button';
import {useTheme} from '../theme/theme';

const WelcomeScreen = ({navigation}) => {
  const theme = useTheme();

  return (
    <Screen>
      <View style={styles.container}>
        <View style={[styles.orb1, {backgroundColor: theme.colors.accent}]} />
        <View style={[styles.orb2, {backgroundColor: theme.colors.accent2}]} />

        <View style={styles.hero}>
          <Image
            source={require('../assets/mayaLogo.png')}
            style={styles.logo}
          />
          <Text style={[styles.title, {color: theme.colors.text}]}>Maya</Text>
          <Text style={[styles.subtitle, {color: theme.colors.textSecondary}]}>
            The cleanest way to scan and organize your documents.
          </Text>
        </View>

        <View style={styles.cta}>
          <Button
            title="Sign in"
            icon="log-in-outline"
            onPress={() => navigation.navigate('Login')}
          />
          <Button
            title="Create account"
            variant="secondary"
            icon="person-add-outline"
            onPress={() => navigation.navigate('Register')}
            style={{marginTop: 12}}
          />
          <Text style={[styles.footer, {color: theme.colors.muted}]}>
            By continuing, you agree to keep things minimal.
          </Text>
        </View>
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'space-between',
  },
  orb1: {
    position: 'absolute',
    top: -90,
    right: -80,
    width: 220,
    height: 220,
    borderRadius: 110,
    opacity: 0.14,
  },
  orb2: {
    position: 'absolute',
    bottom: 80,
    left: -90,
    width: 260,
    height: 260,
    borderRadius: 130,
    opacity: 0.1,
  },
  hero: {
    paddingTop: 42,
    alignItems: 'center',
  },
  logo: {
    width: 84,
    height: 84,
    marginBottom: 16,
  },
  title: {
    fontSize: 36,
    fontWeight: '900',
    letterSpacing: -0.8,
  },
  subtitle: {
    marginTop: 10,
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 18,
  },
  cta: {
    paddingBottom: 26,
  },
  footer: {
    marginTop: 14,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default WelcomeScreen;
