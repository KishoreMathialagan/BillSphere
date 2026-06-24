import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://billsphere-backend.onrender.com/api/v1',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) throw new Error('No refresh token');
        
        const API_URL = import.meta.env.VITE_API_URL || 'https://billsphere-backend.onrender.com/api/v1';
        const res = await axios.post(`${API_URL}/auth/refresh`, {
          refresh_token: refreshToken
        });
        
        const { access_token, refresh_token: new_refresh } = res.data;
        localStorage.setItem('access_token', access_token);
        localStorage.setItem('refresh_token', new_refresh);
        
        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        return axios(originalRequest);
      } catch (err) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
        return Promise.reject(err);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
