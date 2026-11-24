import api from './index'

export const galleryApi = {
  listPhotos: (clubId: number) => api.get(`/clubs/${clubId}/photos`),
  uploadPhoto: (clubId: number, file: File) => {
    const form = new FormData()
    form.append('file', file)
    return api.post(`/clubs/${clubId}/photos`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  deletePhoto: (clubId: number, photoId: number) =>
    api.delete(`/clubs/${clubId}/photos/${photoId}`),

  generateVideo: (
    clubId: number,
    data: {
      title?: string
      photo_ids: number[]
      bgm_name?: string
      bgm_url?: string
      transition?: string
    }
  ) => api.post(`/clubs/${clubId}/videos/generate`, data),
  listVideos: (clubId: number) => api.get(`/clubs/${clubId}/videos`),
  getVideo: (clubId: number, videoId: number) =>
    api.get(`/clubs/${clubId}/videos/${videoId}`),
  listBGM: () => api.get('/bgm/list'),
}
