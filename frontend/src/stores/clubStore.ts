import { create } from 'zustand'
import type { Club, ClubMember } from '@/types'

interface ClubState {
  currentClub: Club | null
  currentMembership: ClubMember | null
  setCurrentClub: (club: Club | null) => void
  setCurrentMembership: (membership: ClubMember | null) => void
  isAdmin: () => boolean
  isMember: () => boolean
}

export const useClubStore = create<ClubState>((set, get) => ({
  currentClub: null,
  currentMembership: null,
  setCurrentClub: (club) => set({ currentClub: club }),
  setCurrentMembership: (membership) => set({ currentMembership: membership }),
  isAdmin: () => {
    const { currentMembership } = get()
    return currentMembership?.role === 'admin' && currentMembership?.status === 'approved'
  },
  isMember: () => {
    const { currentMembership } = get()
    return (
      currentMembership?.status === 'approved' &&
      (currentMembership?.role === 'admin' || currentMembership?.role === 'member')
    )
  },
}))
