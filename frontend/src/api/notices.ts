import api from './index'

export const noticesApi = {
  listGlobal: () => api.get('/notices'),
  createGlobal: (data: { title: string; content: string; is_pinned?: number }) =>
    api.post('/notices', data),
  listClub: (clubId: number) => api.get(`/clubs/${clubId}/notices`),
  createClub: (
    clubId: number,
    data: { title: string; content: string; is_pinned?: number }
  ) => api.post(`/clubs/${clubId}/notices`, data),
  update: (
    clubId: number,
    nId: number,
    data: Partial<{ title: string; content: string; is_pinned: number }>
  ) => api.put(`/clubs/${clubId}/notices/${nId}`, data),
  delete: (clubId: number, nId: number) => api.delete(`/clubs/${clubId}/notices/${nId}`),
}
