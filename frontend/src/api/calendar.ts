import api from './index'

export const calendarApi = {
  listEvents: (clubId: number) => api.get(`/clubs/${clubId}/events`),
  createEvent: (
    clubId: number,
    data: {
      title: string
      start_dt: string
      end_dt?: string
      description?: string
      all_day?: number
      color?: string
      dday_label?: string
    }
  ) => api.post(`/clubs/${clubId}/events`, data),
  updateEvent: (clubId: number, eventId: number, data: Record<string, unknown>) =>
    api.put(`/clubs/${clubId}/events/${eventId}`, data),
  deleteEvent: (clubId: number, eventId: number) =>
    api.delete(`/clubs/${clubId}/events/${eventId}`),
}
