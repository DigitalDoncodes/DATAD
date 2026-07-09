import api from './axios';

export const register = (data) => api.post('/auth/register', data);
export const login = (data) => api.post('/auth/login', data);
export const getMe = () => api.get('/auth/me');
export const changePassword = (data) => api.put('/auth/password', data);
export const deleteAccount = (password) => api.delete('/auth/me', { data: { password } });
