import { useState } from 'react'
import { Input, Card, Row, Col, Button, Typography, Space, Tag, Empty, Spin } from 'antd'
import { SearchOutlined, EnvironmentOutlined, PlusOutlined, TeamOutlined } from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { clubsApi } from '@/api/clubs'
import type { Club } from '@/types'
import { useAuthStore } from '@/stores/authStore'
import KakaoClubMap from '@/components/club/KakaoClubMap'

const { Title, Text } = Typography

export default function ClubsPage() {
  const [search, setSearch] = useState('')
  const [selectedClubId, setSelectedClubId] = useState<number | null>(null)
  const navigate = useNavigate()
  const { isAuthenticated } = useAuthStore()

  const { data, isLoading } = useQuery({
    queryKey: ['clubs', search],
    queryFn: () => clubsApi.list(search ? { query: search } : undefined),
  })

  const clubs: Club[] = data?.data?.data || []

  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 24,
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <Title level={2} style={{ margin: 0 }}>
          클럽 찾기
        </Title>
        {isAuthenticated && (
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/clubs/new')}>
            클럽 만들기
          </Button>
        )}
      </div>

      <Input
        prefix={<SearchOutlined />}
        placeholder="클럽명 또는 체육관명으로 검색"
        size="large"
        style={{ marginBottom: 24 }}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        allowClear
      />

      {/* 카카오 지도 */}
      {!isLoading && clubs.length > 0 && (
        <KakaoClubMap
          clubs={clubs}
          onClubClick={(club) => setSelectedClubId(club.id)}
        />
      )}

      {/* 클럽 목록 */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: 48 }}>
          <Spin size="large" />
        </div>
      ) : clubs.length === 0 ? (
        <Empty
          image={<TeamOutlined style={{ fontSize: 64, color: '#d1d5db' }} />}
          description="검색 결과가 없습니다"
        />
      ) : (
        <Row gutter={[16, 16]}>
          {clubs.map((club) => (
            <Col key={club.id} xs={24} sm={12} lg={8}>
              <Card
                hoverable
                onClick={() => navigate(`/clubs/${club.id}`)}
                style={
                  selectedClubId === club.id
                    ? { borderColor: '#1677ff', boxShadow: '0 0 0 2px rgba(22,119,255,0.2)' }
                    : undefined
                }
                actions={[
                  <Button type="link" key="view" onClick={() => navigate(`/clubs/${club.id}`)}>
                    클럽 보기
                  </Button>,
                ]}
              >
                <Card.Meta
                  title={club.name}
                  description={
                    <Space direction="vertical" size="small" style={{ width: '100%' }}>
                      {club.gym_name && (
                        <Text>
                          <EnvironmentOutlined /> {club.gym_name}
                        </Text>
                      )}
                      {club.gym_address && (
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {club.gym_address}
                        </Text>
                      )}
                      <div style={{ marginTop: 4 }}>
                        {club.monthly_fee > 0 && (
                          <Tag color="blue">월 {club.monthly_fee.toLocaleString()}원</Tag>
                        )}
                      </div>
                    </Space>
                  }
                />
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </div>
  )
}
