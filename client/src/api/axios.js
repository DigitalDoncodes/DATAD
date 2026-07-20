import axios from 'axios';
import { beginRequest, endRequest, isBackgroundRequest } from '../utils/inflight';

// Default to a relative /api base: in dev Vite proxies it to the server,
// and in production (or through an ngrok tunnel) the API is same-origin.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  const program = localStorage.getItem('activeProgram');
  if (program && program !== 'mba') config.headers['x-program'] = program;

  // Tag rather than re-deriving on the way out: the flag is what guarantees
  // every begin() is matched by exactly one end(), even if the URL is rewritten.
  if (!isBackgroundRequest(config.url, config.method)) {
    config.__trackInflight = true;
    beginRequest();
  }
  return config;
});

// Settle the counter on BOTH paths. A rejected request that never decremented
// would pin the count above zero and hold any waiting UI open indefinitely.
const settle = (config) => {
  if (config?.__trackInflight) {
    config.__trackInflight = false;
    endRequest();
  }
};

api.interceptors.response.use(
  (res) => {
    settle(res.config);
    return res;
  },
  (err) => {
    settle(err.config);
    if (err.response?.status === 401 && !err.config?.url?.includes('/auth/')) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
