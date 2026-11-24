import { useQuery } from '@tanstack/react-query'
import { Card, Avatar, Typography, Divider, Tag, Button, Descriptions, Spin } from 'antd'
import { UserOutlined, LogoutOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { authApi } from '@/api/auth'

const { Title, Text } = Typography

const PROVIDER_LABEL: Record<string, string> = {
  kakao: '카카오',
  naver: '네이버',
  google: '구글',
}

export default function ProfilePage() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const { data, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: () => authApi.getMe(),
    enabled: !!user,
  })

  const profile = data?.data?.data || user

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spin size="large" />
      </div>
    )
  }

  if (!profile) return null

  const handleLogout = async () => {
    try {
      await authApi.logout()
    } catch {
      // ignore
    }
    logout()
    navigate('/')
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Title level={2}>내 프로필</Title>

      <Card>
        <div className="flex items-center gap-6 mb-6">
          <Avatar size={80} src={profile.profile_img} icon={<UserOutlined />} />
          <div>
            <Title level={3} className="!mb-1">{profile.nickname}</Title>
            <Text type="secondary">{profile.email || '이메일 없음'}</Text>
            <div className="mt-2 flex gap-2">
              <Tag color={profile.role === 'service_admin' ? 'red' : 'blue'}>
                {profile.role === 'service_admin' ? '서비스 관리자' : '일반 사용자'}
              </Tag>
              <Tag>{PROVIDER_LABEL[profile.provider] || profile.provider} 로그인</Tag>
            </div>
          </div>
        </div>

        <Divider />

        <Descriptions column={1} bordered size="small">
          <Descriptions.Item label="닉네임">{profile.nickname}</Descriptions.Item>
          <Descriptions.Item label="이메일">{profile.email || '없음'}</Descriptions.Item>
          <Descriptions.Item label="로그인 방법">{PROVIDER_LABEL[profile.provider] || profile.provider}</Descriptions.Item>
          <Descriptions.Item label="계정 등급">
            {profile.role === 'service_admin' ? '서비스 관리자' : '일반 사용자'}
          </Descriptions.Item>
        </Descriptions>

        <Divider />

        <Button
          danger
          icon={<LogoutOutlined />}
          onClick={handleLogout}
          block
        >
          로그아웃
        </Button>
      </Card>
    </div>
  )
}
