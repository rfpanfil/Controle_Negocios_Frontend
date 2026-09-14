import axios from 'axios';

const getBaseURL = () => {
  return import.meta.env.VITE_API_URL || 'http://localhost:8003';
};

export const baseURL = getBaseURL();

const api = axios.create({
  baseURL,
  withCredentials: true
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('cn_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('cn_token');
      localStorage.removeItem('cn_user');
      localStorage.removeItem('cn_perms');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
