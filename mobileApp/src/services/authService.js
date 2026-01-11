import AsyncStorage from '@react-native-async-storage/async-storage';
import {GoogleSignin, statusCodes} from '@react-native-google-signin/google-signin';
import apiClient from './apiClient';
import {fetchUserInfo} from '../utils/FetchUserInfo';

const storeTokens = async ({accessToken, refreshToken}) => {
  await AsyncStorage.setItem('access_token', accessToken);
  await AsyncStorage.setItem('refresh_token', refreshToken);
};

export const loginWithPassword = async ({username, password, setUser}) => {
  const formBody = `username=${encodeURIComponent(
    username,
  )}&password=${encodeURIComponent(password)}`;

  const response = await apiClient.post('/login', formBody, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });

  await storeTokens({
    accessToken: response.data.access_token,
    refreshToken: response.data.refresh_token,
  });

  return fetchUserInfo(setUser);
};

export const loginWithGoogle = async ({setUser}) => {
  try {
    await GoogleSignin.signIn();
    const {idToken} = await GoogleSignin.getTokens();
    if (!idToken) {
      throw new Error('Missing Google idToken');
    }

    const response = await apiClient.post('/auth/google', {id_token: idToken});

    await storeTokens({
      accessToken: response.data.access_token,
      refreshToken: response.data.refresh_token,
    });

    return fetchUserInfo(setUser);
  } catch (e) {
    if (e?.code === statusCodes.SIGN_IN_CANCELLED) {
      return null;
    }
    throw e;
  }
};

export const logout = async ({setUser}) => {
  try {
    await apiClient.post('/auth/logout');
  } catch (e) {
    // Ignore network/auth errors.
  }

  try {
    await GoogleSignin.signOut();
  } catch (e) {
    // Ignore if Google wasn't used.
  }

  await AsyncStorage.multiRemove(['access_token', 'refresh_token']);
  setUser(null);
};
