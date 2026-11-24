import { useQuery } from '@tanstack/react-query'
import { Card, Row, Col, Statistic, Typography, Table, Spin, Alert } from 'antd'
import { TeamOutlined, UserOutlined, TrophyOutlined, FileTextOutlined } from '@ant-design/icons'
import api from '@/api'
import { useAuthStore } from '@/stores/authStore'
import { useNavigate } from 'react-router-dom'
import { useEffect } from 'react'

const { Title } = Typography

export default function AdminPage() {
  const { user } = useAuthStore()
  const navigate = useNavigate()

  // 서비스 관리자 체크
  useEffect(() => {
    if (user && user.role !== 'service_admin') {
      navigate('/')
    }
  }, [user, navigate])

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => api.get('/admin/stats'),
    enabled: user?.role === 'service_admin',
  })

  const stats = data?.data?.data || {}

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spin size="large" />
      </div>
    )
  }

  if (isError) {
    return (
      <Alert
        message="데이터를 불러올 수 없습니다"
        description="서비스 관리자 권한이 필요합니다."
        type="error"
        className="mt-8"
      />
    )
  }

  const statCards = [
    {
      title: '전체 사용자',
      value: stats.total_users ?? 0,
      icon: <UserOutlined className="text-blue-500" />,
    },
    {
      title: '전체 클럽',
      value: stats.total_clubs ?? 0,
      icon: <TeamOutlined className="text-green-500" />,
    },
  ]

  return (
    <div>
      <Title level={2}>서비스 관리</Title>

      <Row gutter={[16, 16]} className="mb-8">
        {statCards.map((s) => (
          <Col key={s.title} xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title={s.title}
                value={s.value}
                prefix={s.icon}
              />
            </Card>
          </Col>
        ))}
      </Row>

      <Card title="서비스 정보" className="mb-4">
        <p>서비스명: 모두의 배민 (All for Badminton)</p>
        <p>버전: 1.0.0</p>
      </Card>
    </div>
  )
}
