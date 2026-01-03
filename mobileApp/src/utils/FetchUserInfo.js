import apiClient from '../services/apiClient';

export const fetchUserInfo = async setUser => {
  try {
    const response = await apiClient.get('/users/me');

    setUser(response.data); // Set user data in global context

    return response.data;
  } catch (error) {
    console.error('Error fetching user info:', error);
    // Handle error accordingly
  }
};
