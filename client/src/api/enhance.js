import api from './axios';

export function enhance(page, action, data = {}) {
  return api.post('/enhance', { page, action, data });
}
