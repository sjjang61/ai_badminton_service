import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { List, Button, Modal, Form, Input, Switch, Typography, Tag, message, Empty, Spin } from 'antd'
import { PlusOutlined, PushpinOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons'
import { noticesApi } from '@/api/notices'
import type { Notice } from '@/types'
import { formatDate } from '@/utils/dday'

const { Title, Text, Paragraph } = Typography

export default function NoticesPage() {
  const { clubId } = useParams<{ clubId: string }>()
  const id = Number(clubId)
  const [open, setOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Notice | null>(null)
  const [form] = Form.useForm()
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['club-notices', id],
    queryFn: () => noticesApi.listClub(id),
  })
  const notices: Notice[] = data?.data?.data || []

  const create = useMutation({
    mutationFn: (v: { title: string; content: string; is_pinned: boolean }) =>
      noticesApi.createClub(id, { ...v, is_pinned: v.is_pinned ? 1 : 0 }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['club-notices', id] })
      setOpen(false)
      form.resetFields()
      message.success('공지가 등록되었습니다.')
    },
    onError: () => message.error('공지 등록에 실패했습니다.'),
  })

  const update = useMutation({
    mutationFn: ({ nId, v }: { nId: number; v: Record<string, unknown> }) =>
      noticesApi.update(id, nId, { ...v, is_pinned: v.is_pinned ? 1 : 0 } as { title?: string; content?: string; is_pinned?: number }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['club-notices', id] })
      setOpen(false)
      setEditTarget(null)
      form.resetFields()
      message.success('수정되었습니다.')
    },
    onError: () => message.error('수정에 실패했습니다.'),
  })

  const del = useMutation({
    mutationFn: (nId: number) => noticesApi.delete(id, nId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['club-notices', id] })
      message.success('삭제되었습니다.')
    },
    onError: () => message.error('삭제에 실패했습니다.'),
  })

  const handleOpenCreate = () => {
    setEditTarget(null)
    form.resetFields()
    setOpen(true)
  }

  const handleOpenEdit = (notice: Notice) => {
    setEditTarget(notice)
    form.setFieldsValue({
      title: notice.title,
      content: notice.content,
      is_pinned: notice.is_pinned === 1,
    })
    setOpen(true)
  }

  const handleSubmit = (v: { title: string; content: string; is_pinned: boolean }) => {
    if (editTarget) {
      update.mutate({ nId: editTarget.id, v })
    } else {
      create.mutate(v)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spin size="large" />
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <Title level={2} className="!mb-0">공지사항</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenCreate}>
          공지 작성
        </Button>
      </div>

      {notices.length === 0 ? (
        <Empty description="등록된 공지사항이 없습니다" className="py-16" />
      ) : (
        <List
          itemLayout="vertical"
          dataSource={notices}
          renderItem={(notice) => (
            <List.Item
              key={notice.id}
              actions={[
                <Button
                  key="edit"
                  size="small"
                  icon={<EditOutlined />}
                  onClick={() => handleOpenEdit(notice)}
                >
                  수정
                </Button>,
                <Button
                  key="delete"
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  loading={del.isPending}
                  onClick={() => del.mutate(notice.id)}
                >
                  삭제
                </Button>,
              ]}
            >
              <List.Item.Meta
                title={
                  <span className="flex items-center gap-2">
                    {notice.is_pinned === 1 && (
                      <PushpinOutlined className="text-red-500" />
                    )}
                    <span className="text-base font-semibold">{notice.title}</span>
                    {notice.is_pinned === 1 && <Tag color="red">고정</Tag>}
                  </span>
                }
                description={
                  <Text type="secondary" className="text-sm">
                    {formatDate(notice.created_at)}
                    {notice.updated_at && notice.updated_at !== notice.created_at && (
                      <span className="ml-2">(수정됨)</span>
                    )}
                  </Text>
                }
              />
              <Paragraph className="whitespace-pre-wrap mt-2">{notice.content}</Paragraph>
            </List.Item>
          )}
        />
      )}

      <Modal
        title={editTarget ? '공지 수정' : '공지 작성'}
        open={open}
        onOk={() => form.submit()}
        onCancel={() => {
          setOpen(false)
          setEditTarget(null)
          form.resetFields()
        }}
        confirmLoading={create.isPending || update.isPending}
        okText={editTarget ? '수정' : '등록'}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="title" label="제목" rules={[{ required: true, message: '제목을 입력하세요' }]}>
            <Input placeholder="공지 제목" />
          </Form.Item>
          <Form.Item name="content" label="내용" rules={[{ required: true, message: '내용을 입력하세요' }]}>
            <Input.TextArea rows={5} placeholder="공지 내용을 입력하세요" />
          </Form.Item>
          <Form.Item name="is_pinned" label="상단 고정" valuePropName="checked" initialValue={false}>
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
