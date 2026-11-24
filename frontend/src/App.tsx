import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import MainLayout from '@/components/common/MainLayout'
import LoginRequired from '@/components/common/LoginRequired'
import LandingPage from '@/pages/LandingPage'
import LoginPage from '@/pages/auth/LoginPage'
import CallbackPage from '@/pages/auth/CallbackPage'
import RegisterPage from '@/pages/auth/RegisterPage'
import ClubsPage from '@/pages/clubs/ClubsPage'
import ClubNewPage from '@/pages/clubs/ClubNewPage'
import ClubEditPage from '@/pages/clubs/ClubEditPage'
import ClubHomePage from '@/pages/clubs/ClubHomePage'
import MembersPage from '@/pages/clubs/MembersPage'
import FeesPage from '@/pages/clubs/FeesPage'
import TournamentsPage from '@/pages/tournaments/TournamentsPage'
import TournamentNewPage from '@/pages/tournaments/TournamentNewPage'
import TournamentDetailPage from '@/pages/tournaments/TournamentDetailPage'
import NoticesPage from '@/pages/notices/NoticesPage'
import GalleryPage from '@/pages/gallery/GalleryPage'
import CalendarPage from '@/pages/calendar/CalendarPage'
import ProfilePage from '@/pages/ProfilePage'
import MyClubsPage from '@/pages/MyClubsPage'
import AdminPage from '@/pages/admin/AdminPage'

/** 로그인 사용자만 접근 — 게스트·비로그인 모두 로그인 페이지로 이동 */
function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore()
  return isAuthenticated ? <>{children}</> : <Navigate to="/auth/login" replace />
}

/** 로그인 사용자만 접근 — 게스트는 로그인 안내 화면 표시, 비로그인은 로그인 페이지로 이동 */
function MemberRoute({ children, message }: { children: React.ReactNode; message?: string }) {
  const { isAuthenticated, isGuest } = useAuthStore()
  if (isAuthenticated) return <>{children}</>
  if (isGuest) return <LoginRequired message={message} />
  return <Navigate to="/auth/login" replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/auth/login" element={<LoginPage />} />
      <Route path="/auth/callback/:provider" element={<CallbackPage />} />
      <Route path="/register" element={<PrivateRoute><RegisterPage /></PrivateRoute>} />
      <Route element={<MainLayout />}>

        {/* ── 공개: 게스트도 접근 가능 ── */}
        <Route path="/clubs" element={<ClubsPage />} />
        <Route path="/clubs/:clubId" element={<ClubHomePage />} />
        <Route path="/clubs/:clubId/tournaments" element={<TournamentsPage />} />

        {/* ── 회원 전용: 게스트는 로그인 안내 화면 ── */}
        <Route
          path="/clubs/:clubId/tournaments/:tId"
          element={
            <MemberRoute message="대회 상세 및 대진표는 클럽 회원만 볼 수 있습니다.">
              <TournamentDetailPage />
            </MemberRoute>
          }
        />
        <Route
          path="/clubs/:clubId/notices"
          element={
            <MemberRoute message="공지사항은 클럽 회원만 볼 수 있습니다.">
              <NoticesPage />
            </MemberRoute>
          }
        />
        <Route
          path="/clubs/:clubId/gallery"
          element={
            <MemberRoute message="갤러리는 클럽 회원만 이용할 수 있습니다.">
              <GalleryPage />
            </MemberRoute>
          }
        />
        <Route
          path="/clubs/:clubId/calendar"
          element={
            <MemberRoute message="클럽 달력은 클럽 회원만 볼 수 있습니다.">
              <CalendarPage />
            </MemberRoute>
          }
        />

        {/* ── 로그인 전용: 게스트도 로그인 페이지로 이동 ── */}
        <Route path="/clubs/new" element={<PrivateRoute><ClubNewPage /></PrivateRoute>} />
        <Route path="/clubs/:clubId/edit" element={<PrivateRoute><ClubEditPage /></PrivateRoute>} />
        <Route path="/clubs/:clubId/members" element={<PrivateRoute><MembersPage /></PrivateRoute>} />
        <Route path="/clubs/:clubId/fees" element={<PrivateRoute><FeesPage /></PrivateRoute>} />
        <Route path="/clubs/:clubId/tournaments/new" element={<PrivateRoute><TournamentNewPage /></PrivateRoute>} />
        <Route path="/profile" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
        <Route path="/my-clubs" element={<PrivateRoute><MyClubsPage /></PrivateRoute>} />
        <Route path="/admin" element={<PrivateRoute><AdminPage /></PrivateRoute>} />

      </Route>
    </Routes>
  )
}
