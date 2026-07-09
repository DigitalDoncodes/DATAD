import api from './axios';

export const listArticles = (category) => api.get('/intelligence', { params: { category } });
export const listBookmarked = () => api.get('/intelligence/bookmarks');
export const toggleBookmark = (id) => api.post(`/intelligence/${id}/bookmark`);
export const setInterests = (interests) => api.put('/intelligence/interests', { interests });

export const getMarket = () => api.get('/intelligence/market');
export const setMarket = (indicators) => api.put('/intelligence/market', { indicators });

export const createArticle = (data) => api.post('/intelligence', data);
export const updateArticle = (id, data) => api.put(`/intelligence/${id}`, data);
export const deleteArticle = (id) => api.delete(`/intelligence/${id}`);
