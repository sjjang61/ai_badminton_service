import { useParams, useNavigate } from 'react-router-dom'
import { Form, Input, Select, DatePicker, Button, Card, Typography, message } from 'antd'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { tournamentsApi } from '@/api/tournaments'
import type { Dayjs } from 'dayjs'

const { Title } = Typography

interface TournamentFormValues {
  name: string
  format: string
  match_type: string
  start_date?: Dayjs
  end_date?: Dayjs
  location?: string
  description?: string
}

export default function TournamentNewPage() {
  const { clubId } = useParams<{ clubId: string }>()
  const id = Number(clubId)
  const [form] = Form.useForm<TournamentFormValues>()
  const navigate = useNavigate()
  const qc = useQueryClient()

  const { mutate, isPending } = useMutation({
    mutationFn: (values: TournamentFormValues) =>
      tournamentsApi.create(id, {
        ...values,
        start_date: values.start_date?.format('YYYY-MM-DD'),
        end_date: values.end_date?.format('YYYY-MM-DD'),
        type: 'internal',
      }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['tournaments', id] })
      message.success('대회가 생성되었습니다.')
      navigate(`/clubs/${id}/tournaments/${res.data.data.id}`)
    },
    onError: () => message.error('대회 생성에 실패했습니다.'),
  })

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      <Title level={2}>대회 만들기</Title>
      <Card>
        <Form form={form} layout="vertical" onFinish={(v) => mutate(v)}>
          <Form.Item
            name="name"
            label="대회명"
            rules={[{ required: true, message: '대회명을 입력하세요' }]}
          >
            <Input placeholder="대회명을 입력하세요" />
          </Form.Item>
          <Form.Item name="format" label="대회 방식" initialValue="round_robin">
            <Select
              options={[
                { value: 'round_robin', label: '리그전' },
                { value: 'single_elimination', label: '싱글 토너먼트' },
                { value: 'double_elimination', label: '더블 토너먼트' },
              ]}
            />
          </Form.Item>
          <Form.Item name="match_type" label="종목" initialValue="singles">
            <Select
              options={[
                { value: 'singles', label: '단식' },
                { value: 'doubles', label: '복식' },
                { value: 'mixed', label: '혼합' },
              ]}
            />
          </Form.Item>
          <Form.Item name="start_date" label="시작일">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="end_date" label="종료일">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="location" label="장소">
            <Input />
          </Form.Item>
          <Form.Item name="description" label="설명">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={isPending} block>
            대회 생성
          </Button>
        </Form>
      </Card>
    </div>
  )
}
