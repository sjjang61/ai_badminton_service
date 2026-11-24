import api from './index'
import type { Club, ClubFee } from '@/types'

export const clubsApi = {
  list: (params?: { lat?: number; lng?: number; radius?: number; query?: string }) =>
    api.get('/clubs', { params }),
  create: (data: Partial<Club>) => api.post('/clubs', data),
  get: (id: number) => api.get(`/clubs/${id}`),
  update: (id: number, data: Partial<Club>) => api.put(`/clubs/${id}`, data),
  delete: (id: number) => api.delete(`/clubs/${id}`),

  listFees: (clubId: number) => api.get(`/clubs/${clubId}/fees`),
  createFee: (clubId: number, data: Partial<ClubFee> & { fee_month: string }) =>
    api.post(`/clubs/${clubId}/fees`, data),
  updateFee: (clubId: number, feeId: number, data: Partial<ClubFee>) =>
    api.put(`/clubs/${clubId}/fees/${feeId}`, data),
  deleteFee: (clubId: number, feeId: number) => api.delete(`/clubs/${clubId}/fees/${feeId}`),
}
