import React, {useState} from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Screen from '../components/ui/Screen';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import TextField from '../components/ui/TextField';
import {useTheme} from '../theme/theme';
import {useUser} from '../contexts/UserContext';
import {loginWithGoogle, loginWithPassword} from '../services/authService';
import {getCachedApiBaseUrl} from '../config/apiConfig';

const LoginScreen = ({navigation}) => {
  const theme = useTheme();
  const [userName, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const [isLoginLoading, setIsLoginLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const {setUser} = useUser();
  const isBusy = isLoginLoading || isGoogleLoading;

  const handleLogin = async () => {
    setIsLoginLoading(true);
    setError('');
    try {
      await loginWithPassword({username: userName, password, setUser});
      navigation.getParent()?.goBack?.();
    } catch (e) {
      console.error('Error during login:', e.response?.data || e.message);
      setError(e.response?.data?.detail || 'Incorrect username or password.');
    } finally {
      setIsLoginLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    setError('');
    try {
      const user = await loginWithGoogle({setUser});
      if (!user) {
        return;
      }
      navigation.getParent()?.goBack?.();
    } catch (e) {
      console.error('Error during Google login:', e.response?.data || e.message);
      if (e.message === 'Network Error') {
        setError(`Can't reach backend (${getCachedApiBaseUrl()}).`);
      } else {
        setError('Google sign-in failed.');
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <Screen>
      <KeyboardAvoidingView
        style={{flex: 1}}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.container}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={({pressed}) => [{opacity: pressed ? 0.6 : 1}, styles.back]}>
            <Icon name="chevron-back" size={20} color={theme.colors.text} />
            <Text style={[styles.backText, {color: theme.colors.text}]}>
              Back
            </Text>
          </Pressable>

          <Text style={[styles.title, {color: theme.colors.text}]}>
            Sign in
          </Text>
          <Text style={[styles.subtitle, {color: theme.colors.textSecondary}]}>
            Welcome back. Let’s keep it clean.
          </Text>

          {error ? (
            <View
              style={[
                styles.error,
                {
                  backgroundColor: theme.colors.surface2,
                  borderColor: theme.colors.border,
                },
              ]}>
              <Icon
                name="alert-circle-outline"
                size={18}
                color={theme.colors.error}
              />
              <Text
                style={[styles.errorText, {color: theme.colors.textSecondary}]}>
                {error}
              </Text>
            </View>
          ) : null}

          <Card style={{marginTop: 16}}>
            <TextField
              label="Username"
              value={userName}
              onChangeText={setUserName}
              placeholder="yourname"
              autoFocus
              autoCapitalize="none"
              returnKeyType="next"
            />
            <TextField
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              secureTextEntry
              autoCapitalize="none"
              returnKeyType="go"
              onSubmitEditing={handleLogin}
              style={{marginTop: 12}}
            />

            <Button
              title="Continue"
              icon="log-in-outline"
              onPress={handleLogin}
              loading={isLoginLoading}
              disabled={isBusy || !userName.trim() || !password.trim()}
              style={{marginTop: 16}}
            />

            <Button
              title="Continue with Google"
              variant="secondary"
              icon="logo-google"
              onPress={handleGoogleLogin}
              loading={isGoogleLoading}
              disabled={isBusy}
              style={{marginTop: 12}}
            />

            <Button
              title="Create an account"
              variant="ghost"
              icon="person-add-outline"
              onPress={() => navigation.navigate('Register')}
              style={{marginTop: 10}}
            />
          </Card>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 24,
  },
  back: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 44,
    alignSelf: 'flex-start',
  },
  backText: {
    fontSize: 14,
    fontWeight: '800',
  },
  title: {
    marginTop: 6,
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.6,
  },
  subtitle: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: '700',
  },
  error: {
    marginTop: 14,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
  },
});
