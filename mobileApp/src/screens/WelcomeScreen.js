import React, {useEffect, useState} from 'react';
import {Alert, Image, Pressable, StyleSheet, Text, View} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Screen from '../components/ui/Screen';
import Button from '../components/ui/Button';
import {useTheme} from '../theme/theme';
import {useUser} from '../contexts/UserContext';
import {loginWithGoogle} from '../services/authService';
import {
  getApiBaseUrl,
  INFERRED_API_BASE_URL,
  setApiBaseUrl,
} from '../config/apiConfig';

const WelcomeScreen = ({navigation}) => {
  const theme = useTheme();
  const {setUser} = useUser();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [apiBaseUrl, setApiBaseUrlState] = useState(INFERRED_API_BASE_URL);
  const [devTapCount, setDevTapCount] = useState(0);

  useEffect(() => {
    getApiBaseUrl().then(setApiBaseUrlState).catch(() => {});
  }, []);

  useEffect(() => {
    if (!devTapCount) {
      return;
    }
    const timer = setTimeout(() => setDevTapCount(0), 1200);
    return () => clearTimeout(timer);
  }, [devTapCount]);

  const openBackendUrlPrompt = () => {
    Alert.prompt(
      'Backend URL',
      'Set the Maya backend base URL (example: http://192.168.1.10:8000). Leave empty to reset.',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            const nextUrl = await setApiBaseUrl('');
            setApiBaseUrlState(nextUrl);
          },
        },
        {
          text: 'Save',
          onPress: async (value) => {
            const nextUrl = await setApiBaseUrl(value);
            setApiBaseUrlState(nextUrl);
          },
        },
      ],
      'plain-text',
      apiBaseUrl,
    );
  };

  const handleSecretTap = () => {
    setDevTapCount((current) => {
      const next = current + 1;
      if (next >= 7) {
        openBackendUrlPrompt();
        return 0;
      }
      return next;
    });
  };

  const handleGoogle = async () => {
    setIsGoogleLoading(true);
    setError('');
    try {
      const user = await loginWithGoogle({setUser});
      if (!user) {
        return;
      }
      navigation.getParent()?.goBack?.();
    } catch (e) {
      const details =
        e.response?.data ||
        (e.config ? {url: e.config.baseURL + e.config.url, message: e.message} : e.message);
      console.error('Error during Google login:', details);
      if (e.message === 'Network Error') {
        setError(`Can't reach backend (${apiBaseUrl}).`);
      } else {
        setError('Google sign-in failed.');
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <Screen>
      <View style={styles.container}>
        <View style={styles.topRow}>
          <Pressable
            onPress={() => navigation.getParent()?.goBack?.()}
            style={({pressed}) => [
              styles.closeButton,
              {opacity: pressed ? 0.7 : 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface2},
            ]}
            accessibilityRole="button"
            accessibilityLabel="Close">
            <Icon name="close" size={18} color={theme.colors.text} />
          </Pressable>
        </View>

        <View style={styles.hero}>
          <Image
            source={require('../assets/mayaLogo.png')}
            style={styles.logo}
          />
          <Text style={[styles.title, {color: theme.colors.text}]}>Maya</Text>
          <Text style={[styles.subtitle, {color: theme.colors.textSecondary}]}>
            Scan instantly. Sign in when you want library + search.
          </Text>
        </View>

        <View style={styles.cta}>
          {error ? (
            <Text style={[styles.error, {color: theme.colors.error}]}>
              {error}
            </Text>
          ) : null}
          <Button
            title="Continue with Google"
            variant="secondary"
            icon="logo-google"
            onPress={handleGoogle}
            loading={isGoogleLoading}
          />
          <Button
            title="Continue without account"
            variant="ghost"
            icon="scan-outline"
            onPress={() => navigation.getParent()?.goBack?.()}
            style={{marginTop: 10}}
          />
          <Button
            title="Sign in"
            icon="log-in-outline"
            onPress={() => navigation.navigate('Login')}
            style={{marginTop: 12}}
          />
          <Button
            title="Create account"
            variant="secondary"
            icon="person-add-outline"
            onPress={() => navigation.navigate('Register')}
            style={{marginTop: 12}}
          />
          <Text
            onPress={handleSecretTap}
            style={[styles.footer, {color: theme.colors.muted}]}>
            By continuing, you agree to keep things minimal.
          </Text>
          <Text
            style={[styles.devHint, {color: theme.colors.muted}]}>
            {__DEV__ ? `Backend: ${apiBaseUrl}` : ''}
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
  topRow: {
    paddingTop: 8,
    height: 52,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hero: {
    paddingTop: 10,
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
  error: {
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 10,
  },
  footer: {
    marginTop: 14,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  devHint: {
    marginTop: 6,
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
});

export default WelcomeScreen;
