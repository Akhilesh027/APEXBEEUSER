import axios from 'axios';

const generateUUID = (): string => {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.randomUUID) {
    return window.crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export const api = axios.create({
  baseURL: (import.meta.env.VITE_API_URL || 'http://localhost:5500/api') as string,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to inject Request ID and Auth Token
api.interceptors.request.use(
  (config) => {
    config.headers['x-request-id'] = generateUUID();

    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
