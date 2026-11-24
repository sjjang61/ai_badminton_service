import api from './index'
import type { Tournament, TournamentParticipant } from '@/types'

export const tournamentsApi = {
  list: (clubId: number) => api.get(`/clubs/${clubId}/tournaments`),
  create: (clubId: number, data: Partial<Tournament>) =>
    api.post(`/clubs/${clubId}/tournaments`, data),
  get: (clubId: number, tId: number) => api.get(`/clubs/${clubId}/tournaments/${tId}`),
  update: (clubId: number, tId: number, data: Partial<Tournament>) =>
    api.put(`/clubs/${clubId}/tournaments/${tId}`, data),
  delete: (clubId: number, tId: number) => api.delete(`/clubs/${clubId}/tournaments/${tId}`),

  listParticipants: (tId: number) => api.get(`/tournaments/${tId}/participants`),
  addParticipant: (tId: number, data: Partial<TournamentParticipant>) =>
    api.post(`/tournaments/${tId}/participants`, data),
  removeParticipant: (tId: number, pId: number) =>
    api.delete(`/tournaments/${tId}/participants/${pId}`),

  getBracket: (tId: number) => api.get(`/tournaments/${tId}/bracket`),
  generateBracket: (tId: number) => api.post(`/tournaments/${tId}/bracket/generate`),
  updateScore: (
    tId: number,
    mId: number,
    score: { score_player1: number; score_player2: number }
  ) => api.put(`/tournaments/${tId}/matches/${mId}/score`, score),
  getStandings: (tId: number) => api.get(`/tournaments/${tId}/standings`),
}
