import api from './index'
import type { User } from '@/types'

export const authApi = {
  getAuthUrl: (provider: string) => api.get(`/auth/${provider}`),
  getMe: () => api.get<User>('/auth/me'),
  getMyClubs: () => api.get('/auth/me/clubs'),
  updateMe: (nickname: string) => api.patch<User>('/auth/me', { nickname }),
  refresh: (refreshToken: string) => api.post('/auth/refresh', { refresh_token: refreshToken }),
  logout: () => api.post('/auth/logout'),
}
