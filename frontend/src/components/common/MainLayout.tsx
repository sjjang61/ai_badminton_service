import { Outlet, Link, useNavigate, useMatch, useParams } from 'react-router-dom'
import { Layout, Menu, Button, Avatar, Dropdown, Tag, Breadcrumb } from 'antd'
import { UserOutlined, LogoutOutlined, EyeOutlined, TeamOutlined, ArrowLeftOutlined } from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/authStore'
import { clubsApi } from '@/api/clubs'

const { Header, Content, Footer } = Layout

/** 클럽 서브페이지 감지 → 클럽 홈 링크 표시 */
function ClubBreadcrumb() {
  // /clubs/:clubId 하위 경로에서만 표시 (클럽 홈 자체는 제외)
  const subMatch = useMatch('/clubs/:clubId/*')
  const { clubId } = useParams<{ clubId: string }>()
  const id = Number(subMatch?.params.clubId ?? clubId)

  // 클럽 홈(/clubs/:clubId) 자체에서는 표시하지 않음
  const homeMatch = useMatch('/clubs/:clubId')
  if (!subMatch || homeMatch || !id) return null

  // 경로 → 한글 레이블 매핑
  const splat = subMatch.params['*'] ?? ''
  const labelMap: Record<string, string> = {
    members:     '회원 관리',
    fees:        '회비 관리',
    tournaments: '대회',
    notices:     '공지사항',
    gallery:     '갤러리',
    calendar:    '달력',
    edit:        '클럽 수정',
  }
  const topSegment = splat.split('/')[0]
  const pageLabel = labelMap[topSegment] ?? topSegment

  return (
    <ClubBreadcrumbContent clubId={id} pageLabel={pageLabel} />
  )
}

function ClubBreadcrumbContent({ clubId, pageLabel }: { clubId: number; pageLabel: string }) {
  const { data } = useQuery({
    queryKey: ['club', clubId],
    queryFn: () => clubsApi.get(clubId),
    staleTime: 1000 * 60 * 5,
  })
  const clubName = data?.data?.data?.name ?? '클럽'

  return (
    <div
      style={{
        background: '#f5f5f5',
        borderBottom: '1px solid #e8e8e8',
        padding: '8px 24px',
      }}
    >
      <Breadcrumb
        items={[
          {
            title: (
              <Link to={`/clubs/${clubId}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <ArrowLeftOutlined style={{ fontSize: 12 }} />
                {clubName}
              </Link>
            ),
          },
          { title: pageLabel },
        ]}
      />
    </div>
  )
}

export default function MainLayout() {
  const { isAuthenticated, isGuest, user, logout } = useAuthStore()
  const navigate = useNavigate()

  const userMenuItems = [
    { key: 'profile', label: '내 프로필', icon: <UserOutlined /> },
    { key: 'my-clubs', label: '내 클럽', icon: <TeamOutlined /> },
    { type: 'divider' as const },
    { key: 'logout', label: '로그아웃', icon: <LogoutOutlined />, danger: true },
  ]

  const handleUserMenuClick = ({ key }: { key: string }) => {
    if (key === 'logout') {
      logout()
      navigate('/')
    } else if (key === 'profile') {
      navigate('/profile')
    } else if (key === 'my-clubs') {
      navigate('/my-clubs')
    }
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header className="flex items-center justify-between px-6 sticky top-0 z-50">
        <div className="flex items-center gap-6">
          <Link to="/" className="text-white text-xl font-bold no-underline">
            모두의 배민
          </Link>
          <Menu
            theme="dark"
            mode="horizontal"
            items={[
              { key: '/clubs', label: <Link to="/clubs">클럽 찾기</Link> },
            ]}
            style={{ background: 'transparent', border: 'none' }}
          />
        </div>
        <div className="flex items-center gap-3">
          {isAuthenticated && user ? (
            <Dropdown menu={{ items: userMenuItems, onClick: handleUserMenuClick }}>
              <div className="flex items-center gap-2 cursor-pointer text-white">
                <Avatar src={user.profile_img} icon={<UserOutlined />} />
                <span>{user.nickname}</span>
              </div>
            </Dropdown>
          ) : isGuest ? (
            <>
              <Tag icon={<EyeOutlined />} color="default" style={{ margin: 0 }}>
                게스트 모드
              </Tag>
              <Button type="primary" size="small" onClick={() => navigate('/auth/login')}>
                로그인하기
              </Button>
            </>
          ) : (
            <Button type="primary" onClick={() => navigate('/auth/login')}>
              로그인
            </Button>
          )}
        </div>
      </Header>

      <ClubBreadcrumb />

      <Content className="container mx-auto px-4 py-6 max-w-7xl">
        <Outlet />
      </Content>
      <Footer className="text-center text-gray-500">
        모두의 배민 (All for Badminton) &copy;2024
      </Footer>
    </Layout>
  )
}
