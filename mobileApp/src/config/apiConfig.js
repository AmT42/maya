import { NativeModules, Platform } from 'react-native';

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

export const API_BASE_URL = devServerHost
  ? `http://${devServerHost}:8000`
  : platformDefault;
