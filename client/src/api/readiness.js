import api from './axios';

export const getReadiness = () => api.get('/readiness');
