import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Tabs, Upload, Button, Image, Row, Col, Select, message,
  Typography, Spin, Tag, Card, Empty, Checkbox, Tooltip,
} from 'antd'
import {
  UploadOutlined, VideoCameraOutlined, DeleteOutlined,
  CheckSquareOutlined, BorderOutlined,
} from '@ant-design/icons'
import { galleryApi } from '@/api/gallery'
import type { GalleryPhoto, GalleryVideo } from '@/types'
import { formatDate } from '@/utils/dday'

const { Title, Text } = Typography

const STATUS_COLOR: Record<string, string> = {
  pending: 'orange',
  processing: 'blue',
  done: 'green',
  failed: 'red',
}
const STATUS_LABEL: Record<string, string> = {
  pending: '대기중',
  processing: '처리중',
  done: '완료',
  failed: '실패',
}

export default function GalleryPage() {
  const { clubId } = useParams<{ clubId: string }>()
  const id = Number(clubId)
  const [selectedPhotos, setSelectedPhotos] = useState<number[]>([])
  const [transition, setTransition] = useState<string>('fade')
  const [videoTitle, setVideoTitle] = useState<string>('')
  const qc = useQueryClient()

  const { data: photosData, isLoading: photosLoading } = useQuery({
    queryKey: ['photos', id],
    queryFn: () => galleryApi.listPhotos(id),
  })
  const { data: videosData, isLoading: videosLoading } = useQuery({
    queryKey: ['videos', id],
    queryFn: () => galleryApi.listVideos(id),
  })

  const photos: GalleryPhoto[] = photosData?.data?.data || []
  const videos: GalleryVideo[] = videosData?.data?.data || []

  const upload = useMutation({
    mutationFn: (file: File) => galleryApi.uploadPhoto(id, file),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['photos', id] })
      message.success('사진이 업로드되었습니다.')
    },
    onError: () => message.error('업로드에 실패했습니다.'),
  })

  const deletePhoto = useMutation({
    mutationFn: (photoId: number) => galleryApi.deletePhoto(id, photoId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['photos', id] })
      setSelectedPhotos((prev) => prev.filter((x) => x !== id))
      message.success('사진이 삭제되었습니다.')
    },
    onError: () => message.error('삭제에 실패했습니다.'),
  })

  const generateVideo = useMutation({
    mutationFn: () =>
      galleryApi.generateVideo(id, {
        title: videoTitle || undefined,
        photo_ids: selectedPhotos,
        transition,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['videos', id] })
      setSelectedPhotos([])
      setVideoTitle('')
      message.success('영상 생성이 요청되었습니다. 잠시 후 영상 탭에서 확인하세요.')
    },
    onError: () => message.error('영상 생성 요청에 실패했습니다.'),
  })

  const togglePhoto = (photoId: number) => {
    setSelectedPhotos((prev) =>
      prev.includes(photoId) ? prev.filter((x) => x !== photoId) : [...prev, photoId]
    )
  }

  const selectAll = () => setSelectedPhotos(photos.map((p) => p.id))
  const clearAll = () => setSelectedPhotos([])

  const tabItems = [
    {
      key: 'photos',
      label: `사진 (${photos.length})`,
      children: (
        <div>
          {/* 액션 바 */}
          <div className="flex flex-wrap gap-3 mb-4 items-center">
            <Upload
              showUploadList={false}
              beforeUpload={(file) => {
                upload.mutate(file)
                return false
              }}
              accept="image/*"
              multiple
            >
              <Button icon={<UploadOutlined />} loading={upload.isPending}>
                사진 업로드
              </Button>
            </Upload>
            {photos.length > 0 && (
              <>
                <Button
                  icon={<CheckSquareOutlined />}
                  onClick={selectedPhotos.length === photos.length ? clearAll : selectAll}
                  size="small"
                >
                  {selectedPhotos.length === photos.length ? '전체 해제' : '전체 선택'}
                </Button>
              </>
            )}
          </div>

          {/* 선택 영상 생성 패널 */}
          {selectedPhotos.length > 0 && (
            <div className="mb-4 p-4 bg-blue-50 rounded-lg flex flex-wrap gap-3 items-center">
              <Text strong>{selectedPhotos.length}장 선택됨</Text>
              <input
                type="text"
                placeholder="영상 제목 (선택)"
                value={videoTitle}
                onChange={(e) => setVideoTitle(e.target.value)}
                className="px-3 py-1 border rounded text-sm"
              />
              <Select
                value={transition}
                onChange={setTransition}
                size="small"
                options={[
                  { value: 'fade', label: '페이드' },
                  { value: 'slide', label: '슬라이드' },
                  { value: 'zoom', label: '줌' },
                ]}
                style={{ width: 100 }}
              />
              <Button
                type="primary"
                icon={<VideoCameraOutlined />}
                size="small"
                loading={generateVideo.isPending}
                onClick={() => generateVideo.mutate()}
              >
                영상 만들기
              </Button>
              <Button size="small" onClick={clearAll}>취소</Button>
            </div>
          )}

          {/* 사진 그리드 */}
          {photosLoading ? (
            <div className="flex justify-center py-16"><Spin size="large" /></div>
          ) : photos.length === 0 ? (
            <Empty description="업로드된 사진이 없습니다" className="py-16" />
          ) : (
            <Row gutter={[8, 8]}>
              {photos.map((photo) => {
                const selected = selectedPhotos.includes(photo.id)
                return (
                  <Col key={photo.id} xs={12} sm={8} md={6} lg={4}>
                    <div
                      className={`relative cursor-pointer rounded overflow-hidden border-2 transition-all ${
                        selected ? 'border-blue-500 shadow-lg' : 'border-transparent'
                      }`}
                      onClick={() => togglePhoto(photo.id)}
                    >
                      <Image
                        src={photo.file_url}
                        alt={photo.file_name}
                        preview={false}
                        className="w-full object-cover"
                        style={{ height: 100, objectFit: 'cover' }}
                      />
                      {selected && (
                        <div className="absolute top-1 left-1 bg-blue-500 rounded text-white w-5 h-5 flex items-center justify-center text-xs">
                          ✓
                        </div>
                      )}
                      <Tooltip title="삭제">
                        <Button
                          size="small"
                          danger
                          icon={<DeleteOutlined />}
                          className="absolute top-1 right-1 opacity-0 hover:opacity-100"
                          style={{ opacity: undefined }}
                          onClick={(e) => {
                            e.stopPropagation()
                            deletePhoto.mutate(photo.id)
                          }}
                        />
                      </Tooltip>
                    </div>
                  </Col>
                )
              })}
            </Row>
          )}
        </div>
      ),
    },
    {
      key: 'videos',
      label: `영상 (${videos.length})`,
      children: (
        <div>
          {videosLoading ? (
            <div className="flex justify-center py-16"><Spin size="large" /></div>
          ) : videos.length === 0 ? (
            <Empty description="생성된 영상이 없습니다. 사진을 선택해 영상을 만들어보세요." className="py-16" />
          ) : (
            <Row gutter={[16, 16]}>
              {videos.map((video) => (
                <Col key={video.id} xs={24} sm={12} lg={8}>
                  <Card
                    title={video.title || '영상'}
                    extra={
                      <Tag color={STATUS_COLOR[video.status]}>
                        {STATUS_LABEL[video.status]}
                      </Tag>
                    }
                    size="small"
                  >
                    {video.status === 'done' && video.video_url ? (
                      <video
                        src={video.video_url}
                        controls
                        className="w-full rounded"
                        style={{ maxHeight: 200 }}
                      />
                    ) : video.status === 'processing' ? (
                      <div className="h-32 flex flex-col items-center justify-center bg-gray-50 rounded">
                        <Spin />
                        <Text type="secondary" className="mt-2 text-sm">영상 생성 중...</Text>
                      </div>
                    ) : (
                      <div className="h-32 flex items-center justify-center bg-gray-50 rounded">
                        <Text type="secondary">{STATUS_LABEL[video.status]}</Text>
                      </div>
                    )}
                    <div className="mt-2 text-xs text-gray-400">
                      {formatDate(video.created_at)}
                      {video.bgm_name && ` · BGM: ${video.bgm_name}`}
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </div>
      ),
    },
  ]

  return (
    <div>
      <Title level={2}>갤러리</Title>
      <Tabs items={tabItems} />
    </div>
  )
}
