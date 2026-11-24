import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@/types'

interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  isGuest: boolean
  setTokens: (accessToken: string, refreshToken: string) => void
  setUser: (user: User) => void
  enterAsGuest: () => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isGuest: false,
      setTokens: (accessToken, refreshToken) =>
        set({ accessToken, refreshToken, isAuthenticated: true, isGuest: false }),
      setUser: (user) => set({ user }),
      enterAsGuest: () =>
        set({ isGuest: true, isAuthenticated: false, user: null, accessToken: null, refreshToken: null }),
      logout: () =>
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false, isGuest: false }),
    }),
    { name: 'afb-auth' }
  )
)
