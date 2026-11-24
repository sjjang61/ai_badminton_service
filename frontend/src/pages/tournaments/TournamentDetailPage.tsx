import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Tabs,
  Table,
  Button,
  Form,
  Input,
  Modal,
  InputNumber,
  message,
  Typography,
  Card,
  Tag,
  Spin,
  Empty,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { ThunderboltOutlined, UserAddOutlined } from '@ant-design/icons'
import { tournamentsApi } from '@/api/tournaments'
import type { TournamentParticipant, TournamentMatch, Standing } from '@/types'

const { Title, Text } = Typography

interface AddParticipantForm {
  player_name: string
  partner_name?: string
}

interface ScoreForm {
  s1: number
  s2: number
}

export default function TournamentDetailPage() {
  const { clubId, tId } = useParams<{ clubId: string; tId: string }>()
  const cId = Number(clubId)
  const tIdNum = Number(tId)
  const qc = useQueryClient()
  const [scoreModal, setScoreModal] = useState<TournamentMatch | null>(null)
  const [addForm] = Form.useForm<AddParticipantForm>()
  const [scoreForm] = Form.useForm<ScoreForm>()

  const { data: tData, isLoading: tLoading } = useQuery({
    queryKey: ['tournament', tIdNum],
    queryFn: () => tournamentsApi.get(cId, tIdNum),
    enabled: !!tIdNum,
  })
  const { data: pData } = useQuery({
    queryKey: ['participants', tIdNum],
    queryFn: () => tournamentsApi.listParticipants(tIdNum),
    enabled: !!tIdNum,
  })
  const { data: bData } = useQuery({
    queryKey: ['bracket', tIdNum],
    queryFn: () => tournamentsApi.getBracket(tIdNum),
    enabled: !!tIdNum,
  })
  const { data: sData } = useQuery({
    queryKey: ['standings', tIdNum],
    queryFn: () => tournamentsApi.getStandings(tIdNum),
    enabled: !!tIdNum,
  })

  const tournament = tData?.data?.data
  const participants: TournamentParticipant[] = pData?.data?.data || []
  const matches: TournamentMatch[] = bData?.data?.data || []
  const standings: Standing[] = sData?.data?.data || []

  const participantMap: Record<number, string> = Object.fromEntries(
    participants.map((p) => [p.id, p.player_name])
  )
  const rounds = Array.from(new Set(matches.map((m) => m.round))).sort((a, b) => a - b)

  const addParticipant = useMutation({
    mutationFn: (v: AddParticipantForm) => tournamentsApi.addParticipant(tIdNum, v),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['participants', tIdNum] })
      addForm.resetFields()
      message.success('참가자가 추가되었습니다.')
    },
    onError: () => message.error('참가자 추가에 실패했습니다.'),
  })

  const removeParticipant = useMutation({
    mutationFn: (pId: number) => tournamentsApi.removeParticipant(tIdNum, pId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['participants', tIdNum] })
      message.success('참가자가 제거되었습니다.')
    },
  })

  const generateBracket = useMutation({
    mutationFn: () => tournamentsApi.generateBracket(tIdNum),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bracket', tIdNum] })
      message.success('대진표가 생성되었습니다.')
    },
    onError: () => message.error('대진표 생성에 실패했습니다.'),
  })

  const updateScore = useMutation({
    mutationFn: ({ mId, s1, s2 }: { mId: number; s1: number; s2: number }) =>
      tournamentsApi.updateScore(tIdNum, mId, {
        score_player1: s1,
        score_player2: s2,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bracket', tIdNum] })
      qc.invalidateQueries({ queryKey: ['standings', tIdNum] })
      setScoreModal(null)
      scoreForm.resetFields()
      message.success('경기 결과가 입력되었습니다.')
    },
    onError: () => message.error('결과 입력에 실패했습니다.'),
  })

  const participantColumns: ColumnsType<TournamentParticipant> = [
    { title: '이름', dataIndex: 'player_name' },
    {
      title: '파트너',
      dataIndex: 'partner_name',
      render: (v: string) => v || '-',
    },
    { title: '승', dataIndex: 'wins' },
    { title: '패', dataIndex: 'losses' },
    {
      title: '작업',
      key: 'action',
      render: (_: unknown, r: TournamentParticipant) => (
        <Button
          size="small"
          danger
          onClick={() => removeParticipant.mutate(r.id)}
          loading={removeParticipant.isPending}
        >
          제거
        </Button>
      ),
    },
  ]

  const standingColumns: ColumnsType<Standing> = [
    {
      title: '순위',
      key: 'rank',
      render: (_: unknown, _r: Standing, i: number) => i + 1,
      width: 60,
    },
    { title: '선수', dataIndex: 'player_name' },
    { title: '승', dataIndex: 'wins' },
    { title: '패', dataIndex: 'losses' },
    { title: '득점', dataIndex: 'points_won' },
    { title: '실점', dataIndex: 'points_lost' },
    {
      title: '득실차',
      dataIndex: 'point_diff',
      render: (v: number) => (
        <Tag color={v >= 0 ? 'green' : 'red'}>
          {v > 0 ? '+' : ''}
          {v}
        </Tag>
      ),
    },
  ]

  const tabItems = [
    {
      key: 'participants',
      label: `참가자 (${participants.length})`,
      children: (
        <div>
          <Form
            form={addForm}
            layout="inline"
            style={{ marginBottom: 16 }}
            onFinish={(v) => addParticipant.mutate(v)}
          >
            <Form.Item
              name="player_name"
              rules={[{ required: true, message: '이름을 입력하세요' }]}
            >
              <Input placeholder="선수 이름" />
            </Form.Item>
            <Form.Item name="partner_name">
              <Input placeholder="파트너 이름 (복식)" />
            </Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              icon={<UserAddOutlined />}
              loading={addParticipant.isPending}
            >
              추가
            </Button>
          </Form>
          <Table
            dataSource={participants}
            rowKey="id"
            size="small"
            columns={participantColumns}
            pagination={false}
          />
        </div>
      ),
    },
    {
      key: 'bracket',
      label: '대진표',
      children: (
        <div>
          <Button
            type="primary"
            icon={<ThunderboltOutlined />}
            loading={generateBracket.isPending}
            onClick={() => generateBracket.mutate()}
            style={{ marginBottom: 16 }}
          >
            AI 대진표 생성
          </Button>
          {matches.length === 0 ? (
            <Empty description="AI로 대진표를 생성하세요" />
          ) : (
            rounds.map((round) => (
              <Card key={round} title={`${round}라운드`} style={{ marginBottom: 16 }}>
                {matches
                  .filter((m) => m.round === round)
                  .map((match) => (
                    <div
                      key={match.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 0',
                        borderBottom: '1px solid #f0f0f0',
                      }}
                    >
                      <Text strong style={{ flex: 1 }}>
                        {participantMap[match.player1_id] || '?'}
                      </Text>
                      <div style={{ textAlign: 'center', minWidth: 120 }}>
                        {match.status === 'finished' ? (
                          <Tag color="blue">
                            {match.score_player1} : {match.score_player2}
                          </Tag>
                        ) : (
                          <Button size="small" onClick={() => setScoreModal(match)}>
                            결과 입력
                          </Button>
                        )}
                      </div>
                      <Text strong style={{ flex: 1, textAlign: 'right' }}>
                        {participantMap[match.player2_id] || '?'}
                      </Text>
                    </div>
                  ))}
              </Card>
            ))
          )}
        </div>
      ),
    },
    {
      key: 'standings',
      label: '순위표',
      children: (
        <Table
          dataSource={standings}
          rowKey="participant_id"
          size="small"
          columns={standingColumns}
          pagination={false}
        />
      ),
    },
  ]

  if (tLoading) {
    return (
      <div style={{ textAlign: 'center', padding: 48 }}>
        <Spin size="large" />
      </div>
    )
  }

  return (
    <div>
      <Title level={2}>{tournament?.name || '대회'}</Title>
      <Tabs items={tabItems} />
      <Modal
        title="경기 결과 입력"
        open={!!scoreModal}
        onOk={() => scoreForm.submit()}
        onCancel={() => {
          setScoreModal(null)
          scoreForm.resetFields()
        }}
        confirmLoading={updateScore.isPending}
      >
        {scoreModal && (
          <Form
            form={scoreForm}
            onFinish={(v) =>
              updateScore.mutate({ mId: scoreModal.id, s1: v.s1, s2: v.s2 })
            }
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                justifyContent: 'center',
              }}
            >
              <Text strong>{participantMap[scoreModal.player1_id] || '선수1'}</Text>
              <Form.Item name="s1" style={{ marginBottom: 0 }}>
                <InputNumber min={0} style={{ width: 70 }} />
              </Form.Item>
              <Text>:</Text>
              <Form.Item name="s2" style={{ marginBottom: 0 }}>
                <InputNumber min={0} style={{ width: 70 }} />
              </Form.Item>
              <Text strong>{participantMap[scoreModal.player2_id] || '선수2'}</Text>
            </div>
          </Form>
        )}
      </Modal>
    </div>
  )
}
