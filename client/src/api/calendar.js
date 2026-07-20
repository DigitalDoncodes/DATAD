import api from './axios';

export function getHolidays(year, country = 'IN') {
  return api.get('/api/calendar/holidays', { params: { year, country } });
}

export function getEvents(year, month) {
  return api.get('/api/calendar/events', { params: { year, month } });
}

export function createEvent(data) {
  return api.post('/api/calendar/events', data);
}

export function updateEvent(id, data) {
  return api.put(`/api/calendar/events/${id}`, data);
}

export function deleteEvent(id) {
  return api.delete(`/api/calendar/events/${id}`);
}
