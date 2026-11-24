import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  DatePicker,
  message,
  Typography,
  Tag,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { PlusOutlined } from '@ant-design/icons'
import { clubsApi } from '@/api/clubs'
import type { ClubFee } from '@/types'
import type { Dayjs } from 'dayjs'

const { Title } = Typography

interface FeeFormValues {
  user_id: number
  amount: number
  fee_month: Dayjs
  memo?: string
}

export default function FeesPage() {
  const { clubId } = useParams<{ clubId: string }>()
  const id = Number(clubId)
  const [open, setOpen] = useState(false)
  const [form] = Form.useForm<FeeFormValues>()
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['fees', id],
    queryFn: () => clubsApi.listFees(id),
  })
  const fees: ClubFee[] = data?.data?.data || []

  const create = useMutation({
    mutationFn: (values: FeeFormValues) =>
      clubsApi.createFee(id, {
        user_id: values.user_id,
        amount: values.amount,
        fee_month: values.fee_month.format('YYYY-MM-01'),
        memo: values.memo,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['fees', id] })
      setOpen(false)
      form.resetFields()
      message.success('회비가 등록되었습니다.')
    },
    onError: () => message.error('등록에 실패했습니다.'),
  })

  const del = useMutation({
    mutationFn: (feeId: number) => clubsApi.deleteFee(id, feeId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['fees', id] })
      message.success('삭제되었습니다.')
    },
  })

  const columns: ColumnsType<ClubFee> = [
    { title: '회원 ID', dataIndex: 'user_id', key: 'user_id' },
    {
      title: '금액',
      dataIndex: 'amount',
      render: (a: number) => `${a.toLocaleString()}원`,
    },
    {
      title: '납부 대상월',
      dataIndex: 'fee_month',
      render: (d: string) =>
        new Date(d).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' }),
    },
    {
      title: '납부일',
      dataIndex: 'paid_at',
      render: (d: string) =>
        d ? new Date(d).toLocaleDateString() : <Tag color="orange">미납</Tag>,
    },
    { title: '메모', dataIndex: 'memo', render: (v: string) => v || '-' },
    {
      title: '작업',
      key: 'action',
      render: (_: unknown, r: ClubFee) => (
        <Button size="small" danger onClick={() => del.mutate(r.id)} loading={del.isPending}>
          삭제
        </Button>
      ),
    },
  ]

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
        }}
      >
        <Title level={2} style={{ margin: 0 }}>
          회비 관리
        </Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)}>
          회비 등록
        </Button>
      </div>
      <Table
        dataSource={fees}
        columns={columns}
        rowKey="id"
        loading={isLoading}
        pagination={{ pageSize: 20 }}
      />
      <Modal
        title="회비 등록"
        open={open}
        onOk={() => form.submit()}
        onCancel={() => setOpen(false)}
        confirmLoading={create.isPending}
      >
        <Form form={form} layout="vertical" onFinish={(v) => create.mutate(v)}>
          <Form.Item name="user_id" label="회원 ID" rules={[{ required: true, message: '필수' }]}>
            <InputNumber style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="amount"
            label="금액 (원)"
            rules={[{ required: true, message: '필수' }]}
          >
            <InputNumber min={0} step={1000} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="fee_month"
            label="납부 대상월"
            rules={[{ required: true, message: '필수' }]}
          >
            <DatePicker picker="month" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="memo" label="메모">
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
