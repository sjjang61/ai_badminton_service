import { useEffect, useRef } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { Spin, message } from 'antd'
import axios from 'axios'
import { useAuthStore } from '@/stores/authStore'
import { authApi } from '@/api/auth'

export default function CallbackPage() {
  const { provider } = useParams<{ provider: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { setTokens, setUser } = useAuthStore()
  const called = useRef(false)

  useEffect(() => {
    if (called.current) return
    called.current = true

    const code = searchParams.get('code')
    const state = searchParams.get('state')
    if (!code) {
      message.error('인증 코드가 없습니다.')
      navigate('/auth/login')
      return
    }

    const handleCallback = async () => {
      try {
        const params: Record<string, string> = { code }
        if (state) params.state = state

        const res = await axios.get(`/api/v1/auth/${provider}/callback`, { params })
        const { access_token, refresh_token, is_new_user } = res.data.data
        setTokens(access_token, refresh_token)

        const meRes = await authApi.getMe()
        setUser(meRes.data)

        if (is_new_user) {
          navigate('/register', { replace: true })
        } else {
          message.success('로그인 되었습니다.')
          navigate('/clubs', { replace: true })
        }
      } catch (e) {
        message.error('로그인에 실패했습니다.')
        navigate('/auth/login')
      }
    }

    handleCallback()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Spin size="large" tip="로그인 처리 중..." />
    </div>
  )
}
