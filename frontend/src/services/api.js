import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000',
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const register = (data) =>
  api.post('/api/v1/auth/register', data);

export const login = (username, password) => {
  const form = new URLSearchParams();
  form.append('username', username);
  form.append('password', password);
  return api.post('/api/v1/auth/login', form, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  });
};

export const uploadImage = (formData) =>
  api.post('/api/v1/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });

export const getInspections = () =>
  api.get('/api/v1/inspections');

export const getInspection = (id) =>
  api.get(`/api/v1/inspections/${id}`);

export const downloadReport = (id) =>
  api.get(`/api/v1/inspections/${id}/report`, { responseType: 'blob' });

export default api;
