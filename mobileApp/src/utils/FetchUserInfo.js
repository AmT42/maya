import apiClient from '../services/apiClient';

export const fetchUserInfo = async setUser => {
  const response = await apiClient.get('/users/me');
  setUser(response.data);
  return response.data;
};
