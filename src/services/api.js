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

function convertUTC(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  for (const key of Object.keys(obj)) {
    if (typeof obj[key] === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?$/.test(obj[key])) {
      obj[key] += 'Z';
    } else if (typeof obj[key] === 'object') {
      convertUTC(obj[key]);
    }
  }
  return obj;
}

api.interceptors.response.use(
  (response) => {
    convertUTC(response.data);
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('cn_token');
      localStorage.removeItem('cn_user');
      localStorage.removeItem('cn_perms');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
