import { useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Table, Tag, Button, Space, message, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { membersApi } from '@/api/members'
import type { ClubMember } from '@/types'

const { Title } = Typography

const STATUS_COLOR: Record<string, string> = {
  approved: 'green',
  pending: 'orange',
  rejected: 'red',
  banned: 'default',
}
const STATUS_LABEL: Record<string, string> = {
  approved: '승인',
  pending: '대기',
  rejected: '거절',
  banned: '차단',
}
const ROLE_LABEL: Record<string, string> = {
  admin: '관리자',
  member: '회원',
  guest: '게스트',
}

export default function MembersPage() {
  const { clubId } = useParams<{ clubId: string }>()
  const id = Number(clubId)
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['members', id],
    queryFn: () => membersApi.list(id),
  })
  const members: ClubMember[] = data?.data?.data || []

  const approve = useMutation({
    mutationFn: (mId: number) => membersApi.approve(id, mId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['members', id] })
      message.success('승인되었습니다.')
    },
  })
  const reject = useMutation({
    mutationFn: (mId: number) => membersApi.reject(id, mId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['members', id] })
      message.success('거절되었습니다.')
    },
  })
  const remove = useMutation({
    mutationFn: (mId: number) => membersApi.remove(id, mId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['members', id] })
      message.success('제거되었습니다.')
    },
  })

  const columns: ColumnsType<ClubMember> = [
    { title: '회원 ID', dataIndex: 'user_id', key: 'user_id' },
    {
      title: '역할',
      dataIndex: 'role',
      key: 'role',
      render: (r: string) => <Tag>{ROLE_LABEL[r] || r}</Tag>,
    },
    {
      title: '상태',
      dataIndex: 'status',
      key: 'status',
      render: (s: string) => (
        <Tag color={STATUS_COLOR[s]}>{STATUS_LABEL[s] || s}</Tag>
      ),
    },
    {
      title: '가입일',
      dataIndex: 'joined_at',
      key: 'joined_at',
      render: (d: string) => (d ? new Date(d).toLocaleDateString() : '-'),
    },
    {
      title: '작업',
      key: 'action',
      render: (_: unknown, record: ClubMember) => (
        <Space>
          {record.status === 'pending' && (
            <>
              <Button
                size="small"
                type="primary"
                onClick={() => approve.mutate(record.id)}
                loading={approve.isPending}
              >
                승인
              </Button>
              <Button
                size="small"
                danger
                onClick={() => reject.mutate(record.id)}
                loading={reject.isPending}
              >
                거절
              </Button>
            </>
          )}
          {record.status === 'approved' && (
            <Button
              size="small"
              danger
              onClick={() => remove.mutate(record.id)}
              loading={remove.isPending}
            >
              내보내기
            </Button>
          )}
        </Space>
      ),
    },
  ]

  return (
    <div>
      <Title level={2}>회원 관리</Title>
      <Table
        dataSource={members}
        columns={columns}
        rowKey="id"
        loading={isLoading}
        pagination={{ pageSize: 20 }}
      />
    </div>
  )
}
