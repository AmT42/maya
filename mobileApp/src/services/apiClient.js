import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL, getApiBaseUrl } from '../config/apiConfig';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

const refreshClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

apiClient.interceptors.request.use(async (config) => {
  config.baseURL = await getApiBaseUrl();
  const token = await AsyncStorage.getItem('access_token');
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

refreshClient.interceptors.request.use(async (config) => {
  config.baseURL = await getApiBaseUrl();
  return config;
});

apiClient.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;
    const status = error.response?.status;

    if (status !== 401 || originalRequest?._retry) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;
    try {
      const refreshToken = await AsyncStorage.getItem('refresh_token');
      if (!refreshToken) {
        return Promise.reject(error);
      }

      const refreshResponse = await refreshClient.post('/auth/refresh', {
        refresh_token: refreshToken,
      });

      await AsyncStorage.setItem('access_token', refreshResponse.data.access_token);
      await AsyncStorage.setItem('refresh_token', refreshResponse.data.refresh_token);

      originalRequest.headers = originalRequest.headers || {};
      originalRequest.headers.Authorization = `Bearer ${refreshResponse.data.access_token}`;
      return apiClient(originalRequest);
    } catch (refreshError) {
      await AsyncStorage.multiRemove(['access_token', 'refresh_token']);
      return Promise.reject(refreshError);
    }
  },
);

export default apiClient;
