import { useState } from 'react'
import { Form, Input, InputNumber, Button, Card, Typography, Space, Checkbox, Divider, message } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { clubsApi } from '@/api/clubs'
import { useAddressSearch } from '@/hooks/useAddressSearch'

const { Title } = Typography

interface ClubFormValues {
  name: string
  description?: string
  gym_name?: string
  gym_address?: string
  gym_address_detail?: string
  has_joining_fee: boolean
  joining_fee: number
  yearly_fee: number
  monthly_fee: number
  guest_fee: number
}

export default function ClubNewPage() {
  const [form] = Form.useForm<ClubFormValues>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { open: openAddressSearch } = useAddressSearch()
  const [zonecode, setZonecode] = useState('')
  const hasJoiningFee = Form.useWatch('has_joining_fee', form)

  const { mutate, isPending } = useMutation({
    mutationFn: (values: ClubFormValues) => {
      const { gym_address_detail, has_joining_fee, ...rest } = values
      const fullAddress = gym_address_detail
        ? `${values.gym_address} ${gym_address_detail}`
        : values.gym_address
      return clubsApi.create({
        ...rest,
        gym_address: fullAddress,
        has_joining_fee: has_joining_fee ? 1 : 0,
        joining_fee: has_joining_fee ? (values.joining_fee ?? 0) : 0,
      })
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['clubs'] })
      message.success('클럽이 생성되었습니다.')
      navigate(`/clubs/${res.data.data.id}`)
    },
    onError: () => message.error('클럽 생성에 실패했습니다.'),
  })

  const handleAddressSearch = () => {
    openAddressSearch(({ zonecode, roadAddress }) => {
      setZonecode(zonecode)
      form.setFieldsValue({ gym_address: roadAddress, gym_address_detail: '' })
    })
  }

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      <Title level={2}>클럽 만들기</Title>
      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={(v) => mutate(v)}
          initialValues={{
            has_joining_fee: false,
            joining_fee: 0,
            yearly_fee: 0,
            monthly_fee: 0,
            guest_fee: 0,
          }}
        >
          <Form.Item
            name="name"
            label="클럽명"
            rules={[{ required: true, message: '클럽명을 입력하세요' }]}
          >
            <Input placeholder="예) 서울 배드민턴 클럽" />
          </Form.Item>

          <Form.Item name="description" label="클럽 소개">
            <Input.TextArea rows={3} placeholder="클럽을 소개해주세요" />
          </Form.Item>

          <Form.Item name="gym_name" label="체육관명">
            <Input placeholder="예) 강남 스포츠센터" />
          </Form.Item>

          <Form.Item label="체육관 주소">
            <Space.Compact style={{ width: '100%', marginBottom: 8 }}>
              <Input value={zonecode} placeholder="우편번호" readOnly style={{ width: 110 }} />
              <Button icon={<SearchOutlined />} onClick={handleAddressSearch}>주소 검색</Button>
            </Space.Compact>
            <Form.Item name="gym_address" noStyle>
              <Input
                readOnly
                placeholder="도로명 주소 (주소 검색 버튼을 클릭하세요)"
                style={{ marginBottom: 8 }}
                onClick={handleAddressSearch}
              />
            </Form.Item>
            <Form.Item name="gym_address_detail" noStyle>
              <Input placeholder="상세주소 (동/호수 등)" />
            </Form.Item>
          </Form.Item>

          <Divider orientation="left" style={{ fontSize: 14 }}>회비 설정</Divider>

          <Form.Item name="has_joining_fee" valuePropName="checked">
            <Checkbox>가입비 있음</Checkbox>
          </Form.Item>

          {hasJoiningFee && (
            <Form.Item name="joining_fee" label="가입비 (원)">
              <InputNumber min={0} step={1000} style={{ width: '100%' }} placeholder="0" />
            </Form.Item>
          )}

          <Form.Item name="yearly_fee" label="년회비 (원)">
            <InputNumber min={0} step={10000} style={{ width: '100%' }} placeholder="0" />
          </Form.Item>

          <Form.Item name="monthly_fee" label="월회비 (원)">
            <InputNumber min={0} step={1000} style={{ width: '100%' }} placeholder="0" />
          </Form.Item>

          <Form.Item name="guest_fee" label="게스트비 (원)">
            <InputNumber min={0} step={1000} style={{ width: '100%' }} placeholder="0" />
          </Form.Item>

          <Button type="primary" htmlType="submit" loading={isPending} block>
            클럽 생성
          </Button>
        </Form>
      </Card>
    </div>
  )
}
