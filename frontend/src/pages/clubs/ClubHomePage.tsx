import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Tabs, Card, Typography, Button, message, Descriptions, Spin, Space, Tooltip, Tag, Alert } from 'antd'
import { LockOutlined, EditOutlined, PushpinFilled } from '@ant-design/icons'
import { clubsApi } from '@/api/clubs'
import { membersApi } from '@/api/members'
import { noticesApi } from '@/api/notices'
import { useAuthStore } from '@/stores/authStore'
import type { Notice } from '@/types'

const { Title, Text } = Typography

export default function ClubHomePage() {
  const { clubId } = useParams<{ clubId: string }>()
  const id = Number(clubId)
  const navigate = useNavigate()
  const { isAuthenticated, isGuest, user } = useAuthStore()

  const { data: clubData, isLoading } = useQuery({
    queryKey: ['club', id],
    queryFn: () => clubsApi.get(id),
    enabled: !!id,
  })

  const { data: noticesData } = useQuery({
    queryKey: ['club-notices', id],
    queryFn: () => noticesApi.listClub(id),
    enabled: isAuthenticated && !isGuest && !!id,
  })

  const { mutate: join, isPending: isJoining } = useMutation({
    mutationFn: () => membersApi.join(id),
    onSuccess: () => message.success('가입 요청이 완료되었습니다.'),
    onError: (err: unknown) => {
      const errTyped = err as { response?: { data?: { detail?: { message?: string } | string } } }
      const detail = errTyped?.response?.data?.detail
      const msg =
        typeof detail === 'object' && detail?.message
          ? detail.message
          : '가입 요청에 실패했습니다.'
      message.error(msg)
    },
  })

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: 48 }}>
        <Spin size="large" />
      </div>
    )
  }

  const club = clubData?.data?.data
  if (!club) return <div>클럽을 찾을 수 없습니다.</div>

  const allNotices: Notice[] = noticesData?.data?.data || []
  const pinnedNotices = allNotices.filter((n) => n.is_pinned === 1)
  const recentNotices: Notice[] = allNotices.slice(0, 3)
  const isAdmin = isAuthenticated && user?.id === club.owner_id

  const tabItems = [
    {
      key: 'info',
      label: '클럽 정보',
      children: (
        <Descriptions bordered column={1}>
          <Descriptions.Item label="클럽명">{club.name}</Descriptions.Item>
          {club.description && (
            <Descriptions.Item label="소개">{club.description}</Descriptions.Item>
          )}
          {club.gym_name && (
            <Descriptions.Item label="체육관">{club.gym_name}</Descriptions.Item>
          )}
          {club.gym_address && (
            <Descriptions.Item label="주소">{club.gym_address}</Descriptions.Item>
          )}
          <Descriptions.Item label="가입비">
            {club.has_joining_fee
              ? <><Tag color="orange">있음</Tag>{club.joining_fee.toLocaleString()}원</>
              : <Tag>없음</Tag>}
          </Descriptions.Item>
          <Descriptions.Item label="년회비">
            {club.yearly_fee > 0 ? `${club.yearly_fee.toLocaleString()}원` : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="월회비">
            {club.monthly_fee > 0 ? `${club.monthly_fee.toLocaleString()}원` : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="게스트비">
            {club.guest_fee > 0 ? `${club.guest_fee.toLocaleString()}원` : '-'}
          </Descriptions.Item>
        </Descriptions>
      ),
    },
    {
      key: 'notices',
      label: '공지사항',
      children: isGuest ? (
        <div style={{ textAlign: 'center', padding: '32px 0', color: '#8c8c8c' }}>
          <LockOutlined style={{ fontSize: 32, marginBottom: 12 }} />
          <div>공지사항은 클럽 회원만 볼 수 있습니다.</div>
          <Button type="link" onClick={() => navigate('/auth/login')}>로그인하기</Button>
        </div>
      ) : (
        <div>
          <Button
            onClick={() => navigate(`/clubs/${id}/notices`)}
            style={{ marginBottom: 16 }}
          >
            전체 공지 보기
          </Button>
          {recentNotices.length === 0 ? (
            <Text type="secondary">등록된 공지가 없습니다.</Text>
          ) : (
            recentNotices.map((n) => (
              <Card key={n.id} style={{ marginBottom: 8 }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <Text strong>
                    {n.is_pinned ? '📌 ' : ''}
                    {n.title}
                  </Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {new Date(n.created_at).toLocaleDateString()}
                  </Text>
                </div>
              </Card>
            ))
          )}
        </div>
      ),
    },
  ]

  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          marginBottom: 24,
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div>
          <Space align="center" style={{ marginBottom: 4 }}>
            <Title level={2} style={{ margin: 0 }}>{club.name}</Title>
            {isAdmin && (
              <Button
                icon={<EditOutlined />}
                size="small"
                onClick={() => navigate(`/clubs/${id}/edit`)}
              >
                수정
              </Button>
            )}
          </Space>
          {club.gym_name && <Text type="secondary">📍 {club.gym_name}</Text>}
        </div>
        {isAuthenticated ? (
          <Button type="primary" loading={isJoining} onClick={() => join()}>
            가입 요청
          </Button>
        ) : isGuest ? (
          <Tooltip title="로그인 후 가입 요청이 가능합니다.">
            <Button type="primary" disabled>
              가입 요청
            </Button>
          </Tooltip>
        ) : null}
      </div>
      <Space wrap style={{ marginBottom: 24 }}>
        <Button onClick={() => navigate(`/clubs/${id}/tournaments`)}>대회</Button>
        {isGuest ? (
          <>
            <Tooltip title="클럽 회원만 이용 가능합니다.">
              <Button disabled icon={<LockOutlined />}>갤러리</Button>
            </Tooltip>
            <Tooltip title="클럽 회원만 이용 가능합니다.">
              <Button disabled icon={<LockOutlined />}>달력</Button>
            </Tooltip>
            <Tooltip title="클럽 회원만 이용 가능합니다.">
              <Button disabled icon={<LockOutlined />}>공지사항</Button>
            </Tooltip>
          </>
        ) : (
          <>
            <Button onClick={() => navigate(`/clubs/${id}/gallery`)}>갤러리</Button>
            <Button onClick={() => navigate(`/clubs/${id}/calendar`)}>달력</Button>
            <Button onClick={() => navigate(`/clubs/${id}/notices`)}>공지사항</Button>
          </>
        )}
        {!isGuest && (
          <>
            <Button onClick={() => navigate(`/clubs/${id}/members`)}>회원 관리</Button>
            <Button onClick={() => navigate(`/clubs/${id}/fees`)}>회비</Button>
          </>
        )}
      </Space>
      {pinnedNotices.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          {pinnedNotices.map((n) => (
            <Alert
              key={n.id}
              type="warning"
              icon={<PushpinFilled />}
              showIcon
              message={
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 600 }}>{n.title}</span>
                  <span style={{ fontSize: 12, color: '#8c8c8c', marginLeft: 16, flexShrink: 0 }}>
                    {new Date(n.created_at).toLocaleDateString()}
                  </span>
                </div>
              }
              description={n.content}
              style={{ marginBottom: 8 }}
              onClick={() => navigate(`/clubs/${id}/notices`)}
              className="cursor-pointer"
            />
          ))}
        </div>
      )}
      <Tabs items={tabItems} />
    </div>
  )
}
