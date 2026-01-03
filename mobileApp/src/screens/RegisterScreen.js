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
import AsyncStorage from '@react-native-async-storage/async-storage';
import {fetchUserInfo} from '../utils/FetchUserInfo';
import {useUser} from '../contexts/UserContext';
import Screen from '../components/ui/Screen';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import TextField from '../components/ui/TextField';
import {useTheme} from '../theme/theme';

const RegisterScreen = ({navigation}) => {
  const theme = useTheme();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const {setUser} = useUser();

  const handleRegister = async () => {
    setIsLoading(true);
    setError('');

    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      setIsLoading(false);
      return;
    }

    try {
      const formData = `username=${username}&email=${email}&password=${password}`;

      const response = await apiClient.post('/register', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });
      await AsyncStorage.setItem('access_token', response.data.access_token);
      await AsyncStorage.setItem('refresh_token', response.data.refresh_token);

      await fetchUserInfo(setUser);
    } catch (e) {
      console.error('Registration Error: ', e.response?.data || e.message);
      setError('Could not create account. Try another username/email.');
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
            Create account
          </Text>
          <Text style={[styles.subtitle, {color: theme.colors.textSecondary}]}>
            A clean library starts here.
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
              value={username}
              onChangeText={setUsername}
              placeholder="yourname"
              autoCapitalize="none"
              returnKeyType="next"
            />
            <TextField
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="you@company.com"
              keyboardType="email-address"
              autoCapitalize="none"
              returnKeyType="next"
              style={{marginTop: 12}}
            />
            <TextField
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              secureTextEntry
              autoCapitalize="none"
              returnKeyType="next"
              style={{marginTop: 12}}
            />
            <TextField
              label="Confirm password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="••••••••"
              secureTextEntry
              autoCapitalize="none"
              returnKeyType="go"
              onSubmitEditing={handleRegister}
              style={{marginTop: 12}}
            />

            <Button
              title="Create"
              icon="person-add-outline"
              onPress={handleRegister}
              loading={isLoading}
              disabled={
                !username.trim() ||
                !email.trim() ||
                !password.trim() ||
                !confirmPassword.trim()
              }
              style={{marginTop: 16}}
            />

            <Button
              title="I already have an account"
              variant="ghost"
              icon="log-in-outline"
              onPress={() => navigation.navigate('Login')}
              style={{marginTop: 10}}
            />
          </Card>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
};

export default RegisterScreen;

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
