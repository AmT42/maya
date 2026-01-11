import { NativeModules, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const getDevServerHost = () => {
  const scriptURL = NativeModules?.SourceCode?.scriptURL;
  if (!scriptURL) {
    return null;
  }
  const match = scriptURL.match(/\/\/([^/:]+)/);
  return match?.[1] ?? null;
};

const devServerHost = getDevServerHost();

const platformDefault = Platform.select({
  ios: 'http://localhost:8000',
  android: 'http://10.0.2.2:8000',
  default: 'http://localhost:8000',
});

export const INFERRED_API_BASE_URL = devServerHost
  ? `http://${devServerHost}:8000`
  : platformDefault;

export const API_BASE_URL_STORAGE_KEY = 'api_base_url';

let cachedApiBaseUrl = null;
let pendingLoad = null;

export const getApiBaseUrl = async () => {
  if (cachedApiBaseUrl) {
    return cachedApiBaseUrl;
  }
  if (pendingLoad) {
    return pendingLoad;
  }

  pendingLoad = AsyncStorage.getItem(API_BASE_URL_STORAGE_KEY).then((stored) => {
    cachedApiBaseUrl = stored || INFERRED_API_BASE_URL;
    pendingLoad = null;
    return cachedApiBaseUrl;
  });
  return pendingLoad;
};

export const getCachedApiBaseUrl = () => {
  return cachedApiBaseUrl || INFERRED_API_BASE_URL;
};

export const setApiBaseUrl = async (baseUrl) => {
  const trimmed = (baseUrl || '').trim();
  if (!trimmed) {
    await AsyncStorage.removeItem(API_BASE_URL_STORAGE_KEY);
    cachedApiBaseUrl = INFERRED_API_BASE_URL;
    return cachedApiBaseUrl;
  }
  await AsyncStorage.setItem(API_BASE_URL_STORAGE_KEY, trimmed);
  cachedApiBaseUrl = trimmed;
  return cachedApiBaseUrl;
};

// Backward-compat for existing imports.
export const API_BASE_URL = INFERRED_API_BASE_URL;
