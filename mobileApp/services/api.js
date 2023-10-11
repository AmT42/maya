// import axios from 'axios';

// const apiInstance = axios.create({
//   baseURL: 'http://10.0.2.2:8000',
// });

// apiInstance.interceptors.request.use((config) => {
//   const token = /* Retrieve token from secure storage or state */;
//   if (token) {
//     config.headers.Authorization = `Bearer ${token}`;
//   }
//   return config;
// });

// apiInstance.interceptors.response.use(
//   (response) => response,
//   async (error) => {
//     if (error.response.status === 401 && error.config.url !== '/login' && error.config.url !== '/token/refresh') {
//       try {
//         const refreshToken = /* Retrieve refresh token from secure storage or state */;
//         const refreshResponse = await axios.post('http://10.0.2.2:8000/token/refresh', {
//           refresh_token: refreshToken,
//         });
//         const newAccessToken = refreshResponse.data.access_token;
        
//         // Store the new access token securely
//         /* Update token in secure storage or state */

//         // Retry the original request with the new token
//         error.config.headers['Authorization'] = `Bearer ${newAccessToken}`;
//         return apiInstance(error.config);
//       } catch (refreshError) {
//         // Handle token refresh failure
//         /* Redirect to login or handle appropriately */
//       }
//     }
//     return Promise.reject(error);
//   }
// );

// export default apiInstance;