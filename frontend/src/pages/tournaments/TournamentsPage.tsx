import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Card, Row, Col, Button, Tag, Typography, Empty } from 'antd'
import { PlusOutlined, TrophyOutlined } from '@ant-design/icons'
import { tournamentsApi } from '@/api/tournaments'
import type { Tournament } from '@/types'
import { useAuthStore } from '@/stores/authStore'

const { Title, Text } = Typography

const STATUS_COLOR: Record<string, string> = {
  draft: 'default',
  ongoing: 'blue',
  finished: 'green',
}
const STATUS_LABEL: Record<string, string> = {
  draft: '준비중',
  ongoing: '진행중',
  finished: '종료',
}
const FORMAT_LABEL: Record<string, string> = {
  round_robin: '리그전',
  single_elimination: '싱글 토너먼트',
  double_elimination: '더블 토너먼트',
}
const MATCH_TYPE_LABEL: Record<string, string> = {
  singles: '단식',
  doubles: '복식',
  mixed: '혼합',
}

export default function TournamentsPage() {
  const { clubId } = useParams<{ clubId: string }>()
  const id = Number(clubId)
  const navigate = useNavigate()
  const { isAuthenticated } = useAuthStore()

  const { data, isLoading } = useQuery({
    queryKey: ['tournaments', id],
    queryFn: () => tournamentsApi.list(id),
  })

  const tournaments: Tournament[] = data?.data?.data || []

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <Title level={2} style={{ margin: 0 }}>
          대회 목록
        </Title>
        {isAuthenticated && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate(`/clubs/${id}/tournaments/new`)}
          >
            대회 만들기
          </Button>
        )}
      </div>
      {!isLoading && tournaments.length === 0 ? (
        <Empty
          image={<TrophyOutlined style={{ fontSize: 64, color: '#d1d5db' }} />}
          description="등록된 대회가 없습니다"
        />
      ) : (
        <Row gutter={[16, 16]}>
          {tournaments.map((t) => (
            <Col key={t.id} xs={24} sm={12} lg={8}>
              <Card
                hoverable
                onClick={() => navigate(`/clubs/${id}/tournaments/${t.id}`)}
                extra={
                  <Tag color={STATUS_COLOR[t.status]}>{STATUS_LABEL[t.status]}</Tag>
                }
                title={
                  <span>
                    <TrophyOutlined style={{ marginRight: 8 }} />
                    {t.name}
                  </span>
                }
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <Text type="secondary">방식: {FORMAT_LABEL[t.format] || t.format}</Text>
                  <Text type="secondary">
                    종목: {MATCH_TYPE_LABEL[t.match_type] || t.match_type}
                  </Text>
                  {t.start_date && <Text type="secondary">시작: {t.start_date}</Text>}
                  {t.location && <Text type="secondary">장소: {t.location}</Text>}
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </div>
  )
}
