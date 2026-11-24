import { useState } from 'react'
import { Card, Input, Button, Typography, Avatar, Form, message } from 'antd'
import { UserOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import api from '@/api'

const { Title, Text } = Typography

export default function RegisterPage() {
  const navigate = useNavigate()
  const { user, setUser } = useAuthStore()
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (values: { nickname: string }) => {
    setLoading(true)
    try {
      const res = await api.patch('/auth/me', { nickname: values.nickname })
      setUser(res.data)
      message.success('회원가입이 완료되었습니다. 환영합니다!')
      navigate('/clubs', { replace: true })
    } catch {
      message.error('닉네임 설정에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setLoading(false)
    }
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
      <Card style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🏸</div>
          <Title level={3} style={{ marginBottom: 4 }}>프로필 설정</Title>
          <Text type="secondary">서비스 이용을 위해 닉네임을 확인해주세요.</Text>
        </div>

        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Avatar
            size={72}
            src={user?.profile_img}
            icon={<UserOutlined />}
          />
          {user?.email && (
            <div style={{ marginTop: 8 }}>
              <Text type="secondary" style={{ fontSize: 13 }}>{user.email}</Text>
            </div>
          )}
        </div>

        <Form
          initialValues={{ nickname: user?.nickname ?? '' }}
          onFinish={handleSubmit}
          layout="vertical"
        >
          <Form.Item
            name="nickname"
            label="닉네임"
            rules={[
              { required: true, message: '닉네임을 입력해주세요.' },
              { min: 1, max: 50, message: '1~50자 이내로 입력해주세요.' },
            ]}
          >
            <Input size="large" placeholder="사용할 닉네임을 입력하세요" />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0 }}>
            <Button
              type="primary"
              htmlType="submit"
              block
              size="large"
              loading={loading}
            >
              시작하기
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}
