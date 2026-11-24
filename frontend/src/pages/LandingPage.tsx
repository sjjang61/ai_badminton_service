import { Button, Typography, Row, Col, Card } from 'antd'
import { useNavigate } from 'react-router-dom'
import {
  TrophyOutlined,
  TeamOutlined,
  CalendarOutlined,
  PictureOutlined,
} from '@ant-design/icons'

const { Title, Paragraph } = Typography

export default function LandingPage() {
  const navigate = useNavigate()

  const features = [
    {
      icon: <TeamOutlined style={{ fontSize: 40, color: '#3b82f6' }} />,
      title: '클럽 관리',
      desc: '회원 가입 승인, 역할 관리, 회비 관리',
    },
    {
      icon: <TrophyOutlined style={{ fontSize: 40, color: '#eab308' }} />,
      title: '대회 운영',
      desc: 'AI 대진표 자동 생성, 경기 결과 입력, 순위 계산',
    },
    {
      icon: <CalendarOutlined style={{ fontSize: 40, color: '#22c55e' }} />,
      title: '일정 관리',
      desc: '클럽 달력, D-Day 카운트다운, 공지사항',
    },
    {
      icon: <PictureOutlined style={{ fontSize: 40, color: '#a855f7' }} />,
      title: '갤러리',
      desc: '사진 업로드, AI 영상 자동 생성',
    },
  ]

  return (
    <div>
      {/* Hero */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1d4ed8 0%, #60a5fa 100%)',
          color: 'white',
          padding: '96px 24px',
          textAlign: 'center',
        }}
      >
        <Title level={1} style={{ color: 'white', marginBottom: 16 }}>
          모두의 배민
        </Title>
        <Paragraph style={{ fontSize: 20, color: '#bfdbfe', marginBottom: 32 }}>
          배드민턴 클럽 운영을 더 쉽게, 더 스마트하게
        </Paragraph>
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Button
            size="large"
            style={{ background: 'transparent', color: 'white', borderColor: 'white' }}
            onClick={() => navigate('/clubs')}
          >
            클럽 찾기
          </Button>
          <Button
            size="large"
            style={{ background: 'white', color: '#1d4ed8', borderColor: 'white' }}
            onClick={() => navigate('/auth/login')}
          >
            시작하기
          </Button>
        </div>
      </div>

      {/* Features */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '64px 24px' }}>
        <Title level={2} style={{ textAlign: 'center', marginBottom: 48 }}>
          주요 기능
        </Title>
        <Row gutter={[24, 24]}>
          {features.map((f) => (
            <Col key={f.title} xs={24} sm={12} lg={6}>
              <Card
                style={{ textAlign: 'center', height: '100%' }}
                hoverable
              >
                <div style={{ marginBottom: 16 }}>{f.icon}</div>
                <Title level={4}>{f.title}</Title>
                <Paragraph style={{ color: '#6b7280' }}>{f.desc}</Paragraph>
              </Card>
            </Col>
          ))}
        </Row>
      </div>
    </div>
  )
}
