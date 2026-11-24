import { Card, Button, Typography, Space, Divider, message } from 'antd'
import { EyeOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import api from '@/api'
import { useAuthStore } from '@/stores/authStore'

const { Title, Text } = Typography

export default function LoginPage() {
  const navigate = useNavigate()
  const { enterAsGuest } = useAuthStore()

  const handleLogin = async (provider: 'kakao' | 'naver' | 'google') => {
    try {
      const res = await api.get(`/auth/${provider}`)
      window.location.href = res.data.data.auth_url
    } catch {
      message.error('로그인 연결에 실패했습니다.')
    }
  }

  const handleGuestBrowse = () => {
    enterAsGuest()
    navigate('/clubs')
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #e0f0ff 0%, #f9fafb 100%)',
      }}
    >
      <Card style={{ width: '100%', maxWidth: 400 }} className="shadow-lg">
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🏸</div>
          <Title level={2} style={{ marginBottom: 4 }}>모두의 배민</Title>
          <Text type="secondary">배드민턴 클럽 통합 관리 서비스</Text>
        </div>

        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <Button
            block
            size="large"
            style={{ background: '#FEE500', borderColor: '#FEE500', color: '#000', fontWeight: 600 }}
            onClick={() => handleLogin('kakao')}
          >
            카카오로 시작하기
          </Button>
          <Button
            block
            size="large"
            style={{ background: '#03C75A', borderColor: '#03C75A', color: '#fff', fontWeight: 600 }}
            onClick={() => handleLogin('naver')}
          >
            네이버로 시작하기
          </Button>
          <Button
            block
            size="large"
            style={{ background: '#4285F4', borderColor: '#4285F4', color: '#fff', fontWeight: 600 }}
            onClick={() => handleLogin('google')}
          >
            Google로 시작하기
          </Button>
        </Space>

        <Divider style={{ margin: '20px 0' }}>
          <Text type="secondary" style={{ fontSize: 12 }}>또는</Text>
        </Divider>

        <Button
          block
          size="large"
          icon={<EyeOutlined />}
          onClick={handleGuestBrowse}
          style={{ borderStyle: 'dashed' }}
        >
          게스트로 둘러보기
        </Button>

        <div
          style={{
            marginTop: 12,
            padding: '10px 12px',
            background: '#fffbe6',
            borderRadius: 6,
            border: '1px solid #ffe58f',
          }}
        >
          <Text style={{ fontSize: 12, color: '#8c6d00' }}>
            ⚠️ 게스트 모드에서는 클럽 검색과 기본 정보만 볼 수 있습니다.
            대회·갤러리·달력·공지사항 등은 클럽 회원만 이용 가능합니다.
          </Text>
        </div>

        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <Button type="link" onClick={() => navigate('/')}>
            메인으로 돌아가기
          </Button>
        </div>
      </Card>
    </div>
  )
}
