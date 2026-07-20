import api from './axios';

export function searchAll(query, includeCommands = true) {
  return api.post('/search', { query, commands: includeCommands });
}

export function getSearchProviders() {
  return api.get('/search/providers');
}

export function searchStream(query, { includeCommands = true, limit } = {}) {
  return api.post('/search/stream', { query, commands: includeCommands, limit }, {
    responseType: 'stream',
    adapter: 'fetch',
  });
}

export function parseIntent(query) {
  return api.post('/search/intent', { query });
}

export function recordClick(query, resultId, category) {
  return api.post('/search/analytics/click', { query, resultId, category });
}

export function getRecentSearches() {
  return api.get('/search/analytics/recents');
}

export function getFrequentSearches() {
  return api.get('/search/analytics/frequent');
}

export function togglePin(item) {
  return api.post('/search/pin', item);
}

export function getPinned() {
  return api.get('/search/pinned');
}
