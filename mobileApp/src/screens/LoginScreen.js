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
import apiClient from '../services/apiClient';
import Screen from '../components/ui/Screen';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import TextField from '../components/ui/TextField';
import {useTheme} from '../theme/theme';
import {useUser} from '../contexts/UserContext';
import {fetchUserInfo} from '../utils/FetchUserInfo';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LoginScreen = ({navigation}) => {
  const theme = useTheme();
  const [userName, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const {setUser} = useUser();

  const handleLogin = async () => {
    setIsLoading(true);
    setError('');
    try {
      const formData = `username=${userName}&password=${password}`;
      // Base URL is configured in src/config/apiConfig.js
      const response = await apiClient.post('/login', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });
      await AsyncStorage.setItem('access_token', response.data.access_token);
      await AsyncStorage.setItem('refresh_token', response.data.refresh_token);

      await fetchUserInfo(setUser);
    } catch (e) {
      console.error('Error during login:', e.response?.data || e.message);
      setError('Incorrect username or password.');
    } finally {
      setIsLoading(false);
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
              loading={isLoading}
              disabled={!userName.trim() || !password.trim()}
              style={{marginTop: 16}}
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
