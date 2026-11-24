import { useState } from 'react'
import dayjs, { type Dayjs } from 'dayjs'
import { useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Modal, Form, Input, DatePicker, Switch, Button, message, Typography, Popconfirm, Descriptions, Tag } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin, { type DateSelectArg, type EventClickArg } from '@fullcalendar/interaction'
import { calendarApi } from '@/api/calendar'
import { calcDDay } from '@/utils/dday'
import type { CalendarEvent } from '@/types'

const { Title, Text } = Typography

interface FormValues {
  title: string
  description?: string
  start_dt: Dayjs
  end_dt?: Dayjs
  all_day: boolean
  color?: string
  dday_label?: string
  is_public: boolean
}

export default function CalendarPage() {
  const { clubId } = useParams<{ clubId: string }>()
  const id = Number(clubId)
  const qc = useQueryClient()

  // 등록/수정 폼 모달
  const [formOpen, setFormOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null)
  const [form] = Form.useForm<FormValues>()

  // 클릭한 이벤트 상세 모달
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)

  const { data } = useQuery({
    queryKey: ['events', id],
    queryFn: () => calendarApi.listEvents(id),
  })
  const events: CalendarEvent[] = data?.data?.data || []

  const create = useMutation({
    mutationFn: (v: FormValues) =>
      calendarApi.createEvent(id, {
        title: v.title,
        description: v.description,
        start_dt: v.start_dt.toISOString(),
        end_dt: v.end_dt ? v.end_dt.toISOString() : undefined,
        all_day: v.all_day ? 1 : 0,
        color: v.color || undefined,
        dday_label: v.dday_label,
        is_public: v.is_public !== false ? 1 : 0,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['events', id] })
      closeForm()
      message.success('일정이 등록되었습니다.')
    },
    onError: () => message.error('일정 등록에 실패했습니다.'),
  })

  const update = useMutation({
    mutationFn: ({ eId, v }: { eId: number; v: FormValues }) =>
      calendarApi.updateEvent(id, eId, {
        title: v.title,
        description: v.description,
        start_dt: v.start_dt.toISOString(),
        end_dt: v.end_dt ? v.end_dt.toISOString() : undefined,
        all_day: v.all_day ? 1 : 0,
        color: v.color || undefined,
        dday_label: v.dday_label,
        is_public: v.is_public !== false ? 1 : 0,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['events', id] })
      closeForm()
      message.success('일정이 수정되었습니다.')
    },
    onError: () => message.error('일정 수정에 실패했습니다.'),
  })

  const del = useMutation({
    mutationFn: (eId: number) => calendarApi.deleteEvent(id, eId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['events', id] })
      setSelectedEvent(null)
      message.success('일정이 삭제되었습니다.')
    },
    onError: () => message.error('삭제에 실패했습니다.'),
  })

  const closeForm = () => {
    setFormOpen(false)
    setEditingEvent(null)
    form.resetFields()
  }

  const openCreate = () => {
    setEditingEvent(null)
    form.resetFields()
    setFormOpen(true)
  }

  const openEdit = (event: CalendarEvent) => {
    setSelectedEvent(null)
    setEditingEvent(event)
    form.setFieldsValue({
      title: event.title,
      description: event.description,
      start_dt: dayjs(event.start_dt),
      end_dt: event.end_dt ? dayjs(event.end_dt) : undefined,
      all_day: event.all_day === 1,
      color: event.color || '#1677ff',
      dday_label: event.dday_label,
      is_public: event.is_public === 1,
    })
    setFormOpen(true)
  }

  const handleFormFinish = (v: FormValues) => {
    if (editingEvent) {
      update.mutate({ eId: editingEvent.id, v })
    } else {
      create.mutate(v)
    }
  }

  // FullCalendar 이벤트 변환
  const calendarEvents = events.map((e) => ({
    id: String(e.id),
    title: e.dday_label ? `${e.title} (${calcDDay(e.start_dt)})` : e.title,
    start: e.start_dt,
    end: e.end_dt || undefined,
    allDay: e.all_day === 1,
    backgroundColor: e.color || '#1677ff',
    borderColor: e.color || '#1677ff',
    extendedProps: { raw: e },
  }))

  const handleDateSelect = (arg: DateSelectArg) => {
    form.setFieldsValue({
      start_dt: dayjs(arg.start),
      end_dt: arg.end ? dayjs(arg.end) : undefined,
      all_day: arg.allDay,
    })
    setEditingEvent(null)
    setFormOpen(true)
  }

  const handleEventClick = (info: EventClickArg) => {
    const raw: CalendarEvent = info.event.extendedProps.raw
    setSelectedEvent(raw)
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <Title level={2} className="!mb-0">클럽 달력</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          일정 추가
        </Button>
      </div>

      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        locale="ko"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay',
        }}
        events={calendarEvents}
        selectable
        selectMirror
        select={handleDateSelect}
        eventClick={handleEventClick}
        height="auto"
        buttonText={{ today: '오늘', month: '월', week: '주', day: '일' }}
      />

      {/* 이벤트 상세 모달 */}
      <Modal
        title="일정 상세"
        open={selectedEvent !== null}
        onCancel={() => setSelectedEvent(null)}
        footer={
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Popconfirm
              title="이 일정을 삭제하시겠습니까?"
              okText="삭제"
              okButtonProps={{ danger: true }}
              cancelText="취소"
              onConfirm={() => selectedEvent && del.mutate(selectedEvent.id)}
            >
              <Button danger icon={<DeleteOutlined />} loading={del.isPending}>
                삭제
              </Button>
            </Popconfirm>
            <div style={{ display: 'flex', gap: 8 }}>
              <Button onClick={() => setSelectedEvent(null)}>닫기</Button>
              <Button
                type="primary"
                icon={<EditOutlined />}
                onClick={() => selectedEvent && openEdit(selectedEvent)}
              >
                수정
              </Button>
            </div>
          </div>
        }
        width={480}
      >
        {selectedEvent && (
          <Descriptions column={1} size="small" style={{ marginTop: 8 }}>
            <Descriptions.Item label="제목">
              <Text strong>{selectedEvent.title}</Text>
              {selectedEvent.dday_label && (
                <Tag color="blue" style={{ marginLeft: 8 }}>
                  {calcDDay(selectedEvent.start_dt)}
                </Tag>
              )}
            </Descriptions.Item>
            {selectedEvent.description && (
              <Descriptions.Item label="내용">{selectedEvent.description}</Descriptions.Item>
            )}
            <Descriptions.Item label="시작">
              {dayjs(selectedEvent.start_dt).format('YYYY-MM-DD HH:mm')}
            </Descriptions.Item>
            {selectedEvent.end_dt && (
              <Descriptions.Item label="종료">
                {dayjs(selectedEvent.end_dt).format('YYYY-MM-DD HH:mm')}
              </Descriptions.Item>
            )}
            {selectedEvent.dday_label && (
              <Descriptions.Item label="D-Day 레이블">{selectedEvent.dday_label}</Descriptions.Item>
            )}
            <Descriptions.Item label="종일">
              {selectedEvent.all_day === 1 ? '예' : '아니오'}
            </Descriptions.Item>
            <Descriptions.Item label="공개 여부">
              {selectedEvent.is_public === 1 ? '공개' : '비공개'}
            </Descriptions.Item>
            {selectedEvent.color && (
              <Descriptions.Item label="색상">
                <span
                  style={{
                    display: 'inline-block',
                    width: 16,
                    height: 16,
                    borderRadius: 3,
                    background: selectedEvent.color,
                    border: '1px solid #d9d9d9',
                    verticalAlign: 'middle',
                    marginRight: 6,
                  }}
                />
                {selectedEvent.color}
              </Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Modal>

      {/* 등록 / 수정 폼 모달 */}
      <Modal
        title={editingEvent ? '일정 수정' : '일정 등록'}
        open={formOpen}
        onOk={() => form.submit()}
        onCancel={closeForm}
        confirmLoading={create.isPending || update.isPending}
        okText={editingEvent ? '저장' : '등록'}
        cancelText="취소"
        width={520}
      >
        <Form form={form} layout="vertical" onFinish={handleFormFinish}>
          <Form.Item name="title" label="제목" rules={[{ required: true, message: '제목을 입력하세요' }]}>
            <Input placeholder="일정 제목" />
          </Form.Item>
          <Form.Item name="description" label="내용">
            <Input.TextArea rows={2} placeholder="일정 설명 (선택)" />
          </Form.Item>
          <div className="grid grid-cols-2 gap-3">
            <Form.Item name="start_dt" label="시작" rules={[{ required: true, message: '시작일을 선택하세요' }]}>
              <DatePicker showTime className="w-full" format="YYYY-MM-DD HH:mm" />
            </Form.Item>
            <Form.Item name="end_dt" label="종료">
              <DatePicker showTime className="w-full" format="YYYY-MM-DD HH:mm" />
            </Form.Item>
          </div>
          <Form.Item name="dday_label" label="D-Day 레이블">
            <Input placeholder="예) 클럽 대회, 정기 모임" />
          </Form.Item>
          <div className="grid grid-cols-2 gap-3">
            <Form.Item name="color" label="색상">
              <Input type="color" style={{ height: 32 }} />
            </Form.Item>
            <Form.Item name="all_day" label="종일" valuePropName="checked" initialValue={false}>
              <Switch />
            </Form.Item>
          </div>
          <Form.Item name="is_public" label="클럽 회원 공개" valuePropName="checked" initialValue={true}>
            <Switch defaultChecked />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
