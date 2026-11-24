export interface User {
  id: number
  provider: 'kakao' | 'naver' | 'google'
  email?: string
  nickname: string
  profile_img?: string
  role: 'user' | 'service_admin'
}

export interface Club {
  id: number
  name: string
  description?: string
  gym_name?: string
  gym_address?: string
  latitude?: number
  longitude?: number
  has_joining_fee: number
  joining_fee: number
  yearly_fee: number
  monthly_fee: number
  guest_fee: number
  owner_id: number
  created_at: string
}

export interface ClubMember {
  id: number
  club_id: number
  user_id: number
  role: 'admin' | 'member' | 'guest'
  status: 'pending' | 'approved' | 'rejected' | 'banned'
  joined_at?: string
  created_at: string
}

export interface ClubFee {
  id: number
  club_id: number
  user_id: number
  amount: number
  fee_month: string
  paid_at?: string
  memo?: string
  created_by: number
  created_at: string
}

export interface Tournament {
  id: number
  club_id?: number
  name: string
  type: 'internal' | 'external'
  match_type: 'singles' | 'doubles' | 'mixed'
  format: 'round_robin' | 'single_elimination' | 'double_elimination'
  start_date?: string
  end_date?: string
  location?: string
  description?: string
  status: 'draft' | 'ongoing' | 'finished'
  created_by: number
  created_at: string
}

export interface TournamentParticipant {
  id: number
  tournament_id: number
  user_id?: number
  player_name: string
  partner_name?: string
  wins: number
  losses: number
  points_won: number
  points_lost: number
}

export interface TournamentMatch {
  id: number
  tournament_id: number
  round: number
  match_number: number
  player1_id: number
  player2_id: number
  score_player1?: number
  score_player2?: number
  winner_id?: number
  status: 'pending' | 'ongoing' | 'finished'
  scheduled_at?: string
  played_at?: string
}

export interface Notice {
  id: number
  club_id?: number
  title: string
  content: string
  is_pinned: number
  scope: 'global' | 'club'
  created_by: number
  created_at: string
  updated_at?: string
}

export interface GalleryPhoto {
  id: number
  club_id: number
  uploader_id: number
  file_name: string
  file_url: string
  file_size?: number
  sort_order: number
  created_at: string
}

export interface GalleryVideo {
  id: number
  club_id: number
  title?: string
  video_url?: string
  bgm_name?: string
  bgm_url?: string
  photo_ids?: number[]
  transition?: string
  duration?: number
  status: 'pending' | 'processing' | 'done' | 'failed'
  created_by: number
  created_at: string
}

export interface CalendarEvent {
  id: number
  club_id?: number
  user_id: number
  title: string
  description?: string
  start_dt: string
  end_dt?: string
  all_day: number
  color?: string
  dday_label?: string
  is_public: number
  created_at: string
}

export interface ApiResponse<T> {
  success: boolean
  data: T
  message: string
}

export interface PaginatedResponse<T> {
  success: boolean
  data: T[]
  message: string
  pagination: {
    page: number
    size: number
    total: number
  }
}

export interface BGMItem {
  name: string
  url: string
  duration?: number
}

export interface Standing {
  participant_id: number
  player_name: string
  wins: number
  losses: number
  points_won: number
  points_lost: number
  point_diff: number
}
