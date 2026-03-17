import axios from 'axios';
import { API_BASE_URL } from './config';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Auth interceptor - add Firebase token to requests
apiClient.interceptors.request.use(async (config) => {
  if (typeof window !== 'undefined') {
    try {
      const token = localStorage.getItem('firebaseToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting auth token', error);
    }
  }
  return config;
});

export default apiClient;
