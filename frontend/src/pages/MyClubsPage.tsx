import { useQuery } from '@tanstack/react-query'
import { Card, Typography, List, Tag, Button, Empty, Spin } from 'antd'
import { useNavigate } from 'react-router-dom'
import { authApi } from '@/api/auth'
import { useAuthStore } from '@/stores/authStore'
import type { Club } from '@/types'

const { Title, Text } = Typography

export default function MyClubsPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()

  const { data, isLoading } = useQuery({
    queryKey: ['my-clubs'],
    queryFn: () => authApi.getMyClubs(),
  })

  const clubs: Club[] = data?.data?.data ?? []

  if (isLoading) {
    return <div style={{ textAlign: 'center', padding: 48 }}><Spin size="large" /></div>
  }

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>내 클럽</Title>
        <Button type="primary" onClick={() => navigate('/clubs/new')}>
          클럽 만들기
        </Button>
      </div>

      {clubs.length === 0 ? (
        <Card>
          <Empty
            description="가입한 클럽이 없습니다."
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            <Button type="primary" onClick={() => navigate('/clubs')}>
              클럽 찾기
            </Button>
          </Empty>
        </Card>
      ) : (
        <List
          dataSource={clubs}
          renderItem={(club) => {
            const isOwner = club.owner_id === user?.id
            return (
              <Card
                key={club.id}
                style={{ marginBottom: 12, cursor: 'pointer' }}
                hoverable
                onClick={() => navigate(`/clubs/${club.id}`)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <Text strong style={{ fontSize: 16 }}>{club.name}</Text>
                      {isOwner && <Tag color="blue">관리자</Tag>}
                    </div>
                    {club.gym_name && (
                      <Text type="secondary" style={{ fontSize: 13 }}>
                        📍 {club.gym_name}
                      </Text>
                    )}
                    {club.gym_address && (
                      <div>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {club.gym_address}
                        </Text>
                      </div>
                    )}
                    <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {club.monthly_fee > 0 && (
                        <Tag>월회비 {club.monthly_fee.toLocaleString()}원</Tag>
                      )}
                      {club.yearly_fee > 0 && (
                        <Tag>년회비 {club.yearly_fee.toLocaleString()}원</Tag>
                      )}
                      {club.guest_fee > 0 && (
                        <Tag>게스트비 {club.guest_fee.toLocaleString()}원</Tag>
                      )}
                    </div>
                  </div>
                  <Button
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation()
                      navigate(`/clubs/${club.id}`)
                    }}
                  >
                    바로가기
                  </Button>
                </div>
              </Card>
            )
          }}
        />
      )}
    </div>
  )
}
