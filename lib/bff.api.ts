import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  timeout: 280_000,
  paramsSerializer: { indexes: null },
});

export default api;
