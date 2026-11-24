import { useEffect, useRef, useState } from 'react'
import { Spin, Alert } from 'antd'
import type { Club } from '@/types'

// Kakao Maps 전역 타입
declare global {
  interface Window {
    kakao: {
      maps: {
        load: (callback: () => void) => void
        Map: new (container: HTMLElement, options: object) => KakaoMap
        Marker: new (options: object) => KakaoMarker
        InfoWindow: new (options: object) => KakaoInfoWindow
        LatLng: new (lat: number, lng: number) => KakaoLatLng
        LatLngBounds: new () => KakaoLatLngBounds
        event: {
          addListener: (target: object, type: string, handler: () => void) => void
        }
        services: {
          Geocoder: new () => KakaoGeocoder
          Status: { OK: string }
        }
      }
    }
  }
}

interface KakaoMap {
  setCenter: (latlng: KakaoLatLng) => void
  setBounds: (bounds: KakaoLatLngBounds) => void
  getCenter: () => KakaoLatLng
}
interface KakaoMarker {
  setMap: (map: KakaoMap | null) => void
  getPosition: () => KakaoLatLng
  setTitle: (title: string) => void
  addListener?: (event: string, cb: () => void) => void
}
interface KakaoInfoWindow {
  open: (map: KakaoMap, marker: KakaoMarker) => void
  close: () => void
}
interface KakaoLatLng {
  getLat: () => number
  getLng: () => number
}
interface KakaoLatLngBounds {
  extend: (latlng: KakaoLatLng) => void
}
interface KakaoGeocoder {
  addressSearch: (
    address: string,
    callback: (result: Array<{ x: string; y: string }>, status: string) => void
  ) => void
}

interface Props {
  clubs: Club[]
  onClubClick?: (club: Club) => void
}

interface ClubWithCoords extends Club {
  lat: number
  lng: number
}

export default function KakaoClubMap({ clubs, onClubClick }: Props) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const appKey = import.meta.env.VITE_KAKAO_MAP_API_KEY

  useEffect(() => {
    if (!appKey) {
      setError('VITE_KAKAO_MAP_API_KEY 환경변수가 설정되지 않았습니다.')
      setLoading(false)
      return
    }

    const clubsWithAddress = clubs.filter((c) => c.gym_address || (c.latitude && c.longitude))
    if (clubsWithAddress.length === 0) {
      setLoading(false)
      return
    }

    // autoload=false 이므로 kakao.maps.load()로 초기화
    const initMap = () => {
      window.kakao.maps.load(async () => {
        if (!mapRef.current) return

        const map = new window.kakao.maps.Map(mapRef.current, {
          center: new window.kakao.maps.LatLng(37.5665, 126.978),
          level: 8,
        })

        // 주소 → 위경도 변환 (DB에 이미 있으면 바로 사용)
        const geocoder = new window.kakao.maps.services.Geocoder()

        const geocodeClub = (club: Club): Promise<ClubWithCoords | null> => {
          return new Promise((resolve) => {
            // DB에 위경도가 이미 저장된 경우
            if (club.latitude && club.longitude) {
              resolve({ ...club, lat: club.latitude, lng: club.longitude })
              return
            }
            // 도로명 주소로 지오코딩
            if (!club.gym_address) { resolve(null); return }
            geocoder.addressSearch(club.gym_address, (result, status) => {
              if (status === window.kakao.maps.services.Status.OK && result.length > 0) {
                resolve({ ...club, lat: parseFloat(result[0].y), lng: parseFloat(result[0].x) })
              } else {
                resolve(null)
              }
            })
          })
        }

        const resolved = await Promise.all(clubs.map(geocodeClub))
        const clubsWithCoords = resolved.filter((c): c is ClubWithCoords => c !== null)

        if (clubsWithCoords.length === 0) {
          setLoading(false)
          return
        }

        const bounds = new window.kakao.maps.LatLngBounds()
        let openInfo: KakaoInfoWindow | null = null

        clubsWithCoords.forEach((club) => {
          const position = new window.kakao.maps.LatLng(club.lat, club.lng)
          bounds.extend(position)

          const marker = new window.kakao.maps.Marker({ position, map })
          marker.setTitle(club.name)

          const content = `
            <div style="padding:10px 14px;min-width:180px;max-width:240px;font-size:13px;line-height:1.6;">
              <div style="font-weight:700;font-size:14px;margin-bottom:4px;">${club.name}</div>
              ${club.gym_name ? `<div style="color:#555;">📍 ${club.gym_name}</div>` : ''}
              ${club.gym_address ? `<div style="color:#888;font-size:12px;">${club.gym_address}</div>` : ''}
              ${club.monthly_fee > 0 ? `<div style="margin-top:4px;color:#1677ff;">월회비 ${club.monthly_fee.toLocaleString()}원</div>` : ''}
              <div style="margin-top:8px;">
                <a href="/clubs/${club.id}" style="color:#1677ff;font-weight:600;text-decoration:none;">클럽 보기 →</a>
              </div>
            </div>
          `
          const infoWindow = new window.kakao.maps.InfoWindow({
            content,
            removable: true,
          })

          // marker click → InfoWindow 열기
          window.kakao.maps.event.addListener(marker, 'click', () => {
            if (openInfo) openInfo.close()
            openInfo = infoWindow
            infoWindow.open(map, marker)
            onClubClick?.(club)
          })
        })

        map.setBounds(bounds)
        setLoading(false)
      })
    }

    // 이미 로드된 경우
    if (window.kakao?.maps?.load) {
      initMap()
    } else {
      setError('카카오 지도 SDK 로드에 실패했습니다. 앱 키를 확인하세요.')
      setLoading(false)
    }
  }, [clubs, appKey])

  return (
    <div style={{ position: 'relative', marginBottom: 24 }}>
      {error ? (
        <Alert type="warning" message={error} showIcon />
      ) : (
        <>
          {loading && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(255,255,255,0.7)',
                zIndex: 10,
                borderRadius: 8,
              }}
            >
              <Spin tip="지도 로딩 중..." />
            </div>
          )}
          <div
            ref={mapRef}
            style={{
              width: '100%',
              height: 400,
              borderRadius: 8,
              border: '1px solid #e8e8e8',
              background: '#f5f5f5',
            }}
          />
        </>
      )}
    </div>
  )
}

