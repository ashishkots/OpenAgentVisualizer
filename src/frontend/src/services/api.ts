import axios from 'axios';

export const apiClient = axios.create({
  baseURL: '',
  headers: { 'Content-Type': 'application/json' },
});

// Inject auth token from localStorage on every request
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('oav_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Redirect to login on 401
apiClient.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('oav_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
