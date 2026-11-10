import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

let csrfToken = '';
export function setCsrfToken(token: string) { csrfToken = token; }
api.interceptors.request.use((config) => {
  if (['post', 'put', 'patch', 'delete'].includes((config.method || 'get').toLowerCase()) && csrfToken) {
    config.headers.set('X-CSRF-Token', csrfToken);
  }
  return config;
});
