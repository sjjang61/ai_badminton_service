import api from './index'

export const membersApi = {
  list: (clubId: number) => api.get(`/clubs/${clubId}/members`),
  join: (clubId: number) => api.post(`/clubs/${clubId}/members/join`),
  approve: (clubId: number, memberId: number) =>
    api.put(`/clubs/${clubId}/members/${memberId}/approve`),
  reject: (clubId: number, memberId: number) =>
    api.put(`/clubs/${clubId}/members/${memberId}/reject`),
  updateRole: (clubId: number, memberId: number, role: string) =>
    api.put(`/clubs/${clubId}/members/${memberId}/role`, { role }),
  remove: (clubId: number, memberId: number) =>
    api.delete(`/clubs/${clubId}/members/${memberId}`),
}
