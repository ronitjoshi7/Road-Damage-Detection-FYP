import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000',
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const uploadImage = (formData) =>
  api.post('/detections/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });

export const getDetections = () => api.get('/detections');
export const login = (data) => api.post('/auth/login', data);

export default api;